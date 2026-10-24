from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.utils import secure_filename
import os, hashlib, random, string
from app import db
from app.models.evidence import Evidence
from app.utils.auth_utils import log_action

evidence_bp = Blueprint('evidence', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def gen_evidence_id():
    return 'EVI' + ''.join(random.choices(string.digits, k=7))

@evidence_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_evidence():
    user_id = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename): return jsonify({'error': 'File type not allowed'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    evidence_type = 'photo' if ext in {'png', 'jpg', 'jpeg', 'gif'} else 'video' if ext in {'mp4', 'avi', 'mov'} else 'document'
    safe_name = f"{gen_evidence_id()}_{secure_filename(file.filename)}"
    subfolder = 'photos' if evidence_type == 'photo' else 'videos'
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    file.save(file_path)

    file_hash = hashlib.sha256(open(file_path, 'rb').read()).hexdigest()
    file_size = os.path.getsize(file_path)

    evidence = Evidence(
        evidence_id=gen_evidence_id(),
        project_id=request.form.get('project_id', type=int),
        inspection_id=request.form.get('inspection_id', type=int),
        uploader_id=user_id,
        evidence_type=evidence_type,
        file_path=file_path,
        file_name=safe_name,
        file_size=file_size,
        file_hash=file_hash,
        description=request.form.get('description'),
        latitude=request.form.get('latitude', type=float),
        longitude=request.form.get('longitude', type=float),
        gps_accuracy=request.form.get('gps_accuracy', type=float),
        captured_at=datetime.fromisoformat(request.form['captured_at']) if request.form.get('captured_at') else None,
    )
    db.session.add(evidence)
    db.session.commit()
    log_action(user_id, 'UPLOAD_EVIDENCE', 'evidence', evidence.id, f'Uploaded {evidence_type}: {safe_name}')
    return jsonify(evidence.to_dict()), 201

@evidence_bp.route('', methods=['GET'])
@jwt_required()
def list_evidence():
    q = Evidence.query
    project_id = request.args.get('project_id')
    inspection_id = request.args.get('inspection_id')
    status = request.args.get('verification_status')
    evidence_type = request.args.get('evidence_type')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if project_id: q = q.filter(Evidence.project_id == int(project_id))
    if inspection_id: q = q.filter(Evidence.inspection_id == int(inspection_id))
    if status: q = q.filter(Evidence.verification_status == status)
    if evidence_type: q = q.filter(Evidence.evidence_type == evidence_type)

    paginated = q.order_by(Evidence.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'evidence': [e.to_dict() for e in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })

@evidence_bp.route('/<int:evidence_id>', methods=['GET'])
@jwt_required()
def get_evidence(evidence_id):
    e = db.session.get(Evidence, evidence_id)
    if not e: return jsonify({'error': 'Not found'}), 404
    return jsonify(e.to_dict())

@evidence_bp.route('/<int:evidence_id>/verify', methods=['PATCH'])
@jwt_required()
def verify_evidence(evidence_id):
    e = db.session.get(Evidence, evidence_id)
    if not e: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    user_id = int(get_jwt_identity())
    e.verification_status = data.get('verification_status', e.verification_status)
    e.reviewer_notes = data.get('reviewer_notes', e.reviewer_notes)
    e.reviewer_id = user_id
    e.reviewed_at = datetime.utcnow()
    db.session.commit()
    log_action(user_id, 'VERIFY_EVIDENCE', 'evidence', evidence_id, f'Status: {e.verification_status}')
    return jsonify(e.to_dict())
