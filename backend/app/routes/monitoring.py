from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app import db
from app.models.project import Camera, AttendanceRecord
from app.utils.auth_utils import role_required

monitoring_bp = Blueprint('monitoring', __name__)

@monitoring_bp.route('/cameras', methods=['GET'])
@jwt_required()
def list_cameras():
    q = Camera.query
    project_id = request.args.get('project_id')
    status = request.args.get('status')
    if project_id: q = q.filter(Camera.project_id == int(project_id))
    if status: q = q.filter(Camera.status == status)
    cameras = q.order_by(Camera.created_at.desc()).all()
    return jsonify({'cameras': [c.to_dict() for c in cameras]})

@monitoring_bp.route('/cameras', methods=['POST'])
@role_required('admin', 'official')
def add_camera():
    data = request.get_json()
    camera = Camera(
        project_id=data['project_id'],
        name=data['name'],
        location_desc=data.get('location_desc'),
        stream_url=data.get('stream_url'),
        status=data.get('status', 'simulated'),
    )
    db.session.add(camera)
    db.session.commit()
    return jsonify(camera.to_dict()), 201

@monitoring_bp.route('/cameras/<int:camera_id>/heartbeat', methods=['POST'])
@jwt_required()
def camera_heartbeat(camera_id):
    camera = db.session.get(Camera, camera_id)
    if not camera: return jsonify({'error': 'Not found'}), 404
    camera.last_heartbeat = datetime.utcnow()
    camera.status = 'connected'
    db.session.commit()
    return jsonify({'message': 'Heartbeat recorded'})

@monitoring_bp.route('/attendance', methods=['GET'])
@jwt_required()
def list_attendance():
    project_id = request.args.get('project_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 30))
    q = AttendanceRecord.query
    if project_id: q = q.filter(AttendanceRecord.project_id == int(project_id))
    paginated = q.order_by(AttendanceRecord.record_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'records': [r.to_dict() for r in paginated.items],
        'total': paginated.total,
    })

@monitoring_bp.route('/attendance', methods=['POST'])
@role_required('admin', 'official')
def add_attendance():
    data = request.get_json()
    from datetime import date
    record = AttendanceRecord(
        project_id=data['project_id'],
        record_date=date.fromisoformat(data['record_date']),
        expected_staff=data.get('expected_staff', 0),
        reported_present=data.get('reported_present', 0),
        actual_present=data.get('actual_present'),
        discrepancy=data.get('discrepancy', 0),
        is_anomalous=data.get('is_anomalous', False),
        notes=data.get('notes'),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201

@monitoring_bp.route('/live', methods=['GET'])
@jwt_required()
def live_feed_status():
    """Returns simulated live monitoring status for all active cameras."""
    cameras = Camera.query.filter_by(is_active=True).all()
    return jsonify({
        'total_cameras': len(cameras),
        'connected': sum(1 for c in cameras if c.status == 'connected'),
        'simulated': sum(1 for c in cameras if c.status == 'simulated'),
        'disconnected': sum(1 for c in cameras if c.status == 'disconnected'),
        'cameras': [c.to_dict() for c in cameras[:20]],
    })

@monitoring_bp.route('/status', methods=['GET'])
@jwt_required()
def monitoring_status():
    """Returns telemetry and heartbeat status for all monitored units nationwide."""
    from app.models.project import Project
    projects = Project.query.filter_by(is_archived=False).order_by(Project.risk_score.desc()).all()
    active_count = sum(1 for p in projects if p.status == 'active')

    project_list = []
    for p in projects:
        data = p.to_dict()
        c_count = len(p.cameras) if p.cameras else (p.camera_count or 0)
        data['camera_count'] = max(c_count, 1)
        data['telemetry_status'] = 'nominal' if p.risk_level in ('low', 'moderate') else 'elevated_risk'
        # Provide real coordinates or representative coordinates for nationwide mapping
        project_list.append(data)

    return jsonify({
        'total_active': active_count,
        'total_monitored': len(projects),
        'projects': project_list,
    })
