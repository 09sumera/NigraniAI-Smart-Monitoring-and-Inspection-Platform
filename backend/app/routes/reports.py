from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta
import csv
import io
from app import db
from app.models.project import Project
from app.models.inspection import Inspection, Assignment
from app.models.alert import Alert
from app.models.evidence import Evidence
from app.utils.auth_utils import role_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('', methods=['GET'])
@jwt_required()
def list_reports():
    """List inspection reports for the reports view."""
    inspections = Inspection.query.order_by(Inspection.created_at.desc()).all()
    reports_data = []
    for i in inspections:
        reports_data.append({
            'id': i.id,
            'inspection_id': i.inspection_id,
            'project_name': i.project.name if i.project else 'General Facility',
            'project_state': i.project.state if i.project else 'National',
            'assigned_officer': i.assignment.officer.name if (i.assignment and i.assignment.officer) else 'Designated Officer',
            'inspection_type': i.inspection_type,
            'score': round(i.score, 1) if i.score is not None else (round(i.project.compliance_score, 1) if (i.project and i.project.compliance_score is not None) else None),
            'status': i.status,
            'created_at': i.created_at.isoformat() if i.created_at else None,
        })
    return jsonify({'reports': reports_data, 'total': len(reports_data)})

@reports_bp.route('/export/csv', methods=['GET'])
def export_csv():
    """Export inspection reports as CSV dossier."""
    inspections = Inspection.query.order_by(Inspection.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Inspection ID', 'Project Name', 'State', 'Auditing Officer', 'Type', 'Score', 'Status', 'Date'])
    for i in inspections:
        writer.writerow([
            i.inspection_id,
            i.project.name if i.project else '',
            i.project.state if i.project else '',
            i.assignment.officer.name if (i.assignment and i.assignment.officer) else 'Designated Officer',
            i.inspection_type,
            i.score if i.score is not None else '',
            i.status,
            i.created_at.strftime('%Y-%m-%d %H:%M') if i.created_at else ''
        ])
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=nigrani_inspection_reports.csv'}
    )

@reports_bp.route('/summary', methods=['GET'])
@role_required('admin', 'official', 'auditor')
def summary_report():
    """Generate a high-level summary report."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_projects = Project.query.filter_by(is_archived=False).count()
    active_projects = Project.query.filter_by(status='active', is_archived=False).count()

    # Inspections this month
    insp_month = Inspection.query.filter(Inspection.created_at >= month_start).count()
    insp_completed = Inspection.query.filter(
        Inspection.submitted_at >= month_start,
        Inspection.status.in_(['submitted', 'approved', 'closed'])
    ).count()

    # Risk breakdown
    risk_dist = db.session.query(
        Project.risk_level, func.count(Project.id)
    ).filter_by(is_archived=False).group_by(Project.risk_level).all()

    # Compliance averages by state
    state_compliance = db.session.query(
        Project.state,
        func.avg(Project.compliance_score),
        func.count(Project.id)
    ).filter_by(is_archived=False).group_by(Project.state).order_by(
        func.avg(Project.compliance_score).asc()
    ).all()

    # Open alerts by severity
    alert_dist = db.session.query(
        Alert.severity, func.count(Alert.id)
    ).filter_by(status='open').group_by(Alert.severity).all()

    # Evidence summary
    evidence_summary = db.session.query(
        Evidence.verification_status, func.count(Evidence.id)
    ).group_by(Evidence.verification_status).all()

    return jsonify({
        'generated_at': now.isoformat(),
        'period': f"{month_start.strftime('%B %Y')}",
        'projects': {
            'total': total_projects,
            'active': active_projects,
            'risk_distribution': [{'level': r[0] or 'unknown', 'count': r[1]} for r in risk_dist],
        },
        'inspections': {
            'this_month_total': insp_month,
            'this_month_completed': insp_completed,
            'completion_rate': round((insp_completed / insp_month * 100) if insp_month > 0 else 0, 2),
        },
        'state_compliance': [
            {
                'state': s[0],
                'avg_compliance': round(s[1] or 0, 2),
                'project_count': s[2]
            } for s in state_compliance
        ],
        'open_alerts_by_severity': [{'severity': a[0], 'count': a[1]} for a in alert_dist],
        'evidence_status': [{'status': e[0], 'count': e[1]} for e in evidence_summary],
    })

@reports_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def project_report(project_id):
    """Detailed report for a single project."""
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    inspections = Inspection.query.filter_by(project_id=project_id).order_by(
        Inspection.created_at.desc()
    ).limit(20).all()

    alerts = Alert.query.filter_by(project_id=project_id).order_by(
        Alert.created_at.desc()
    ).limit(10).all()

    evidence = Evidence.query.filter_by(project_id=project_id).count()
    evidence_verified = Evidence.query.filter_by(
        project_id=project_id, verification_status='verified'
    ).count()

    return jsonify({
        'generated_at': datetime.utcnow().isoformat(),
        'project': project.to_dict(),
        'inspection_history': [i.to_dict() for i in inspections],
        'alerts': [a.to_dict() for a in alerts],
        'evidence_summary': {
            'total': evidence,
            'verified': evidence_verified,
        },
    })

@reports_bp.route('/compliance', methods=['GET'])
@jwt_required()
def compliance_report():
    """State and district level compliance report."""
    projects = Project.query.filter_by(is_archived=False).all()

    state_map = {}
    for p in projects:
        if p.state not in state_map:
            state_map[p.state] = {'projects': [], 'scores': []}
        state_map[p.state]['projects'].append(p.to_dict())
        if p.compliance_score is not None:
            state_map[p.state]['scores'].append(p.compliance_score)

    result = []
    for state, data in state_map.items():
        scores = data['scores']
        result.append({
            'state': state,
            'project_count': len(data['projects']),
            'avg_compliance': round(sum(scores) / len(scores), 2) if scores else 0,
            'min_compliance': round(min(scores), 2) if scores else 0,
            'max_compliance': round(max(scores), 2) if scores else 0,
            'below_60': sum(1 for s in scores if s < 60),
        })

    result.sort(key=lambda x: x['avg_compliance'])
    return jsonify({'compliance_by_state': result, 'generated_at': datetime.utcnow().isoformat()})
