from app import db
from datetime import datetime

class Inspection(db.Model):
    __tablename__ = 'inspections'
    id = db.Column(db.Integer, primary_key=True)
    inspection_id = db.Column(db.String(30), unique=True, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'))
    inspection_type = db.Column(db.String(30), default='surprise')  # surprise, scheduled, emergency, follow_up
    status = db.Column(db.String(30), default='assigned')
    # draft, assigned, in_progress, submitted, under_review, approved, rejected, closed
    observations = db.Column(db.Text)
    findings = db.Column(db.Text)
    severity = db.Column(db.String(20))  # low, medium, high, critical
    score = db.Column(db.Float)
    officer_remarks = db.Column(db.Text)
    reviewer_remarks = db.Column(db.Text)
    corrective_actions_required = db.Column(db.Boolean, default=False)
    corrective_actions = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    planned_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    submitted_at = db.Column(db.DateTime)
    reviewed_at = db.Column(db.DateTime)
    closed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='inspections')
    assignment = db.relationship('Assignment', back_populates='inspection', foreign_keys=[assignment_id])
    checklist_responses = db.relationship('ChecklistResponse', back_populates='inspection')
    evidence = db.relationship('Evidence', back_populates='inspection')

    def to_dict(self):
        return {
            'id': self.id,
            'inspection_id': self.inspection_id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'project_state': self.project.state if self.project else None,
            'assigned_officer': self.assignment.officer.name if self.assignment and self.assignment.officer else None,
            'officer_id': self.assignment.officer_id if self.assignment else None,
            'inspection_type': self.inspection_type,
            'status': self.status,
            'observations': self.observations,
            'findings': self.findings,
            'severity': self.severity,
            'score': self.score,
            'corrective_actions_required': self.corrective_actions_required,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'planned_at': self.planned_at.isoformat() if self.planned_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Assignment(db.Model):
    __tablename__ = 'assignments'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    officer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    inspection_type = db.Column(db.String(30), default='surprise')
    assignment_reason = db.Column(db.Text)
    risk_score_at_assignment = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='pending')  # pending, accepted, in_progress, completed, cancelled
    is_announced = db.Column(db.Boolean, default=False)
    scheduled_at = db.Column(db.DateTime)
    accepted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='assignments')
    officer = db.relationship('User', foreign_keys=[officer_id], back_populates='assigned_inspections')
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='created_inspections')
    inspection = db.relationship('Inspection', back_populates='assignment', foreign_keys='Inspection.assignment_id', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'project_state': self.project.state if self.project else None,
            'risk_level': self.project.risk_level if self.project else None,
            'officer_id': self.officer_id,
            'officer_name': self.officer.name if self.officer else None,
            'created_by': self.created_by,
            'created_by_name': self.creator.name if self.creator else None,
            'inspection_type': self.inspection_type,
            'assignment_reason': self.assignment_reason,
            'risk_score_at_assignment': self.risk_score_at_assignment,
            'status': self.status,
            'is_announced': self.is_announced,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ChecklistResponse(db.Model):
    __tablename__ = 'checklist_responses'
    id = db.Column(db.Integer, primary_key=True)
    inspection_id = db.Column(db.Integer, db.ForeignKey('inspections.id'))
    category = db.Column(db.String(100))
    question = db.Column(db.Text)
    response = db.Column(db.String(20))  # yes, no, na, partial
    remarks = db.Column(db.Text)
    severity = db.Column(db.String(20))

    inspection = db.relationship('Inspection', back_populates='checklist_responses')

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'question': self.question,
            'response': self.response,
            'remarks': self.remarks,
            'severity': self.severity,
        }
