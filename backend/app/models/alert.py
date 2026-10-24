from app import db
from datetime import datetime

class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    alert_type = db.Column(db.String(50))
    # high_risk, overdue_inspection, camera_down, attendance_anomaly, compliance_violation, ai_anomaly
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    risk_score = db.Column(db.Float)
    triggering_factors = db.Column(db.Text)  # JSON string
    status = db.Column(db.String(20), default='open')  # open, acknowledged, resolved, dismissed
    is_ai_generated = db.Column(db.Boolean, default=False)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewer_notes = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

    project = db.relationship('Project', back_populates='alerts')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'project_state': self.project.state if self.project else None,
            'alert_type': self.alert_type,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'risk_score': self.risk_score,
            'triggering_factors': self.triggering_factors,
            'status': self.status,
            'is_ai_generated': self.is_ai_generated,
            'reviewer_notes': self.reviewer_notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    notification_type = db.Column(db.String(50))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
