from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.settings import SystemSetting
from app.utils.auth_utils import role_required, log_action

settings_bp = Blueprint('settings', __name__)

DEFAULT_SETTINGS = {
    'risk_factor_influence': '70',
    'randomization_factor': '30',
    'overdue_weight': '25',
    'compliance_weight': '20',
    'alert_weight': '15',
    'attendance_weight': '15',
    'min_score_cutoff': '5.0',
}

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    settings = {}
    for key, default_val in DEFAULT_SETTINGS.items():
        settings[key] = SystemSetting.get_setting(key, default_val)

    # Return parsed values with helpful numeric keys matching frontend expectations
    return jsonify({
        'settings': settings,
        'risk_weight': int(float(settings.get('risk_factor_influence', '70'))),
        'random_weight': int(float(settings.get('randomization_factor', '30'))),
        'overdue_weight': int(float(settings.get('overdue_weight', '25'))),
        'compliance_weight': int(float(settings.get('compliance_weight', '20'))),
        'alert_weight': int(float(settings.get('alert_weight', '15'))),
        'attendance_weight': int(float(settings.get('attendance_weight', '15'))),
    })

@settings_bp.route('', methods=['POST', 'PUT'])
@role_required('admin', 'official')
def update_settings():
    data = request.get_json() or {}

    risk_weight = data.get('risk_weight')
    random_weight = data.get('random_weight')

    if risk_weight is not None:
        try:
            rw = int(risk_weight)
            if not (10 <= rw <= 95):
                return jsonify({'error': 'risk_weight must be between 10 and 95'}), 400
            SystemSetting.set_setting('risk_factor_influence', str(rw), 'Influence percentage of deterministic risk weights')
            # If random_weight not explicitly sent, make them sum to 100
            if random_weight is None:
                SystemSetting.set_setting('randomization_factor', str(100 - rw), 'Randomization factor percentage')
        except ValueError:
            return jsonify({'error': 'risk_weight must be an integer'}), 400

    if random_weight is not None:
        try:
            ran_w = int(random_weight)
            if not (5 <= ran_w <= 90):
                return jsonify({'error': 'random_weight must be between 5 and 90'}), 400
            SystemSetting.set_setting('randomization_factor', str(ran_w), 'Randomization factor percentage')
        except ValueError:
            return jsonify({'error': 'random_weight must be an integer'}), 400

    for optional_key in ['overdue_weight', 'compliance_weight', 'alert_weight', 'attendance_weight']:
        if optional_key in data:
            try:
                val = int(data[optional_key])
                SystemSetting.set_setting(optional_key, str(val))
            except ValueError:
                pass

    user_id = int(get_jwt_identity())
    log_action(user_id, 'UPDATE_SYSTEM_SETTINGS', 'settings', None)

    return get_settings()

