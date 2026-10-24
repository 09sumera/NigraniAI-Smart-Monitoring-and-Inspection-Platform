from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.alert import Alert, Notification
from app.utils.auth_utils import role_required, log_action, get_current_user

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('', methods=['GET'])
@jwt_required()
def list_alerts():
    q = Alert.query
    status = request.args.get('status')
    severity = request.args.get('severity')
    project_id = request.args.get('project_id')
    alert_type = request.args.get('alert_type')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if status: q = q.filter(Alert.status == status)
    if severity: q = q.filter(Alert.severity == severity)
    if project_id: q = q.filter(Alert.project_id == int(project_id))
    if alert_type: q = q.filter(Alert.alert_type == alert_type)

    paginated = q.order_by(Alert.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'alerts': [a.to_dict() for a in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })

@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    a = db.session.get(Alert, alert_id)
    if not a: return jsonify({'error': 'Not found'}), 404
    return jsonify(a.to_dict())

@alerts_bp.route('/<int:alert_id>', methods=['PATCH'])
@jwt_required()
def update_alert(alert_id):
    a = db.session.get(Alert, alert_id)
    if not a: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    user_id = int(get_jwt_identity())

    new_status = data.get('status')
    if new_status:
        a.status = new_status
        a.reviewed_by = user_id
        a.reviewed_at = datetime.utcnow()
        if new_status == 'resolved':
            a.resolved_at = datetime.utcnow()
    if 'reviewer_notes' in data:
        a.reviewer_notes = data['reviewer_notes']

    db.session.commit()
    log_action(user_id, f'UPDATE_ALERT_{(new_status or "").upper()}', 'alert', alert_id)
    return jsonify(a.to_dict())

@alerts_bp.route('', methods=['POST'])
@role_required('admin', 'official')
def create_alert():
    data = request.get_json()
    alert = Alert(
        project_id=data.get('project_id'),
        alert_type=data.get('alert_type'),
        title=data['title'],
        description=data.get('description'),
        severity=data.get('severity', 'medium'),
        risk_score=data.get('risk_score'),
        triggering_factors=data.get('triggering_factors'),
        is_ai_generated=data.get('is_ai_generated', False),
    )
    db.session.add(alert)
    db.session.commit()
    user_id = int(get_jwt_identity())
    log_action(user_id, 'CREATE_ALERT', 'alert', alert.id)
    return jsonify(alert.to_dict()), 201

@alerts_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user = get_current_user()
    notifs = Notification.query.filter_by(user_id=user.id).order_by(
        Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({
        'notifications': [n.to_dict() for n in notifs],
        'unread_count': unread_count,
    })

@alerts_bp.route('/notifications/<int:notif_id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_read(notif_id):
    notif = db.session.get(Notification, notif_id)
    if not notif: return jsonify({'error': 'Not found'}), 404
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'})
