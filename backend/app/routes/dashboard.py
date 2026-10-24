from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta
from app import db
from app.models.project import Project
from app.models.inspection import Inspection, Assignment
from app.models.evidence import Evidence
from app.models.alert import Alert

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_projects = Project.query.filter_by(is_archived=False).count()
    active_institutions = Project.query.filter_by(status='active', is_archived=False).count()
    inspections_this_month = Inspection.query.filter(Inspection.submitted_at >= month_start).count()
    pending_inspections = Inspection.query.filter(Inspection.status.in_(['assigned', 'in_progress'])).count()
    high_risk_projects = Project.query.filter(Project.risk_level.in_(['high', 'critical'])).count()
    open_violations = Alert.query.filter_by(status='open').count()
    overdue_inspections = Project.query.filter(
        Project.next_inspection_due < now,
        Project.is_archived == False
    ).count()
    evidence_pending = Evidence.query.filter_by(verification_status='pending').count()

    return jsonify({
        'total_projects': total_projects,
        'active_institutions': active_institutions,
        'inspections_this_month': inspections_this_month,
        'pending_inspections': pending_inspections,
        'high_risk_projects': high_risk_projects,
        'open_violations': open_violations,
        'overdue_inspections': overdue_inspections,
        'evidence_awaiting_verification': evidence_pending,
    })

@dashboard_bp.route('/trends', methods=['GET'])
@jwt_required()
def trends():
    now = datetime.utcnow()
    # Last 6 months inspection trend
    trend_data = []
    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        completed = Inspection.query.filter(
            Inspection.submitted_at >= month_start,
            Inspection.submitted_at < month_end,
            Inspection.status.in_(['approved', 'closed', 'submitted'])
        ).count()
        pending = Assignment.query.filter(
            Assignment.created_at >= month_start,
            Assignment.created_at < month_end,
            Assignment.status == 'pending'
        ).count()
        trend_data.append({
            'month': month_start.strftime('%b %Y'),
            'completed': completed,
            'pending': pending
        })

    # Risk distribution
    risk_dist = db.session.query(Project.risk_level, func.count(Project.id)).group_by(Project.risk_level).all()
    risk_distribution = [{'level': r[0] or 'unknown', 'count': r[1]} for r in risk_dist]

    # State-wise project distribution
    state_dist = db.session.query(Project.state, func.count(Project.id)).group_by(Project.state).all()
    state_distribution = [{'state': s[0], 'count': s[1]} for s in state_dist[:10]]

    # Recent inspections
    recent_inspections = Inspection.query.order_by(Inspection.created_at.desc()).limit(10).all()
    recent = [i.to_dict() for i in recent_inspections]

    # Critical alerts
    critical_alerts = Alert.query.filter_by(status='open').filter(
        Alert.severity.in_(['high', 'critical'])
    ).order_by(Alert.created_at.desc()).limit(5).all()

    # High risk projects
    high_risk = Project.query.filter(Project.risk_level.in_(['high', 'critical'])).order_by(
        Project.risk_score.desc()).limit(8).all()

    return jsonify({
        'inspection_trend': trend_data,
        'risk_distribution': risk_distribution,
        'state_distribution': state_distribution,
        'recent_inspections': recent,
        'critical_alerts': [a.to_dict() for a in critical_alerts],
        'high_risk_projects': [p.to_dict() for p in high_risk],
    })
