from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta
from app import db
from app.models.project import Project, AttendanceRecord
from app.models.inspection import Inspection, Assignment
from app.models.alert import Alert
from app.models.evidence import Evidence

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Compliance score distribution
    compliance_bins = {'excellent': 0, 'good': 0, 'fair': 0, 'poor': 0}
    projects = Project.query.filter_by(is_archived=False).all()
    for p in projects:
        score = p.compliance_score or 0
        if score >= 90: compliance_bins['excellent'] += 1
        elif score >= 75: compliance_bins['good'] += 1
        elif score >= 60: compliance_bins['fair'] += 1
        else: compliance_bins['poor'] += 1

    # Risk trend (last 6 months)
    risk_by_level = db.session.query(
        Project.risk_level, func.count(Project.id)
    ).group_by(Project.risk_level).all()

    # Institution type distribution
    inst_dist = db.session.query(
        Project.institution_type, func.count(Project.id)
    ).group_by(Project.institution_type).all()

    # Inspection completion rate
    total_assigned = Assignment.query.count()
    total_completed = Assignment.query.filter_by(status='completed').count()
    completion_rate = (total_completed / total_assigned * 100) if total_assigned > 0 else 0

    # Average compliance by scheme
    scheme_compliance = db.session.query(
        Project.scheme_id, func.avg(Project.compliance_score), func.count(Project.id)
    ).group_by(Project.scheme_id).all()

    return jsonify({
        'compliance_distribution': compliance_bins,
        'risk_by_level': [{'level': r[0] or 'unknown', 'count': r[1]} for r in risk_by_level],
        'institution_type_distribution': [{'type': i[0] or 'unknown', 'count': i[1]} for i in inst_dist],
        'inspection_completion_rate': round(completion_rate, 2),
        'total_projects': len(projects),
        'scheme_compliance': [
            {'scheme_id': s[0], 'avg_compliance': round(s[1] or 0, 2), 'project_count': s[2]}
            for s in scheme_compliance
        ],
    })

@analytics_bp.route('/risk', methods=['GET'])
@jwt_required()
def risk_analysis():
    # Top 10 highest risk projects
    high_risk = Project.query.order_by(Project.risk_score.desc()).limit(10).all()

    # State-wise average risk
    state_risk = db.session.query(
        Project.state,
        func.avg(Project.risk_score),
        func.count(Project.id)
    ).group_by(Project.state).order_by(func.avg(Project.risk_score).desc()).all()

    # Overdue inspections
    now = datetime.utcnow()
    overdue = Project.query.filter(
        Project.next_inspection_due < now,
        Project.is_archived == False
    ).order_by(Project.next_inspection_due.asc()).limit(20).all()

    return jsonify({
        'high_risk_projects': [p.to_dict() for p in high_risk],
        'state_risk_summary': [
            {'state': s[0], 'avg_risk_score': round(s[1] or 0, 2), 'project_count': s[2]}
            for s in state_risk
        ],
        'overdue_inspections': [p.to_dict() for p in overdue],
    })

@analytics_bp.route('/inspections', methods=['GET'])
@jwt_required()
def inspection_analytics():
    now = datetime.utcnow()

    # Monthly trend (last 12 months)
    monthly = []
    for i in range(11, -1, -1):
        m_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        count = Inspection.query.filter(
            Inspection.created_at >= m_start,
            Inspection.created_at < m_end,
        ).count()
        completed = Inspection.query.filter(
            Inspection.submitted_at >= m_start,
            Inspection.submitted_at < m_end,
        ).count()
        monthly.append({
            'month': m_start.strftime('%b %Y'),
            'total': count,
            'completed': completed,
        })

    # By type
    by_type = db.session.query(
        Inspection.inspection_type, func.count(Inspection.id)
    ).group_by(Inspection.inspection_type).all()

    # By status
    by_status = db.session.query(
        Inspection.status, func.count(Inspection.id)
    ).group_by(Inspection.status).all()

    # Average score
    avg_score = db.session.query(func.avg(Inspection.score)).scalar()

    return jsonify({
        'monthly_trend': monthly,
        'by_type': [{'type': t[0], 'count': t[1]} for t in by_type],
        'by_status': [{'status': s[0], 'count': s[1]} for s in by_status],
        'average_score': round(avg_score or 0, 2),
    })
