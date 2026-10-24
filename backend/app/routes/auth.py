from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.user import User
from app.utils.auth_utils import log_action

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid or missing JSON payload'}), 400

    email = data.get('email', '')
    if isinstance(email, str):
        email = email.lower().strip()
    else:
        email = ''

    password = data.get('password', '')
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    log_action(user.id, 'LOGIN', 'user', user.id, f'Login from {request.remote_addr}')

    return jsonify({
        'access_token': token,
        'user': user.to_dict(),
        'role': user.role.name if user.role else None
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    from app.utils.auth_utils import get_current_user
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    from app.utils.auth_utils import get_current_user
    user = get_current_user()
    if user:
        log_action(user.id, 'LOGOUT', 'user', user.id)
    return jsonify({'message': 'Logged out successfully'})
