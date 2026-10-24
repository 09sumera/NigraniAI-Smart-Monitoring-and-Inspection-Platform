from app import db
from datetime import datetime
import hashlib

class Evidence(db.Model):
    __tablename__ = 'evidence'
    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.String(30), unique=True, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    inspection_id = db.Column(db.Integer, db.ForeignKey('inspections.id'))
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    evidence_type = db.Column(db.String(30))  # photo, video, document
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(200))
    file_size = db.Column(db.Integer)
    file_hash = db.Column(db.String(64))
    description = db.Column(db.Text)
    captured_at = db.Column(db.DateTime)
    received_at = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    gps_accuracy = db.Column(db.Float)
    verification_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected, flagged
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewer_notes = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='evidence')
    inspection = db.relationship('Inspection', back_populates='evidence')
    uploader = db.relationship('User', foreign_keys=[uploader_id])
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])

    def to_dict(self):
        return {
            'id': self.id,
            'evidence_id': self.evidence_id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'inspection_id': self.inspection_id,
            'uploader_name': self.uploader.name if self.uploader else None,
            'evidence_type': self.evidence_type,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'description': self.description,
            'captured_at': self.captured_at.isoformat() if self.captured_at else None,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'verification_status': self.verification_status,
            'reviewer_notes': self.reviewer_notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
