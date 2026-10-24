from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.user import User, Role
from app.utils.auth_utils import role_required, log_action

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@role_required('admin', 'official')
def list_users():
    q = User.query
    role_name = request.args.get('role')
    state = request.args.get('state')
    is_active = request.args.get('is_active')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if role_name:
        role = Role.query.filter_by(name=role_name).first()
        if role: q = q.filter(User.role_id == role.id)
    if state: q = q.filter(User.state == state)
    if is_active is not None:
        q = q.filter(User.is_active == (is_active.lower() == 'true'))
    if search:
        q = q.filter(
            db.or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%'))
        )

    paginated = q.order_by(User.name).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'users': [u.to_dict() for u in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })

@users_bp.route('', methods=['POST'])
@role_required('admin')
def create_user():
    data = request.get_json()
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409

    role = Role.query.filter_by(name=data.get('role', 'officer')).first()
    user = User(
        name=data['name'],
        email=data['email'].lower(),
        role_id=role.id if role else None,
        phone=data.get('phone'),
        state=data.get('state'),
        district=data.get('district'),
        designation=data.get('designation'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    admin_id = int(get_jwt_identity())
    log_action(admin_id, 'CREATE_USER', 'user', user.id, f'Created user {user.email}')
    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['GET'])
@role_required('admin', 'official')
def get_user(user_id):
    u = db.session.get(User, user_id)
    if not u: return jsonify({'error': 'Not found'}), 404
    return jsonify(u.to_dict())

@users_bp.route('/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    u = db.session.get(User, user_id)
    if not u: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    for field in ['name', 'phone', 'state', 'district', 'designation']:
        if field in data: setattr(u, field, data[field])
    if 'is_active' in data: u.is_active = data['is_active']
    if 'role' in data:
        role = Role.query.filter_by(name=data['role']).first()
        if role: u.role_id = role.id
    if 'password' in data: u.set_password(data['password'])
    u.updated_at = datetime.utcnow()
    db.session.commit()
    admin_id = int(get_jwt_identity())
    log_action(admin_id, 'UPDATE_USER', 'user', user_id)
    return jsonify(u.to_dict())

@users_bp.route('/officers', methods=['GET'])
@jwt_required()
def list_officers():
    role = Role.query.filter_by(name='officer').first()
    officers = User.query.filter_by(role_id=role.id if role else 0, is_active=True).all()
    return jsonify([u.to_dict() for u in officers])
