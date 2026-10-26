from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.inspection import Assignment, Inspection
from app.models.project import Project
from app.models.user import User
from app.utils.auth_utils import role_required, log_action
from app.services.inspection_engine import InspectionEngine
import random, string

assignments_bp = Blueprint('assignments', __name__)

def gen_inspection_id():
    return 'INS' + ''.join(random.choices(string.digits, k=7))

@assignments_bp.route('/generate', methods=['POST'])
@role_required('admin', 'official')
def generate_surprise_inspection():
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    simulation_mode = data.get('simulation_mode', True)
    state_filter = data.get('state')

    engine = InspectionEngine()
    result = engine.generate_surprise_inspection(user_id, state=state_filter)
    if 'error' in result:
        return jsonify(result), 400

    assignment = result['assignment']
    inspection_id = gen_inspection_id()
    inspection = Inspection(
        inspection_id=inspection_id,
        project_id=assignment.project_id,
        assignment_id=assignment.id,
        inspection_type='surprise',
        status='assigned',
    )
    db.session.add(inspection)
    db.session.commit()
    db.session.refresh(assignment)

    log_action(user_id, 'GENERATE_SURPRISE_INSPECTION', 'assignment', assignment.id,
               f'Assigned to officer {assignment.officer_id} for project {assignment.project_id}')

    return jsonify({
        'assignment': assignment.to_dict(),
        'inspection_id': inspection_id,
        'inspection': inspection.to_dict(),
        'selection_reason': result['reason'],
        'algorithm': result['algorithm'],
        'composite_score': result.get('composite_score'),
        'candidate_pool_size': result.get('candidate_pool_size', 1),
        'simulation_mode': simulation_mode,
    }), 201

@assignments_bp.route('', methods=['GET'])
@jwt_required()
def list_assignments():
    q = Assignment.query
    status = request.args.get('status')
    officer_id = request.args.get('officer_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    if status: q = q.filter(Assignment.status == status)
    if officer_id: q = q.filter(Assignment.officer_id == int(officer_id))
    paginated = q.order_by(Assignment.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'assignments': [a.to_dict() for a in paginated.items],
        'total': paginated.total,
    })

@assignments_bp.route('/manual', methods=['POST'])
@role_required('admin', 'official')
def manual_assignment():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    project = db.session.get(Project, data['project_id'])
    officer = db.session.get(User, data['officer_id'])
    if not project or not officer:
        return jsonify({'error': 'Invalid project or officer'}), 400

    assignment = Assignment(
        project_id=project.id,
        officer_id=officer.id,
        created_by=user_id,
        inspection_type=data.get('inspection_type', 'scheduled'),
        assignment_reason=data.get('reason', 'Manual assignment by administrator'),
        risk_score_at_assignment=project.risk_score,
        is_announced=data.get('is_announced', True),
        scheduled_at=datetime.fromisoformat(data['scheduled_at']) if data.get('scheduled_at') else None,
    )
    db.session.add(assignment)
    db.session.commit()

    inspection = Inspection(
        inspection_id=gen_inspection_id(),
        project_id=project.id,
        assignment_id=assignment.id,
        inspection_type=data.get('inspection_type', 'scheduled'),
        status='assigned',
        planned_at=assignment.scheduled_at,
    )
    db.session.add(inspection)
    db.session.commit()
    log_action(user_id, 'MANUAL_ASSIGNMENT', 'assignment', assignment.id)
    return jsonify(assignment.to_dict()), 201
