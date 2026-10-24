from app import db
from datetime import datetime

class Scheme(db.Model):
    __tablename__ = 'schemes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(50), unique=True)
    description = db.Column(db.Text)
    ministry = db.Column(db.String(200))
    projects = db.relationship('Project', back_populates='scheme')

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(30), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    institution_name = db.Column(db.String(200))
    institution_type = db.Column(db.String(50))  # NGO, Trust, Govt, Private
    scheme_id = db.Column(db.Integer, db.ForeignKey('schemes.id'))
    state = db.Column(db.String(60), nullable=False)
    district = db.Column(db.String(60), nullable=False)
    address = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    project_manager = db.Column(db.String(120))
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))
    registered_beneficiaries = db.Column(db.Integer, default=0)
    sanctioned_capacity = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default='active')  # active, inactive, suspended, under_review
    is_archived = db.Column(db.Boolean, default=False)
    last_inspection_date = db.Column(db.DateTime)
    next_inspection_due = db.Column(db.DateTime)
    compliance_score = db.Column(db.Float, default=100.0)
    risk_score = db.Column(db.Float, default=0.0)
    risk_level = db.Column(db.String(20), default='low')  # low, moderate, high, critical
    camera_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scheme = db.relationship('Scheme', back_populates='projects')
    inspections = db.relationship('Inspection', back_populates='project')
    evidence = db.relationship('Evidence', back_populates='project')
    alerts = db.relationship('Alert', back_populates='project')
    assignments = db.relationship('Assignment', back_populates='project')
    cameras = db.relationship('Camera', back_populates='project')
    attendance_records = db.relationship('AttendanceRecord', back_populates='project')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'institution_name': self.institution_name,
            'institution_type': self.institution_type,
            'scheme': self.scheme.name if self.scheme else None,
            'scheme_id': self.scheme_id,
            'state': self.state,
            'district': self.district,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'project_manager': self.project_manager,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'registered_beneficiaries': self.registered_beneficiaries,
            'sanctioned_capacity': self.sanctioned_capacity,
            'status': self.status,
            'last_inspection_date': self.last_inspection_date.isoformat() if self.last_inspection_date else None,
            'next_inspection_due': self.next_inspection_due.isoformat() if self.next_inspection_due else None,
            'compliance_score': self.compliance_score,
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'camera_count': self.camera_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Camera(db.Model):
    __tablename__ = 'cameras'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    name = db.Column(db.String(100), nullable=False)
    location_desc = db.Column(db.String(200))
    stream_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='simulated')  # connected, disconnected, simulated, unauthorized
    last_heartbeat = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='cameras')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'name': self.name,
            'location_desc': self.location_desc,
            'status': self.status,
            'last_heartbeat': self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            'is_active': self.is_active,
        }


class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    record_date = db.Column(db.Date, nullable=False)
    expected_staff = db.Column(db.Integer, default=0)
    reported_present = db.Column(db.Integer, default=0)
    actual_present = db.Column(db.Integer)
    discrepancy = db.Column(db.Integer, default=0)
    is_anomalous = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='attendance_records')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'expected_staff': self.expected_staff,
            'reported_present': self.reported_present,
            'actual_present': self.actual_present,
            'discrepancy': self.discrepancy,
            'is_anomalous': self.is_anomalous,
        }
