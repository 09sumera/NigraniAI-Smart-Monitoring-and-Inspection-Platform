from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.inspection import Inspection, Assignment, ChecklistResponse
from app.models.project import Project
from app.utils.auth_utils import role_required, log_action, get_current_user

inspections_bp = Blueprint('inspections', __name__)

VALID_TRANSITIONS = {
    'assigned': ['in_progress', 'cancelled'],
    'in_progress': ['submitted'],
    'submitted': ['under_review', 'approved'],
    'under_review': ['approved', 'rejected'],
    'approved': ['closed'],
    'rejected': ['in_progress'],
}

@inspections_bp.route('', methods=['GET'])
@jwt_required()
def list_inspections():
    user = get_current_user()
    q = Inspection.query
    if user.role.name == 'officer':
        # Officer only sees their own
        officer_assignment_ids = [a.id for a in Assignment.query.filter_by(officer_id=user.id).all()]
        q = q.filter(Inspection.assignment_id.in_(officer_assignment_ids))

    status = request.args.get('status')
    project_id = request.args.get('project_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if status: q = q.filter(Inspection.status == status)
    if project_id: q = q.filter(Inspection.project_id == int(project_id))

    paginated = q.order_by(Inspection.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'inspections': [i.to_dict() for i in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })

@inspections_bp.route('/<int:inspection_id>', methods=['GET'])
@jwt_required()
def get_inspection(inspection_id):
    i = db.session.get(Inspection, inspection_id)
    if not i: return jsonify({'error': 'Not found'}), 404
    data = i.to_dict()
    data['checklist'] = [c.to_dict() for c in i.checklist_responses]
    data['evidence'] = [e.to_dict() for e in i.evidence]
    return jsonify(data)

@inspections_bp.route('/<int:inspection_id>', methods=['PATCH'])
@jwt_required()
def update_inspection(inspection_id):
    i = db.session.get(Inspection, inspection_id)
    if not i: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()

    new_status = data.get('status')
    if new_status and new_status != i.status:
        allowed = VALID_TRANSITIONS.get(i.status, [])
        if new_status not in allowed:
            return jsonify({'error': f'Invalid transition: {i.status} -> {new_status}'}), 400
        i.status = new_status
        if new_status == 'in_progress': i.started_at = datetime.utcnow()
        if new_status == 'submitted': i.submitted_at = datetime.utcnow()
        if new_status in ['approved', 'rejected']: i.reviewed_at = datetime.utcnow()
        if new_status == 'closed': i.closed_at = datetime.utcnow()

    for field in ['observations', 'findings', 'severity', 'score', 'officer_remarks',
                  'reviewer_remarks', 'corrective_actions_required', 'corrective_actions',
                  'latitude', 'longitude']:
        if field in data: setattr(i, field, data[field])

    if 'checklist' in data:
        ChecklistResponse.query.filter_by(inspection_id=i.id).delete()
        for item in data['checklist']:
            cr = ChecklistResponse(
                inspection_id=i.id,
                category=item.get('category'),
                question=item.get('question'),
                response=item.get('response'),
                remarks=item.get('remarks'),
                severity=item.get('severity'),
            )
            db.session.add(cr)

    i.updated_at = datetime.utcnow()
    db.session.commit()

    # Update project last inspection date
    if new_status == 'submitted' and i.project:
        i.project.last_inspection_date = datetime.utcnow()
        db.session.commit()

    user_id = get_jwt_identity()
    log_action(int(user_id), f'UPDATE_INSPECTION_{(new_status or "").upper()}', 'inspection', inspection_id)
    return jsonify(i.to_dict())
