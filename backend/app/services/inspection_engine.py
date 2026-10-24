"""
InspectionEngine — Core AI-assisted surprise inspection selection engine.

Uses a weighted scoring algorithm combining:
  - Risk score (from project data)
  - Days since last inspection
  - Compliance score (inverse)
  - Overdue flag
  - Attendance anomalies
  - Open alert count

Designed to be deterministic yet randomised enough to prevent predictability.
"""

import random
from datetime import datetime, timedelta
from app import db
from app.models.project import Project
from app.models.user import User, Role
from app.models.inspection import Assignment


class InspectionEngine:
    """
    Selects a project and assigns a field officer for a surprise inspection
    using a weighted multi-factor risk algorithm.
    """

    WEIGHT_RISK_SCORE = 0.35
    WEIGHT_OVERDUE = 0.25
    WEIGHT_COMPLIANCE_INVERSE = 0.20
    WEIGHT_ALERT_COUNT = 0.10
    WEIGHT_RANDOM = 0.10

    def _compute_project_score(self, project: Project) -> float:
        """Compute a priority score for a project. Higher = more urgent."""
        now = datetime.utcnow()
        score = 0.0

        # Risk score component (0–100 normalised)
        risk = project.risk_score or 0.0
        score += self.WEIGHT_RISK_SCORE * min(risk, 100)

        # Overdue component
        if project.next_inspection_due and project.next_inspection_due < now:
            days_overdue = (now - project.next_inspection_due).days
            overdue_score = min(days_overdue * 2, 100)  # cap at 100
            score += self.WEIGHT_OVERDUE * overdue_score
        elif project.last_inspection_date:
            days_since = (now - project.last_inspection_date).days
            recency_score = min(days_since, 100)
            score += self.WEIGHT_OVERDUE * recency_score * 0.5
        else:
            # Never inspected — high priority
            score += self.WEIGHT_OVERDUE * 100

        # Compliance inverse (lower compliance = higher priority)
        compliance = project.compliance_score or 100.0
        compliance_priority = max(0, 100 - compliance)
        score += self.WEIGHT_COMPLIANCE_INVERSE * compliance_priority

        # Open alert count (capped at 10)
        open_alerts = len([a for a in project.alerts if a.status == 'open'])
        score += self.WEIGHT_ALERT_COUNT * min(open_alerts * 10, 100)

        # Random factor to prevent full predictability
        score += self.WEIGHT_RANDOM * random.uniform(0, 100)

        return round(score, 4)

    def _select_project(self) -> tuple:
        """
        Selects the top-priority project from active, non-archived projects.
        Returns (project, score, reason).
        """
        projects = Project.query.filter_by(
            is_archived=False, status='active'
        ).all()

        if not projects:
            return None, 0, 'No eligible projects'

        scored = [(p, self._compute_project_score(p)) for p in projects]
        scored.sort(key=lambda x: x[1], reverse=True)

        top_project, top_score = scored[0]

        # Build reason string
        now = datetime.utcnow()
        reasons = []
        if top_project.risk_level in ('high', 'critical'):
            reasons.append(f'Risk level: {top_project.risk_level}')
        if top_project.next_inspection_due and top_project.next_inspection_due < now:
            days = (now - top_project.next_inspection_due).days
            reasons.append(f'Overdue by {days} days')
        if (top_project.compliance_score or 100) < 70:
            reasons.append(f'Low compliance score: {top_project.compliance_score:.1f}%')
        open_alerts = len([a for a in top_project.alerts if a.status == 'open'])
        if open_alerts > 0:
            reasons.append(f'{open_alerts} open alert(s)')
        if not top_project.last_inspection_date:
            reasons.append('Never inspected')

        reason = '; '.join(reasons) if reasons else 'Highest composite risk score'
        return top_project, top_score, reason

    def _select_officer(self, project: Project, created_by: int) -> User:
        """
        Selects an eligible field officer for the project.
        Prefers officers in the same state; falls back to any active officer.
        Excludes officers with 3+ active pending assignments.
        """
        officer_role = Role.query.filter_by(name='officer').first()
        if not officer_role:
            return None

        all_officers = User.query.filter_by(
            role_id=officer_role.id, is_active=True
        ).all()

        def active_load(officer):
            return Assignment.query.filter_by(
                officer_id=officer.id,
                status='pending'
            ).count()

        eligible = [o for o in all_officers if active_load(o) < 3]
        if not eligible:
            eligible = all_officers  # fallback: no load limit

        # Prefer same-state officers
        same_state = [o for o in eligible if o.state == project.state]
        pool = same_state if same_state else eligible

        if not pool:
            return None

        return random.choice(pool)

    def generate_surprise_inspection(self, created_by: int) -> dict:
        """
        Main entry point. Selects project + officer and creates an Assignment.
        Returns a dict with 'assignment', 'reason', 'algorithm' keys,
        or {'error': str} on failure.
        """
        project, score, reason = self._select_project()
        if not project:
            return {'error': reason}

        officer = self._select_officer(project, created_by)
        if not officer:
            return {'error': 'No eligible field officers available'}

        assignment = Assignment(
            project_id=project.id,
            officer_id=officer.id,
            created_by=created_by,
            inspection_type='surprise',
            assignment_reason=reason,
            risk_score_at_assignment=project.risk_score or 0.0,
            status='pending',
            is_announced=False,
        )
        db.session.add(assignment)
        db.session.commit()

        return {
            'assignment': assignment,
            'reason': reason,
            'algorithm': 'weighted_multi_factor_v1',
            'composite_score': score,
        }

    def recalculate_risk_scores(self) -> dict:
        """
        Batch recalculates risk scores for all active projects.
        Called periodically or on-demand.
        """
        projects = Project.query.filter_by(is_archived=False).all()
        updated = 0
        now = datetime.utcnow()

        for project in projects:
            risk = 0.0

            # Base from compliance
            compliance = project.compliance_score or 100.0
            risk += max(0, 100 - compliance) * 0.4

            # Overdue inspections
            if project.next_inspection_due and project.next_inspection_due < now:
                days_overdue = (now - project.next_inspection_due).days
                risk += min(days_overdue, 90) * 0.3

            # Open alerts
            open_alerts = len([a for a in project.alerts if a.status == 'open'])
            risk += min(open_alerts * 5, 30)

            # Attendance anomalies
            anomalous = len([r for r in project.attendance_records if r.is_anomalous])
            risk += min(anomalous * 3, 20)

            risk = round(min(risk, 100), 2)
            project.risk_score = risk

            # Update risk level
            if risk >= 75:
                project.risk_level = 'critical'
            elif risk >= 55:
                project.risk_level = 'high'
            elif risk >= 30:
                project.risk_level = 'moderate'
            else:
                project.risk_level = 'low'

            updated += 1

        db.session.commit()
        return {'updated': updated, 'timestamp': now.isoformat()}
