from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.audit import AuditLog
from app.utils.auth_utils import role_required

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('', methods=['GET'])
@role_required('admin', 'auditor')
def list_audit_logs():
    q = AuditLog.query
    user_id = request.args.get('user_id')
    action = request.args.get('action')
    resource_type = request.args.get('resource_type')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    if user_id: q = q.filter(AuditLog.user_id == int(user_id))
    if action: q = q.filter(AuditLog.action.ilike(f'%{action}%'))
    if resource_type: q = q.filter(AuditLog.resource_type == resource_type)

    paginated = q.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'logs': [log.to_dict() for log in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })
