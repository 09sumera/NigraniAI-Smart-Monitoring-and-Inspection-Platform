from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.project import Project, Scheme, Camera, AttendanceRecord
from app.utils.auth_utils import role_required, log_action

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    q = Project.query.filter_by(is_archived=False)
    state = request.args.get('state')
    district = request.args.get('district')
    risk = request.args.get('risk_level')
    status = request.args.get('status')
    search = request.args.get('search')
    scheme_id = request.args.get('scheme_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if state: q = q.filter(Project.state == state)
    if district: q = q.filter(Project.district == district)
    if risk: q = q.filter(Project.risk_level == risk)
    if status: q = q.filter(Project.status == status)
    if scheme_id: q = q.filter(Project.scheme_id == int(scheme_id))
    if search: q = q.filter(
        db.or_(Project.name.ilike(f'%{search}%'),
               Project.project_id.ilike(f'%{search}%'),
               Project.institution_name.ilike(f'%{search}%'))
    )

    paginated = q.order_by(Project.risk_score.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'projects': [p.to_dict() for p in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
    })

@projects_bp.route('', methods=['POST'])
@role_required('admin', 'official')
def create_project():
    data = request.get_json()
    import random, string
    pid = 'PRJ' + ''.join(random.choices(string.digits, k=6))
    project = Project(
        project_id=pid,
        name=data['name'],
        institution_name=data.get('institution_name'),
        institution_type=data.get('institution_type'),
        scheme_id=data.get('scheme_id'),
        state=data['state'],
        district=data['district'],
        address=data.get('address'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        project_manager=data.get('project_manager'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        registered_beneficiaries=data.get('registered_beneficiaries', 0),
        sanctioned_capacity=data.get('sanctioned_capacity', 0),
        status=data.get('status', 'active'),
        compliance_score=float(data['compliance_score']) if 'compliance_score' in data and data['compliance_score'] is not None else 100.0,
        risk_score=float(data['risk_score']) if 'risk_score' in data and data['risk_score'] is not None else 0.0,
        risk_level=data.get('risk_level', 'low'),
        last_inspection_date=datetime.fromisoformat(data['last_inspection_date']) if data.get('last_inspection_date') else None,
        next_inspection_due=datetime.fromisoformat(data['next_inspection_due']) if data.get('next_inspection_due') else None,
    )
    db.session.add(project)
    db.session.commit()
    user_id = get_jwt_identity()
    log_action(int(user_id), 'CREATE_PROJECT', 'project', project.id, f'Created project {project.project_id}')
    return jsonify(project.to_dict()), 201

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    p = db.session.get(Project, project_id)
    if not p: return jsonify({'error': 'Not found'}), 404
    data = p.to_dict()
    # Include related
    data['recent_inspections'] = [i.to_dict() for i in p.inspections[-5:]]
    data['alerts'] = [a.to_dict() for a in p.alerts if a.status == 'open']
    data['cameras'] = [c.to_dict() for c in p.cameras]
    return jsonify(data)

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@role_required('admin', 'official')
def update_project(project_id):
    p = db.session.get(Project, project_id)
    if not p: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    for field in ['name', 'institution_name', 'institution_type', 'scheme_id',
                  'state', 'district', 'address', 'latitude', 'longitude',
                  'project_manager', 'contact_email', 'contact_phone',
                  'registered_beneficiaries', 'sanctioned_capacity', 'status']:
        if field in data: setattr(p, field, data[field])
    p.updated_at = datetime.utcnow()
    db.session.commit()
    user_id = get_jwt_identity()
    log_action(int(user_id), 'UPDATE_PROJECT', 'project', project_id)
    return jsonify(p.to_dict())

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@role_required('admin')
def archive_project(project_id):
    p = db.session.get(Project, project_id)
    if not p: return jsonify({'error': 'Not found'}), 404
    p.is_archived = True
    db.session.commit()
    return jsonify({'message': 'Project archived'})

@projects_bp.route('/schemes', methods=['GET'])
@jwt_required()
def list_schemes():
    schemes = Scheme.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'code': s.code} for s in schemes])
