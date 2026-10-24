from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify, request
from app.models.user import User, Role
from app import db
from app.models.audit import AuditLog

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = db.session.get(User, int(user_id))
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            if not user.role or user.role.name not in roles:
                return jsonify({'error': f'Access denied. Required roles: {", ".join(roles)}'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id)) if user_id else None

def log_action(user_id, action, resource_type=None, resource_id=None, details=None):
    try:
        remote_ip = request.remote_addr if request else '127.0.0.1'
    except Exception:
        remote_ip = '127.0.0.1'
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=remote_ip
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()

def ensure_demo_accounts(repair_passwords=False):
    """
    Ensures all required roles and the 5 standard demo accounts exist in the database.
    Safe to run repeatedly; does not create duplicate users or reset passwords unexpectedly.
    If repair_passwords is True, ensures demo accounts have the expected development password.
    """
    roles_definitions = [
        ('admin', 'System Administrator with full access'),
        ('official', 'Government official who monitors and reviews'),
        ('officer', 'Field inspection officer'),
        ('ngo_manager', 'NGO / Institution Manager'),
        ('ngo', 'NGO / Institution Coordinator'),
        ('auditor', 'Statutory and Financial Auditor'),
        ('viewer', 'Read-only viewer'),
    ]

    for role_name, role_desc in roles_definitions:
        existing_role = Role.query.filter_by(name=role_name).first()
        if not existing_role:
            db.session.add(Role(name=role_name, description=role_desc))
    db.session.commit()

    demo_users = [
        {
            'name': 'Admin Singh',
            'email': 'admin@nigrani.gov.in',
            'password': 'Demo@1234',
            'role': 'admin',
            'designation': 'System Administrator',
            'state': 'Delhi',
            'district': 'Central Delhi',
        },
        {
            'name': 'Rajesh Kumar',
            'email': 'official@nigrani.gov.in',
            'password': 'Demo@1234',
            'role': 'official',
            'designation': 'Deputy Secretary',
            'state': 'Delhi',
            'district': 'New Delhi',
        },
        {
            'name': 'Priya Sharma',
            'email': 'officer@nigrani.gov.in',
            'password': 'Demo@1234',
            'role': 'officer',
            'designation': 'Field Inspection Officer',
            'state': 'Uttar Pradesh',
            'district': 'Lucknow',
        },
        {
            'name': 'Asha Sharma',
            'email': 'ngo@demo.org',
            'password': 'Demo@1234',
            'role': 'ngo_manager',
            'designation': 'NGO Director / Coordinator',
            'state': 'Delhi',
            'district': 'South Delhi',
        },
        {
            'name': 'Sanjay Verma',
            'email': 'auditor@nigrani.gov.in',
            'password': 'Demo@1234',
            'role': 'auditor',
            'designation': 'Chief Statutory Auditor',
            'state': 'Delhi',
            'district': 'Central Delhi',
        },
    ]

    for ud in demo_users:
        user = User.query.filter_by(email=ud['email'].lower()).first()
        role = Role.query.filter_by(name=ud['role']).first()
        if not user:
            user = User(
                name=ud['name'],
                email=ud['email'].lower(),
                role_id=role.id if role else None,
                designation=ud.get('designation'),
                state=ud.get('state'),
                district=ud.get('district'),
                is_active=True,
            )
            user.set_password(ud['password'])
            db.session.add(user)
        else:
            # User already exists - keep existing user, do not duplicate
            if not user.role_id and role:
                user.role_id = role.id
            if not user.is_active:
                user.is_active = True
            if repair_passwords and not user.check_password(ud['password']):
                user.set_password(ud['password'])
    db.session.commit()
