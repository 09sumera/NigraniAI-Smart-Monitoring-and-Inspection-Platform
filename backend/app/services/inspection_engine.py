"""
InspectionEngine — Core AI-assisted surprise inspection selection engine.

Uses a multi-factor risk algorithm combining:
  - Base risk score (from AI risk analytics)
  - Statutory inspection schedule / recency / overdue days
  - Non-compliance deficit (100 - compliance score)
  - Unresolved open alert count
  - Staff & beneficiary attendance anomalies

Features:
  - Dynamic eligibility filtering (excludes archived, inactive, and units with active pending inspections)
  - Risk-weighted probabilistic candidate selection to avoid perpetual repeats
  - Fair inclusion of newly registered units under routine baseline audit requirements
  - Officer rotation enforcement (anti-familiarity bias) and workload balancing
"""

import random
from datetime import datetime, timedelta
from app import db
from app.models.project import Project
from app.models.user import User, Role
from app.models.inspection import Assignment, Inspection


class InspectionEngine:
    """
    Selects a project and assigns a field officer for a surprise inspection
    using a multi-factor risk algorithm and risk-weighted candidate selection.
    """

    WEIGHT_RISK_SCORE = 0.25
    WEIGHT_OVERDUE = 0.25
    WEIGHT_COMPLIANCE = 0.20
    WEIGHT_ALERT_COUNT = 0.15
    WEIGHT_ATTENDANCE = 0.15

    TERMINAL_INSPECTION_STATUSES = {'closed', 'approved', 'rejected', 'cancelled', 'completed'}

    def _get_dynamic_weights(self) -> dict:
        """Loads runtime hyperparameters from SystemSetting database table."""
        try:
            from app.models.settings import SystemSetting
            risk_influence = float(SystemSetting.get_setting('risk_factor_influence', '70')) / 100.0
            random_factor = float(SystemSetting.get_setting('randomization_factor', '30')) / 100.0
            w_overdue = float(SystemSetting.get_setting('overdue_weight', '25')) / 100.0
            w_comp = float(SystemSetting.get_setting('compliance_weight', '20')) / 100.0
            w_alert = float(SystemSetting.get_setting('alert_weight', '15')) / 100.0
            w_att = float(SystemSetting.get_setting('attendance_weight', '15')) / 100.0
            return {
                'risk_influence': risk_influence,
                'random_factor': random_factor,
                'w_overdue': w_overdue,
                'w_comp': w_comp,
                'w_alert': w_alert,
                'w_att': w_att,
            }
        except Exception:
            return {
                'risk_influence': 0.70,
                'random_factor': 0.30,
                'w_overdue': 0.25,
                'w_comp': 0.20,
                'w_alert': 0.15,
                'w_att': 0.15,
            }

    def is_project_eligible(self, project: Project) -> bool:
        """
        Determines whether an active project is eligible for a new surprise inspection.
        Returns False if the project has an active/pending inspection or ongoing uncompleted assignment.
        Returns True if the project has no inspections OR if all previous inspections/assignments
        are completed, closed, approved, rejected, or cancelled.
        """
        # Active inspections: any inspection whose status is not terminal
        for i in project.inspections:
            status = (i.status or '').strip().lower()
            if status not in self.TERMINAL_INSPECTION_STATUSES:
                return False

        # Assignments: if linked to an inspection, the inspection status determines if it's active.
        # If unlinked, check the assignment's own status.
        for a in project.assignments:
            if a.inspection:
                insp_status = (a.inspection.status or '').strip().lower()
                if insp_status not in self.TERMINAL_INSPECTION_STATUSES:
                    return False
            else:
                asn_status = (a.status or '').strip().lower()
                if asn_status in ('pending', 'accepted', 'in_progress'):
                    return False

        return True

    def _compute_project_score(self, project: Project) -> tuple:
        """
        Compute a composite priority score for a project based on real risk factors.
        Returns (composite_score, factor_breakdown).
        Higher = more urgent / higher priority for surprise inspection.
        """
        now = datetime.utcnow()
        factors = {}

        # 1. Base Risk score component (0–100 normalised)
        risk = project.risk_score or 0.0
        risk_norm = min(max(float(risk), 0.0), 100.0)
        factors['risk_score'] = risk_norm

        # 2. Overdue / Recency component
        if project.next_inspection_due and project.next_inspection_due < now:
            days_overdue = (now - project.next_inspection_due).days
            overdue_score = min(max(days_overdue, 0) * 2.0, 100.0)
            factors['overdue_days'] = days_overdue
            factors['overdue_type'] = 'scheduled_overdue'
        elif project.last_inspection_date:
            days_since = (now - project.last_inspection_date).days
            if days_since < 14:
                overdue_score = 5.0  # very recently inspected, lower urgency
            else:
                overdue_score = min(days_since * 0.8, 80.0)
            factors['days_since_last_inspection'] = days_since
            factors['overdue_type'] = 'periodic_cycle'
        else:
            # Never inspected: requires baseline initial verification audit
            overdue_score = 50.0
            factors['overdue_type'] = 'never_inspected'
        factors['overdue_score'] = overdue_score

        # 3. Compliance deficit (lower compliance = higher priority)
        compliance = project.compliance_score if project.compliance_score is not None else 100.0
        compliance_deficit = max(0.0, 100.0 - float(compliance))
        factors['compliance_deficit'] = compliance_deficit
        factors['compliance_score'] = compliance

        # 4. Open unresolved alerts count (5 alerts = 100 points)
        open_alerts = len([a for a in project.alerts if a.status == 'open'])
        alert_score = min(open_alerts * 20.0, 100.0)
        factors['open_alerts'] = open_alerts
        factors['alert_score'] = alert_score

        # 5. Attendance anomalies (5 anomalous records = 100 points)
        anomalous_records = len([r for r in project.attendance_records if r.is_anomalous])
        attendance_score = min(anomalous_records * 20.0, 100.0)
        factors['attendance_anomalies'] = anomalous_records
        factors['attendance_score'] = attendance_score

        # Composite score using dynamic weights from system settings
        dyn = self._get_dynamic_weights()
        score = (
            self.WEIGHT_RISK_SCORE * risk_norm +
            dyn['w_overdue'] * overdue_score +
            dyn['w_comp'] * compliance_deficit +
            dyn['w_alert'] * alert_score +
            dyn['w_att'] * attendance_score
        )

        return round(score, 4), factors

    def _build_selection_reason(self, project: Project, factors: dict, candidate_count: int) -> str:
        """Constructs an explanatory, transparent audit justification."""
        reasons = []

        if project.risk_level in ('high', 'critical'):
            reasons.append(f"Risk tier: {project.risk_level.upper()} (score: {project.risk_score:.1f})")

        overdue_type = factors.get('overdue_type')
        if overdue_type == 'scheduled_overdue':
            days = factors.get('overdue_days', 0)
            reasons.append(f"Statutory audit overdue by {days} days")
        elif overdue_type == 'never_inspected':
            reasons.append("Unit never inspected (initial baseline audit requirement)")
        elif factors.get('days_since_last_inspection', 0) > 90:
            reasons.append(f"{factors.get('days_since_last_inspection')} days since previous inspection")

        anom = factors.get('attendance_anomalies', 0)
        if anom > 0:
            reasons.append(f"{anom} anomalous attendance record(s) flagged")

        open_alerts = factors.get('open_alerts', 0)
        if open_alerts > 0:
            reasons.append(f"{open_alerts} open unresolved compliance alert(s)")

        comp = factors.get('compliance_score', 100.0)
        if comp < 80.0:
            reasons.append(f"Sub-optimal compliance index: {comp:.1f}%")

        if not reasons:
            reasons.append("Eligible active institution under routine non-predictable audit rotation")

        reasons.append(f"Risk-weighted random selection across {candidate_count} eligible units")
        return "; ".join(reasons)

    def _select_project(self, state: str = None) -> tuple:
        """
        Selects an eligible project from the database using risk-weighted random selection.
        Returns (project, composite_score, reason, candidate_pool_size).
        """
        q = Project.query.filter_by(is_archived=False, status='active')
        if state:
            q = q.filter(Project.state == state)
        active_projects = q.all()

        if not active_projects:
            msg = f"No active registered projects found in database{f' for state {state}' if state else ''}."
            return None, 0, msg, 0

        # Eligibility filter: candidate must NOT have an active assignment or ongoing inspection
        eligible = [p for p in active_projects if self.is_project_eligible(p)]

        if not eligible:
            msg = "No eligible institutions available: all active institutions currently have pending or active inspections. An institution becomes eligible again once its previous inspection is completed or closed."
            return None, 0, msg, 0

        # Score all eligible projects
        scored = []
        for p in eligible:
            score, factors = self._compute_project_score(p)
            scored.append((p, score, factors))

        # Risk-weighted selection governed by system settings hyperparameters:
        dyn = self._get_dynamic_weights()
        risk_inf = dyn['risk_influence']
        rand_fac = dyn['random_factor']

        # Blend composite risk score with uniform random baseline:
        weights = [max((risk_inf * item[1]) + (rand_fac * 25.0), 2.0) for item in scored]
        candidates = [item[0] for item in scored]

        selected_project = random.choices(candidates, weights=weights, k=1)[0]
        selected_item = next(item for item in scored if item[0].id == selected_project.id)
        selected_score = selected_item[1]
        selected_factors = selected_item[2]

        reason = self._build_selection_reason(selected_project, selected_factors, len(eligible))
        return selected_project, selected_score, reason, len(eligible)

    def _select_officer(self, project: Project, created_by: int) -> User:
        """
        Selects an eligible field officer for the project.
        Features:
          - Officer active status & load balancing
          - Geographic state preference when available
          - Rotation enforcement: excludes officers who inspected this unit in the last 180 days
        """
        officer_role = Role.query.filter_by(name='officer').first()
        if not officer_role:
            return None

        all_officers = User.query.filter_by(
            role_id=officer_role.id, is_active=True
        ).all()

        if not all_officers:
            return None

        def active_load(officer):
            return Assignment.query.filter_by(
                officer_id=officer.id,
                status='pending'
            ).count()

        # Officers with fewer than 3 pending assignments are preferred
        underloaded = [o for o in all_officers if active_load(o) < 3]
        pool = underloaded if underloaded else all_officers

        # Prefer same-state officers if any exist in the candidate pool
        same_state = [o for o in pool if o.state == project.state]
        state_pool = same_state if same_state else pool

        # Rotation enforcement: exclude officers who inspected this unit in the last 180 days
        now = datetime.utcnow()
        recent_cutoff = now - timedelta(days=180)
        recent_officer_ids = {
            a.officer_id for a in project.assignments
            if a.created_at and a.created_at >= recent_cutoff
        }
        unbiased_pool = [o for o in state_pool if o.id not in recent_officer_ids]
        final_pool = unbiased_pool if unbiased_pool else state_pool

        if not final_pool:
            return None

        # Prioritize officers with lowest current load
        final_pool.sort(key=lambda o: active_load(o))
        min_load = active_load(final_pool[0])
        best_candidates = [o for o in final_pool if active_load(o) == min_load]

        return random.choice(best_candidates)

    def generate_surprise_inspection(self, created_by: int, state: str = None) -> dict:
        """
        Main entry point. Selects project + officer and creates an Assignment.
        Returns a dict with 'assignment', 'reason', 'algorithm', 'composite_score', 'candidate_pool_size'
        or {'error': str} on failure.
        """
        project, score, reason, candidate_pool_size = self._select_project(state=state)
        if not project:
            return {'error': reason}

        officer = self._select_officer(project, created_by)
        if not officer:
            return {'error': 'No eligible field officers available to conduct inspections.'}

        assignment = Assignment(
            project_id=project.id,
            officer_id=officer.id,
            created_by=created_by,
            inspection_type='surprise',
            assignment_reason=reason,
            risk_score_at_assignment=round(score, 2),
            status='pending',
            is_announced=False,
        )
        db.session.add(assignment)
        db.session.commit()

        return {
            'assignment': assignment,
            'reason': reason,
            'algorithm': 'risk_weighted_multi_factor_v2',
            'composite_score': score,
            'candidate_pool_size': candidate_pool_size,
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
            risk += max(0.0, 100.0 - compliance) * 0.4

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

            risk = round(min(risk, 100.0), 2)
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
