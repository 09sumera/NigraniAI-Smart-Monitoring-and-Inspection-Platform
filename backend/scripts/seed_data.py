"""
seed_data.py — Populates the NigraniAI database with realistic demo data.

Usage (from backend/ directory):
    python scripts/seed_data.py

Creates:
  - Roles: admin, official, officer, viewer
  - Demo users for each role
  - Government welfare schemes
  - 30 sample projects across Indian states
  - Assignments and inspections
  - Sample alerts
"""

import sys
import os
import random
from datetime import datetime, timedelta, date

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User, Role
from app.models.project import Project, Scheme, Camera, AttendanceRecord
from app.models.inspection import Inspection, Assignment, ChecklistResponse
from app.models.alert import Alert, Notification
from app.models.audit import AuditLog
from app.models.evidence import Evidence

app = create_app('development')

STATES = [
    'Uttar Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan', 'Madhya Pradesh',
    'Tamil Nadu', 'Karnataka', 'Gujarat', 'West Bengal', 'Odisha',
    'Jharkhand', 'Haryana', 'Telangana', 'Andhra Pradesh', 'Assam'
]

DISTRICTS = {
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Rewa'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    'Haryana': ['Gurugram', 'Faridabad', 'Hisar', 'Rohtak', 'Ambala'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Andhra Pradesh': ['Vijayawada', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Nellore'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
}

INSTITUTION_TYPES = ['NGO', 'Trust', 'Govt', 'Private', 'Society']

SCHEME_DATA = [
    {'name': 'PM CARES for Children', 'code': 'PMCC', 'ministry': 'MoSJE',
     'description': 'Support for children orphaned due to COVID-19'},
    {'name': 'National Action Plan for Drug Demand Reduction', 'code': 'NAPDDR', 'ministry': 'MoSJE',
     'description': 'Drug de-addiction and rehabilitation services'},
    {'name': 'Deendayal Disabled Rehabilitation Scheme', 'code': 'DDRS', 'ministry': 'MoSJE',
     'description': 'Rehabilitation of persons with disabilities'},
    {'name': 'Integrated Programme for Older Persons', 'code': 'IPOP', 'ministry': 'MoSJE',
     'description': 'Old age homes and day care centers for senior citizens'},
    {'name': 'Support for Marginalised Individuals for Livelihood', 'code': 'SMILE', 'ministry': 'MoSJE',
     'description': 'Welfare of transgender persons and beggars'},
    {'name': 'National Overseas Scholarship', 'code': 'NOS', 'ministry': 'MoSJE',
     'description': 'Scholarships for SC students for overseas education'},
]

PROJECT_NAMES = [
    'Asha Kiran Rehabilitation Centre', 'Umang Old Age Home', 'Nayee Disha Drug De-addiction Centre',
    'Divyang Sahayata Kendra', 'Vatsalya Orphan Care Home', 'Jeevan Jyoti Senior Citizens Home',
    'Pragati Skill Training Centre', 'Sahara Women Welfare NGO', 'Nav Chetna Disability Centre',
    'Udaan Youth Empowerment Trust', 'Sneha Sadan Children Home', 'Suraksha Old Age Welfare Society',
    'Nirmala Drug Rehabilitation Centre', 'Aashray Shelter for Homeless', 'Shakti Mahila Sanstha',
    'Bal Kalyan Samiti', 'Gram Unnati Foundation', 'Vishwas Disability Welfare Trust',
    'Swadhaar Women Empowerment', 'Parivartan Drug De-addiction Hostel', 'Karuna Seva Trust',
    'Lok Seva Sansthan', 'Mamta Child Welfare Society', 'Sparsh Disability Centre',
    'Prerna Senior Care Facility', 'Disha Foundation', 'Swavalamban Skill Centre',
    'Jyoti Rehabilitation Society', 'Anand Old Age Ashram', 'Navjeevan Welfare Centre',
]

CHECKLIST_ITEMS = [
    {'category': 'Infrastructure', 'question': 'Building is structurally safe and well-maintained'},
    {'category': 'Infrastructure', 'question': 'Adequate sanitation facilities available'},
    {'category': 'Infrastructure', 'question': 'Clean drinking water available'},
    {'category': 'Beneficiary', 'question': 'Registered beneficiary count matches physical presence'},
    {'category': 'Beneficiary', 'question': 'Beneficiary records are properly maintained'},
    {'category': 'Beneficiary', 'question': 'Individual care plans exist for each beneficiary'},
    {'category': 'Staff', 'question': 'Qualified staff present as per sanctioned strength'},
    {'category': 'Staff', 'question': 'Staff attendance registers are updated'},
    {'category': 'Financial', 'question': 'Fund utilization records are available'},
    {'category': 'Financial', 'question': 'Accounts are audited'},
    {'category': 'Safety', 'question': 'Fire safety equipment installed and functional'},
    {'category': 'Safety', 'question': 'Emergency evacuation plan displayed'},
]


def seed_roles():
    roles_data = [
        ('admin', 'System Administrator with full access'),
        ('official', 'Government official who monitors and reviews'),
        ('officer', 'Field inspection officer'),
        ('ngo_manager', 'NGO / Institution Manager'),
        ('ngo', 'NGO / Institution Coordinator'),
        ('auditor', 'Statutory and Financial Auditor'),
        ('viewer', 'Read-only viewer'),
    ]
    roles = {}
    for name, desc in roles_data:
        role = Role.query.filter_by(name=name).first()
        if not role:
            role = Role(name=name, description=desc)
            db.session.add(role)
    db.session.commit()
    for name, _ in roles_data:
        roles[name] = Role.query.filter_by(name=name).first()
    print(f"  [OK] Roles seeded: {list(roles.keys())}")
    return roles


def seed_users(roles):
    users = {}
    user_data = [
        # Standard 5 demo accounts
        {'name': 'Admin Singh', 'email': 'admin@nigrani.gov.in', 'password': 'Demo@1234',
         'role': 'admin', 'designation': 'System Administrator', 'state': 'Delhi', 'district': 'Central Delhi'},
        {'name': 'Rajesh Kumar', 'email': 'official@nigrani.gov.in', 'password': 'Demo@1234',
         'role': 'official', 'designation': 'Deputy Secretary', 'state': 'Delhi', 'district': 'New Delhi'},
        {'name': 'Priya Sharma', 'email': 'officer@nigrani.gov.in', 'password': 'Demo@1234',
         'role': 'officer', 'designation': 'Field Inspection Officer', 'state': 'Uttar Pradesh', 'district': 'Lucknow'},
        {'name': 'Asha Sharma', 'email': 'ngo@demo.org', 'password': 'Demo@1234',
         'role': 'ngo_manager', 'designation': 'NGO Director / Coordinator', 'state': 'Delhi', 'district': 'South Delhi'},
        {'name': 'Sanjay Verma', 'email': 'auditor@nigrani.gov.in', 'password': 'Demo@1234',
         'role': 'auditor', 'designation': 'Chief Statutory Auditor', 'state': 'Delhi', 'district': 'Central Delhi'},

        # Additional regional inspection officers
        {'name': 'Amitabh Verma', 'email': 'officer2@nigraniai.gov.in', 'password': 'Officer@2026',
         'role': 'officer', 'designation': 'Field Inspection Officer', 'state': 'Maharashtra'},
        {'name': 'Sunita Devi', 'email': 'officer3@nigraniai.gov.in', 'password': 'Officer@2026',
         'role': 'officer', 'designation': 'Field Inspection Officer', 'state': 'Bihar'},
        {'name': 'Mohan Lal', 'email': 'officer4@nigraniai.gov.in', 'password': 'Officer@2026',
         'role': 'officer', 'designation': 'District Welfare Inspector', 'state': 'Rajasthan'},
        {'name': 'Kavita Patel', 'email': 'officer5@nigraniai.gov.in', 'password': 'Officer@2026',
         'role': 'officer', 'designation': 'Field Inspection Officer', 'state': 'Gujarat'},
        {'name': 'Viewer Demo', 'email': 'viewer@nigraniai.gov.in', 'password': 'Viewer@2026',
         'role': 'viewer', 'designation': 'Data Analyst', 'state': 'Delhi'},
    ]
    for ud in user_data:
        email = ud['email'].lower()
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=ud['name'],
                email=email,
                role_id=roles[ud['role']].id if ud['role'] in roles else None,
                designation=ud.get('designation'),
                state=ud.get('state'),
                district=ud.get('district'),
                is_active=True,
            )
            user.set_password(ud['password'])
            db.session.add(user)
        users[email] = user
    db.session.commit()
    print(f"  [OK] Users seeded: {len(user_data)} users")
    return users


def seed_schemes():
    schemes = {}
    for sd in SCHEME_DATA:
        scheme = Scheme.query.filter_by(code=sd['code']).first()
        if not scheme:
            scheme = Scheme(**sd)
            db.session.add(scheme)
    db.session.commit()
    for sd in SCHEME_DATA:
        schemes[sd['code']] = Scheme.query.filter_by(code=sd['code']).first()
    print(f"  [OK] Schemes seeded: {len(schemes)}")
    return schemes


def seed_projects(schemes, users):
    if Project.query.count() > 0:
        print("  [SKIP] Projects already exist")
        return Project.query.all()

    projects = []
    scheme_list = list(schemes.values())
    now = datetime.utcnow()

    for i, name in enumerate(PROJECT_NAMES):
        state = random.choice(STATES)
        district = random.choice(DISTRICTS.get(state, ['Capital']))
        scheme = random.choice(scheme_list)
        compliance = round(random.uniform(45, 100), 2)
        risk_score = round(max(0, 100 - compliance + random.uniform(-10, 20)), 2)

        if risk_score >= 75:
            risk_level = 'critical'
        elif risk_score >= 55:
            risk_level = 'high'
        elif risk_score >= 30:
            risk_level = 'moderate'
        else:
            risk_level = 'low'

        last_insp = now - timedelta(days=random.randint(15, 300))
        next_due = last_insp + timedelta(days=random.randint(60, 180))

        project = Project(
            project_id=f'PRJ{str(i+1).zfill(5)}',
            name=name,
            institution_name=f'{name} Institute',
            institution_type=random.choice(INSTITUTION_TYPES),
            scheme_id=scheme.id,
            state=state,
            district=district,
            address=f'{random.randint(1,999)}, Welfare Colony, {district}',
            latitude=round(random.uniform(8.0, 37.0), 6),
            longitude=round(random.uniform(68.0, 97.0), 6),
            project_manager=random.choice(['Ramesh Gupta', 'Anita Mishra', 'Suresh Tiwari',
                                           'Meena Joshi', 'Vikram Singh']),
            contact_email=f'contact.{i+1}@welfare.org',
            contact_phone=f'9{random.randint(100000000, 999999999)}',
            registered_beneficiaries=random.randint(20, 500),
            sanctioned_capacity=random.randint(25, 600),
            status=random.choices(['active', 'active', 'active', 'inactive', 'under_review'],
                                  weights=[70, 70, 70, 10, 10])[0],
            compliance_score=compliance,
            risk_score=risk_score,
            risk_level=risk_level,
            last_inspection_date=last_insp,
            next_inspection_due=next_due,
            camera_count=random.randint(0, 4),
        )
        db.session.add(project)
        projects.append(project)

    db.session.commit()
    print(f"  [OK] Projects seeded: {len(projects)}")
    return projects


def seed_cameras(projects):
    if Camera.query.count() > 0:
        print("  [SKIP] Cameras already exist")
        return
    count = 0
    for project in projects:
        for j in range(project.camera_count):
            cam = Camera(
                project_id=project.id,
                name=f'CAM-{j+1:02d}',
                location_desc=random.choice(['Main Entrance', 'Hall', 'Dormitory', 'Kitchen', 'Garden']),
                status=random.choice(['simulated', 'simulated', 'connected', 'disconnected']),
                is_active=True,
            )
            db.session.add(cam)
            count += 1
    db.session.commit()
    print(f"  [OK] Cameras seeded: {count}")


def seed_attendance(projects):
    if AttendanceRecord.query.count() > 0:
        print("  [SKIP] Attendance records already exist")
        return
    count = 0
    today = date.today()
    for project in random.sample(projects, min(15, len(projects))):
        for days_ago in range(30):
            rec_date = today - timedelta(days=days_ago)
            expected = random.randint(5, 20)
            reported = random.randint(expected - 2, expected)
            actual = random.randint(reported - 4, reported)
            actual = max(0, actual)
            discrepancy = reported - actual
            is_anomalous = discrepancy > 3

            rec = AttendanceRecord(
                project_id=project.id,
                record_date=rec_date,
                expected_staff=expected,
                reported_present=reported,
                actual_present=actual,
                discrepancy=discrepancy,
                is_anomalous=is_anomalous,
            )
            db.session.add(rec)
            count += 1
    db.session.commit()
    print(f"  [OK] Attendance records seeded: {count}")


def seed_assignments_inspections(projects, users, roles):
    if Assignment.query.count() > 0:
        print("  [SKIP] Assignments already exist")
        return

    officers = User.query.filter_by(role_id=roles['officer'].id).all()
    admin = User.query.filter_by(role_id=roles['admin'].id).first()
    now = datetime.utcnow()
    insp_count = 0
    asn_count = 0

    statuses = ['approved', 'approved', 'submitted', 'in_progress', 'assigned', 'closed', 'rejected']
    insp_types = ['surprise', 'surprise', 'scheduled', 'follow_up', 'emergency']

    for project in random.sample(projects, min(20, len(projects))):
        officer = random.choice(officers)
        insp_type = random.choice(insp_types)
        insp_status = random.choice(statuses)
        if insp_status in ['submitted', 'approved', 'closed', 'rejected']:
            asn_status = 'completed'
        elif insp_status in ['in_progress']:
            asn_status = 'in_progress'
        else:
            asn_status = 'pending'

        assignment = Assignment(
            project_id=project.id,
            officer_id=officer.id,
            created_by=admin.id,
            inspection_type=insp_type,
            assignment_reason='AI-selected based on risk score and compliance data',
            risk_score_at_assignment=project.risk_score,
            status=asn_status,
            is_announced=(insp_type == 'scheduled'),
            created_at=now - timedelta(days=random.randint(1, 90)),
        )
        db.session.add(assignment)
        db.session.flush()

        submitted_at = (now - timedelta(days=random.randint(1, 30))) if insp_status in [
            'submitted', 'approved', 'closed', 'rejected'] else None

        inspection = Inspection(
            inspection_id=f'INS{str(insp_count+1).zfill(7)}',
            project_id=project.id,
            assignment_id=assignment.id,
            inspection_type=insp_type,
            status=insp_status,
            observations=random.choice([
                'Beneficiaries appear well-cared for. Facilities are adequate.',
                'Staff shortage observed. Records not properly maintained.',
                'Excellent maintenance. All documentation up to date.',
                'Minor issues with sanitation. Food quality needs improvement.',
                'Serious discrepancy in beneficiary count observed.',
            ]),
            findings=random.choice([
                'No major findings.',
                'Staff attendance register not updated for last 2 weeks.',
                'Fire extinguisher expired. No emergency evacuation plan.',
                'Beneficiary records incomplete for 30% of residents.',
                None,
            ]),
            severity=random.choice(['low', 'medium', 'high', 'critical', None]),
            score=round(random.uniform(40, 100), 2),
            latitude=project.latitude,
            longitude=project.longitude,
            submitted_at=submitted_at,
            started_at=(submitted_at - timedelta(hours=2)) if submitted_at else None,
            created_at=assignment.created_at + timedelta(hours=1),
        )
        db.session.add(inspection)
        db.session.flush()

        # Checklist responses
        for item in CHECKLIST_ITEMS:
            response = random.choice(['yes', 'yes', 'yes', 'no', 'partial', 'na'])
            cr = ChecklistResponse(
                inspection_id=inspection.id,
                category=item['category'],
                question=item['question'],
                response=response,
                remarks='Verified during site visit.' if response == 'yes' else 'Requires attention.',
                severity='high' if response == 'no' else 'low',
            )
            db.session.add(cr)

        insp_count += 1
        asn_count += 1

    db.session.commit()
    print(f"  [OK] Assignments seeded: {asn_count}, Inspections: {insp_count}")


def seed_alerts(projects):
    if Alert.query.count() > 0:
        print("  [SKIP] Alerts already exist")
        return

    alert_templates = [
        {'type': 'high_risk', 'title': 'High Risk Project Flagged', 'severity': 'high'},
        {'type': 'overdue_inspection', 'title': 'Inspection Overdue', 'severity': 'medium'},
        {'type': 'attendance_anomaly', 'title': 'Staff Attendance Anomaly Detected', 'severity': 'high'},
        {'type': 'compliance_violation', 'title': 'Compliance Threshold Breach', 'severity': 'critical'},
        {'type': 'camera_down', 'title': 'Surveillance Camera Offline', 'severity': 'low'},
        {'type': 'ai_anomaly', 'title': 'AI Pattern Anomaly Detected', 'severity': 'high'},
    ]

    count = 0
    now = datetime.utcnow()
    for project in random.sample(projects, min(20, len(projects))):
        num_alerts = random.randint(0, 3)
        for _ in range(num_alerts):
            template = random.choice(alert_templates)
            alert = Alert(
                project_id=project.id,
                alert_type=template['type'],
                title=template['title'],
                description=f"Automated alert for {project.name} in {project.district}, {project.state}.",
                severity=template['severity'],
                risk_score=project.risk_score,
                triggering_factors='["compliance_drop", "attendance_anomaly"]',
                status=random.choice(['open', 'open', 'acknowledged', 'resolved']),
                is_ai_generated=True,
                created_at=now - timedelta(days=random.randint(0, 30)),
            )
            db.session.add(alert)
            count += 1

    db.session.commit()
    print(f"  [OK] Alerts seeded: {count}")


def main():
    with app.app_context():
        print("\n=== NigraniAI Database Seeding ===")
        db.create_all()
        print("[1] Seeding roles...")
        roles = seed_roles()
        print("[2] Seeding users...")
        users = seed_users(roles)
        print("[3] Seeding schemes...")
        schemes = seed_schemes()
        print("[4] Seeding projects...")
        projects = seed_projects(schemes, users)
        print("[5] Seeding cameras...")
        seed_cameras(projects)
        print("[6] Seeding attendance records...")
        seed_attendance(projects)
        print("[7] Seeding assignments & inspections...")
        seed_assignments_inspections(projects, users, roles)
        print("[8] Seeding alerts...")
        seed_alerts(projects)
        print("\n=== Seeding Complete ===")
        print("\nExpected Demo Accounts (Password: Demo@1234):")
        print("  Admin:    admin@nigrani.gov.in")
        print("  Official: official@nigrani.gov.in")
        print("  Officer:  officer@nigrani.gov.in")
        print("  NGO:      ngo@demo.org")
        print("  Auditor:  auditor@nigrani.gov.in")
        print()


if __name__ == '__main__':
    main()
