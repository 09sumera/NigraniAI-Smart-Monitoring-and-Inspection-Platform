from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
from werkzeug.utils import secure_filename
import os, hashlib, random, string, traceback
from app import db
from app.models.evidence import Evidence
from app.utils.auth_utils import log_action, get_current_user

evidence_bp = Blueprint('evidence', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def gen_evidence_id():
    return 'EVI' + ''.join(random.choices(string.digits, k=7))

@evidence_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_evidence():
    user = get_current_user()
    if not user or not user.is_active:
        return jsonify({'error': 'Authentication required. Please log in.'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided in request.'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected for upload.'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Supported formats: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400

    inspection_id = request.form.get('inspection_id', type=int)
    project_id = request.form.get('project_id', type=int)

    from app.models.inspection import Inspection
    from app.models.project import Project

    if inspection_id:
        insp = db.session.get(Inspection, inspection_id)
        if not insp:
            return jsonify({'error': f'Inspection with ID {inspection_id} not found.'}), 404
        if user.role and user.role.name == 'officer':
            if insp.assignment and insp.assignment.officer_id and insp.assignment.officer_id != user.id:
                return jsonify({'error': 'Unauthorized: This inspection is assigned to another officer.'}), 403
        if not project_id:
            project_id = insp.project_id

    if project_id:
        proj = db.session.get(Project, project_id)
        if not proj:
            return jsonify({'error': f'Project with ID {project_id} not found.'}), 404

    lat = request.form.get('latitude', type=float)
    lng = request.form.get('longitude', type=float)
    if lat is not None and not (-90.0 <= lat <= 90.0):
        return jsonify({'error': 'Invalid latitude: must be between -90 and 90.'}), 400
    if lng is not None and not (-180.0 <= lng <= 180.0):
        return jsonify({'error': 'Invalid longitude: must be between -180 and 180.'}), 400

    try:
        evidence_id = gen_evidence_id()

        # Defensively strip client path prefixes (e.g. C:\fakepath\ or Windows backslashes)
        raw_filename = os.path.basename(file.filename or 'evidence.jpg')
        if '.' in raw_filename:
            raw_base, raw_ext = raw_filename.rsplit('.', 1)
        else:
            raw_base, raw_ext = raw_filename, 'jpg'

        clean_ext = secure_filename(raw_ext).lower()
        if not clean_ext or clean_ext not in ALLOWED_EXTENSIONS:
            clean_ext = 'jpg'

        evidence_type = 'photo' if clean_ext in {'png', 'jpg', 'jpeg', 'gif'} else 'video' if clean_ext in {'mp4', 'avi', 'mov'} else 'document'

        clean_base = secure_filename(raw_base)
        if not clean_base:
            clean_base = 'evidence'
        # Truncate long base name to prevent Windows MAX_PATH (260 char) errors
        if len(clean_base) > 40:
            clean_base = clean_base[:40]

        safe_name = f"{evidence_id}_{clean_base}.{clean_ext}"

        subfolder = 'photos' if evidence_type == 'photo' else 'videos' if evidence_type == 'video' else 'documents'
        upload_base = os.path.abspath(current_app.config['UPLOAD_FOLDER'])
        target_dir = os.path.abspath(os.path.join(upload_base, subfolder))
        os.makedirs(target_dir, exist_ok=True)

        file_path = os.path.abspath(os.path.join(target_dir, safe_name))
        # Defensively ensure the parent directory physically exists immediately before writing
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Process and hash bytes in memory
        file_bytes = file.read()
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

        with open(file_path, 'wb') as f:
            f.write(file_bytes)

        captured_at = None
        if request.form.get('captured_at'):
            try:
                captured_at = datetime.fromisoformat(request.form['captured_at'])
            except Exception:
                captured_at = datetime.utcnow()
        else:
            captured_at = datetime.utcnow()

        evidence = Evidence(
            evidence_id=evidence_id,
            project_id=project_id,
            inspection_id=inspection_id,
            uploader_id=user.id,
            evidence_type=evidence_type,
            file_path=file_path,
            file_name=safe_name,
            file_size=file_size,
            file_hash=file_hash,
            description=request.form.get('description', 'On-site mobile evidence capture'),
            latitude=lat,
            longitude=lng,
            gps_accuracy=request.form.get('gps_accuracy', type=float),
            captured_at=captured_at,
        )
        db.session.add(evidence)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        tb = traceback.format_exc()
        current_app.logger.error(f"[EVIDENCE UPLOAD ERROR]\n{tb}")
        print(f"[EVIDENCE UPLOAD ERROR] {e}\n{tb}", flush=True)
        return jsonify({
            'error': f'Failed to save evidence: {str(e)}',
            'detail': str(e),
            'traceback': tb
        }), 500

    log_action(user.id, 'UPLOAD_EVIDENCE', 'evidence', evidence.id, f'Uploaded {evidence_type}: {safe_name}')
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

@evidence_bp.route('/<int:evidence_id>/verify', methods=['PATCH', 'POST'])
@jwt_required()
def verify_evidence(evidence_id):
    user = get_current_user()
    if not user or not user.is_active:
        return jsonify({'error': 'Authentication required. Please log in.'}), 401

    if not user.role or user.role.name not in ['admin', 'official', 'auditor']:
        return jsonify({'error': 'Access denied: Evidence verification requires admin, official, or auditor privileges.'}), 403

    e = db.session.get(Evidence, evidence_id)
    if not e:
        return jsonify({'error': f'Evidence record with ID {evidence_id} not found'}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get('verification_status')
    if not new_status:
        return jsonify({'error': 'verification_status is required (e.g. verified, rejected, flagged, pending)'}), 400

    new_status = str(new_status).strip().lower()
    if new_status in ['approved', 'approve', 'verify']:
        new_status = 'verified'
    elif new_status in ['reject']:
        new_status = 'rejected'
    elif new_status in ['flag']:
        new_status = 'flagged'

    if new_status not in ['verified', 'rejected', 'flagged', 'pending']:
        return jsonify({'error': f'Invalid verification_status "{new_status}". Allowed: verified, rejected, flagged, pending'}), 400

    e.verification_status = new_status
    if 'reviewer_notes' in data and data['reviewer_notes'] is not None:
        e.reviewer_notes = str(data['reviewer_notes']).strip()
    e.reviewer_id = user.id
    e.reviewed_at = datetime.utcnow()

    # Note: Evidence review status is kept strictly separate from inspection report lifecycle
    db.session.commit()
    log_action(user.id, f'VERIFY_EVIDENCE_{new_status.upper()}', 'evidence', evidence_id, f'Status: {new_status}. Notes: {e.reviewer_notes or ""}')
    return jsonify(e.to_dict()), 200

def _resolve_evidence_path(evidence):
    """Safely locate the evidence file on disk with fallbacks for workspace/root and legacy relative records."""
    if evidence.file_path and os.path.isfile(evidence.file_path):
        return os.path.abspath(evidence.file_path)

    subfolder = 'photos' if evidence.evidence_type == 'photo' else 'videos' if evidence.evidence_type == 'video' else 'documents'
    upload_folder = os.path.abspath(current_app.config['UPLOAD_FOLDER'])

    # Determine project workspace root (parent of backend/ if upload_folder is inside backend/)
    workspace_root = os.path.dirname(upload_folder)
    if os.path.basename(workspace_root).lower() == 'backend':
        workspace_root = os.path.dirname(workspace_root)

    candidates = [
        # Candidate 1: configured UPLOAD_FOLDER subfolder
        os.path.join(upload_folder, subfolder, evidence.file_name or ''),
        # Candidate 2: workspace root uploads subfolder
        os.path.join(workspace_root, 'uploads', subfolder, evidence.file_name or ''),
        # Candidate 3: relative path from workspace root
        os.path.join(workspace_root, evidence.file_path or ''),
        # Candidate 4: relative path from backend folder
        os.path.join(os.path.dirname(upload_folder), evidence.file_path or ''),
    ]

    for cand in candidates:
        if cand and os.path.isfile(cand):
            return os.path.abspath(cand)

    return None

@evidence_bp.route('/<int:evidence_id>/file', methods=['GET'])
@evidence_bp.route('/<int:evidence_id>/download', methods=['GET'])
def get_evidence_file(evidence_id):
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    e = db.session.get(Evidence, evidence_id)
    if not e:
        return jsonify({'error': 'Evidence record not found'}), 404

    target_path = _resolve_evidence_path(e)
    if not target_path:
        return jsonify({'error': f'Evidence file not found on disk at {e.file_path}'}), 404

    directory = os.path.dirname(target_path)
    filename = os.path.basename(target_path)
    return send_from_directory(directory, filename)

@evidence_bp.route('/by-code/<string:code>/file', methods=['GET'])
def get_evidence_file_by_code(code):
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    e = Evidence.query.filter_by(evidence_id=code).first()
    if not e:
        return jsonify({'error': 'Evidence record not found'}), 404

    target_path = _resolve_evidence_path(e)
    if not target_path:
        return jsonify({'error': f'Evidence file not found on disk at {e.file_path}'}), 404

    directory = os.path.dirname(target_path)
    filename = os.path.basename(target_path)
    return send_from_directory(directory, filename)
