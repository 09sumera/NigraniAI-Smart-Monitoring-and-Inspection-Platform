from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.utils import secure_filename
import os, hashlib, traceback
from app import db
from app.models.inspection import Inspection, Assignment, ChecklistResponse
from app.models.project import Project
from app.models.evidence import Evidence
from app.utils.auth_utils import role_required, log_action, get_current_user
from app.routes.evidence import ALLOWED_EXTENSIONS, allowed_file, gen_evidence_id

inspections_bp = Blueprint('inspections', __name__)

VALID_TRANSITIONS = {
    'draft': ['assigned', 'in_progress', 'submitted', 'cancelled'],
    'assigned': ['in_progress', 'submitted', 'cancelled'],
    'in_progress': ['submitted', 'cancelled'],
    'submitted': ['under_review', 'approved', 'rejected'],
    'under_review': ['approved', 'rejected'],
    'approved': ['closed'],
    'rejected': ['in_progress', 'submitted'],
    'closed': [],
}

@inspections_bp.route('', methods=['GET'])
@jwt_required()
def list_inspections():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    q = Inspection.query
    if user.role and user.role.name == 'officer':
        # Officer only sees their own
        officer_assignment_ids = [a.id for a in Assignment.query.filter_by(officer_id=user.id).all()]
        q = q.filter(Inspection.assignment_id.in_(officer_assignment_ids))

    status = request.args.get('status')
    project_id = request.args.get('project_id')
    inspection_id = request.args.get('inspection_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if status: q = q.filter(Inspection.status == status)
    if project_id: q = q.filter(Inspection.project_id == int(project_id))
    if inspection_id: q = q.filter(Inspection.inspection_id == inspection_id)

    paginated = q.order_by(Inspection.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'inspections': [i.to_dict() for i in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
    })

@inspections_bp.route('/<int:inspection_id>', methods=['GET'])
@jwt_required()
def get_inspection(inspection_id):
    i = db.session.get(Inspection, inspection_id)
    if not i: return jsonify({'error': 'Inspection not found'}), 404
    data = i.to_dict()
    data['checklist'] = [c.to_dict() for c in i.checklist_responses]
    data['evidence'] = [e.to_dict() for e in i.evidence]
    return jsonify(data)

@inspections_bp.route('/by-code/<string:code>', methods=['GET'])
@jwt_required()
def get_inspection_by_code(code):
    i = Inspection.query.filter_by(inspection_id=code).first()
    if not i: return jsonify({'error': 'Inspection not found'}), 404
    data = i.to_dict()
    data['checklist'] = [c.to_dict() for c in i.checklist_responses]
    data['evidence'] = [e.to_dict() for e in i.evidence]
    return jsonify(data)

@inspections_bp.route('/<int:inspection_id>', methods=['PATCH', 'POST'])
@inspections_bp.route('/<int:inspection_id>/submit', methods=['PATCH', 'POST'])
@jwt_required()
def update_inspection(inspection_id):
    i = db.session.get(Inspection, inspection_id)
    if not i:
        return jsonify({'error': f'Inspection with ID {inspection_id} not found'}), 404

    user = get_current_user()
    if not user or not user.is_active:
        return jsonify({'error': 'Authentication required. Please log in.'}), 401

    user_role = user.role.name if user.role else None
    if user_role not in ['admin', 'official', 'officer']:
        return jsonify({'error': 'Access denied: You do not have permission to modify inspection reports.'}), 403

    if user_role == 'officer':
        if i.assignment and i.assignment.officer_id and i.assignment.officer_id != user.id:
            return jsonify({'error': 'Unauthorized: This inspection is assigned to another officer.'}), 403

    # Parse request data from JSON or multipart form
    data = {}
    if request.form:
        data.update(request.form.to_dict())
    json_data = request.get_json(silent=True)
    if json_data and isinstance(json_data, dict):
        data.update(json_data)

    # Validate target inspection and project IDs if sent in payload
    if 'inspection_id' in data and data['inspection_id']:
        body_iid = str(data['inspection_id']).strip()
        if body_iid not in (str(i.id), str(i.inspection_id)):
            return jsonify({'error': f'Payload inspection_id mismatch: got {body_iid}, expected {i.id}'}), 400

    if 'project_id' in data and data['project_id']:
        try:
            body_pid = int(data['project_id'])
            if i.project_id and body_pid != i.project_id:
                return jsonify({'error': f'Payload project_id mismatch: got {body_pid}, expected {i.project_id}'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid project_id format: must be an integer'}), 400

    new_status = data.get('status')
    if i.status in ['closed', 'approved'] and new_status != i.status:
        return jsonify({'error': f'Inspection is already {i.status} and cannot be modified.'}), 400

    if new_status:
        if new_status == 'submitted' and i.status == 'submitted':
            return jsonify({'error': 'This inspection report has already been submitted and is currently under review.'}), 400
        if new_status != i.status:
            allowed = VALID_TRANSITIONS.get(i.status, [])
            if new_status not in allowed:
                return jsonify({'error': f'Invalid status transition from {i.status} to {new_status}'}), 400

    # Required validation for report submission
    if new_status == 'submitted':
        obs = data.get('observations') if 'observations' in data else i.observations
        if not obs or not str(obs).strip():
            return jsonify({'error': 'Physical observations are required to submit an inspection report.'}), 400

        finds = data.get('findings') if 'findings' in data else i.findings
        if not finds or not str(finds).strip():
            return jsonify({'error': 'Critical findings & discrepancies are required to submit an inspection report.'}), 400

        sev = data.get('severity') if 'severity' in data else (i.severity or 'medium')
        if str(sev).lower() not in ['low', 'medium', 'high', 'critical']:
            return jsonify({'error': 'Risk severity level must be one of: low, medium, high, critical.'}), 400

    # Parse and validate GPS coordinates
    lat = None
    lng = None
    if 'latitude' in data and data['latitude'] is not None and data['latitude'] != '':
        try:
            lat = float(data['latitude'])
            if not (-90.0 <= lat <= 90.0):
                return jsonify({'error': 'Invalid latitude: must be between -90 and 90 degrees.'}), 400
            i.latitude = lat
        except (ValueError, TypeError):
            return jsonify({'error': 'Latitude must be a valid numeric coordinate.'}), 400

    if 'longitude' in data and data['longitude'] is not None and data['longitude'] != '':
        try:
            lng = float(data['longitude'])
            if not (-180.0 <= lng <= 180.0):
                return jsonify({'error': 'Invalid longitude: must be between -180 and 180 degrees.'}), 400
            i.longitude = lng
        except (ValueError, TypeError):
            return jsonify({'error': 'Longitude must be a valid numeric coordinate.'}), 400

    # Handle evidence file upload in the same submission transaction if provided
    evidence_obj = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            if not allowed_file(file.filename):
                return jsonify({'error': f'File format not supported. Allowed formats: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400

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
                # Ensure the exact parent directory physically exists immediately before writing
                os.makedirs(os.path.dirname(file_path), exist_ok=True)

                # Process and hash bytes in memory to prevent Windows/OneDrive file locking races
                file_bytes = file.read()
                file_hash = hashlib.sha256(file_bytes).hexdigest()
                file_size = len(file_bytes)

                with open(file_path, 'wb') as f:
                    f.write(file_bytes)

                evidence_obj = Evidence(
                    evidence_id=evidence_id,
                    project_id=i.project_id,
                    inspection_id=i.id,
                    uploader_id=user.id,
                    evidence_type=evidence_type,
                    file_path=file_path,
                    file_name=safe_name,
                    file_size=file_size,
                    file_hash=file_hash,
                    description=data.get('description', 'On-site mobile evidence capture'),
                    latitude=lat if lat is not None else i.latitude,
                    longitude=lng if lng is not None else i.longitude,
                    captured_at=datetime.utcnow(),
                )
                db.session.add(evidence_obj)
            except Exception as e:
                db.session.rollback()
                tb = traceback.format_exc()
                current_app.logger.error(f"[EVIDENCE UPLOAD ERROR]\n{tb}")
                print(f"[EVIDENCE UPLOAD ERROR] {e}\n{tb}", flush=True)
                return jsonify({
                    'error': f'Failed to process evidence file: {str(e)}',
                    'detail': str(e),
                    'traceback': tb
                }), 500

    try:
        # Update text and metric fields
        if 'observations' in data and data['observations'] is not None:
            i.observations = str(data['observations']).strip()
        if 'findings' in data and data['findings'] is not None:
            i.findings = str(data['findings']).strip()
        if 'severity' in data and data['severity'] is not None:
            i.severity = str(data['severity']).strip().lower()

        for field in ['score', 'officer_remarks', 'reviewer_remarks', 'corrective_actions_required', 'corrective_actions']:
            if field in data and data[field] is not None:
                setattr(i, field, data[field])

        if 'checklist' in data and isinstance(data['checklist'], list):
            ChecklistResponse.query.filter_by(inspection_id=i.id).delete()
            for item in data['checklist']:
                cr = ChecklistResponse(
                    inspection_id=i.id,
                    category=item.get('category'),
                    question=item.get('question'),
                    response=item.get('response'),
                    remarks=item.get('remarks'),
                    severity=item.get('severity'),
                )
                db.session.add(cr)

        # Status transition and lifecycle synchronization
        if new_status and new_status != i.status:
            i.status = new_status
            now = datetime.utcnow()
            if new_status in ['in_progress', 'submitted'] and not i.started_at:
                i.started_at = now
            if new_status == 'submitted':
                i.submitted_at = now
                if i.assignment:
                    i.assignment.status = 'completed'
                    i.assignment.completed_at = now
                if i.project:
                    i.project.last_inspection_date = now
            elif new_status in ['approved', 'rejected']:
                i.reviewed_at = now
                if i.assignment and i.assignment.status != 'completed':
                    i.assignment.status = 'completed'
                    i.assignment.completed_at = now
            elif new_status == 'closed':
                i.closed_at = now
                if i.assignment and i.assignment.status != 'completed':
                    i.assignment.status = 'completed'
                    i.assignment.completed_at = now
            elif new_status == 'cancelled':
                if i.assignment and i.assignment.status not in ('completed', 'cancelled'):
                    i.assignment.status = 'cancelled'

        i.updated_at = datetime.utcnow()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to persist report: {str(e)}'}), 500

    log_action(user.id, f'UPDATE_INSPECTION_{(new_status or i.status or "").upper()}', 'inspection', inspection_id)
    resp_data = i.to_dict()
    if evidence_obj:
        resp_data['evidence'] = [evidence_obj.to_dict()]
    return jsonify(resp_data), 200
