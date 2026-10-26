import sys
import os
import unittest
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.project import Project, AttendanceRecord
from app.models.alert import Alert
from app.models.user import User, Role
from app.models.inspection import Assignment, Inspection
from app.services.inspection_engine import InspectionEngine


class SurpriseInspectionSelectionTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('development')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        # Login as admin to get auth headers
        res = self.client.post('/api/auth/login', json={'email': 'admin@nigrani.gov.in', 'password': 'Demo@1234'})
        self.assertEqual(res.status_code, 200)
        self.admin_token = res.get_json()['access_token']
        self.admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        self.created_assignment_ids = []

    def tearDown(self):
        if self.created_assignment_ids:
            for aid in self.created_assignment_ids:
                a = db.session.get(Assignment, aid)
                if a:
                    if a.inspection:
                        db.session.delete(a.inspection)
                    db.session.delete(a)
            db.session.commit()
        self.ctx.pop()

    def test_01_saksham_project_is_in_database_and_eligible(self):
        """Verify Saksham Welfare Monitoring Project exists and is eligible for candidate pool."""
        saksham = Project.query.filter_by(name='Saksham Welfare Monitoring Project').first()
        self.assertIsNotNone(saksham, 'Saksham Welfare Monitoring Project should exist in database')
        self.assertEqual(saksham.state, 'Karnataka')
        self.assertEqual(saksham.district, 'Ballari')
        self.assertEqual(saksham.status, 'active')
        self.assertFalse(saksham.is_archived)

        engine = InspectionEngine()
        score, factors = engine._compute_project_score(saksham)
        self.assertGreater(score, 0, 'Saksham should receive a positive priority score as an uninspected unit')
        self.assertEqual(factors.get('overdue_type'), 'never_inspected')

    def test_02_scoring_factors_include_alerts_and_attendance_anomalies(self):
        """Verify risk-scoring algorithm factors in overdue days, compliance deficit, open alerts, and attendance anomalies."""
        engine = InspectionEngine()

        # Create temporary project in test transaction
        temp_project = Project(
            project_id='PRJ_TEST_SCORE',
            name='Test High Risk Unit',
            institution_name='Test Institute',
            state='Maharashtra',
            district='Pune',
            status='active',
            compliance_score=50.0,
            risk_score=60.0,
            next_inspection_due=datetime.utcnow() - timedelta(days=30),
        )
        db.session.add(temp_project)
        db.session.flush()

        # Add an open alert
        alert = Alert(
            project_id=temp_project.id,
            alert_type='attendance_anomaly',
            title='Staff Discrepancy',
            description='Severe mismatch in morning check-in',
            severity='high',
            status='open',
        )
        db.session.add(alert)

        # Add anomalous attendance records
        for i in range(3):
            att = AttendanceRecord(
                project_id=temp_project.id,
                record_date=datetime.utcnow().date() - timedelta(days=i),
                expected_staff=10,
                reported_present=10,
                actual_present=5,
                discrepancy=5,
                is_anomalous=True,
            )
            db.session.add(att)
        db.session.flush()

        score, factors = engine._compute_project_score(temp_project)
        self.assertEqual(factors['open_alerts'], 1)
        self.assertEqual(factors['attendance_anomalies'], 3)
        self.assertEqual(factors['overdue_type'], 'scheduled_overdue')
        self.assertGreaterEqual(factors['overdue_days'], 29)
        self.assertGreater(score, 45.0, 'Composite score should reflect accumulated risk factors')

        db.session.rollback()

    def test_03_active_units_with_pending_inspections_are_excluded_from_candidate_pool(self):
        """Verify that projects with ongoing or pending surprise inspections are ineligible."""
        engine = InspectionEngine()

        # Check Sahara (id 8) which already has pending inspections
        sahara = Project.query.filter_by(name='Sahara Women Welfare NGO').first()
        self.assertIsNotNone(sahara)

        # Confirm Sahara has pending assignments
        has_pending = any(a.status in ('pending', 'accepted', 'in_progress') for a in sahara.assignments)
        self.assertTrue(has_pending, 'Sahara should have pending assignments in the current database')

        # Run _select_project and verify Sahara is not selected while it has pending inspections
        selected_project, score, reason, candidate_pool_size = engine._select_project()
        self.assertIsNotNone(selected_project)
        self.assertNotEqual(selected_project.id, sahara.id, 'Sahara must not be selected while inspection is pending')
        self.assertGreater(candidate_pool_size, 0)

    def test_04_multiple_generations_rotate_across_candidates(self):
        """Verify multiple surprise inspections select different institutions rather than perpetually repeating."""
        selected_ids = []
        # Run 3 generations via API
        for i in range(3):
            res = self.client.post('/api/assignments/generate', json={'simulation_mode': True}, headers=self.admin_headers)
            self.assertEqual(res.status_code, 201)
            data = res.get_json()
            self.created_assignment_ids.append(data['assignment']['id'])
            pid = data['assignment']['project_id']
            selected_ids.append(pid)

        # Check that selections are unique across successive calls (no back-to-back repeats)
        self.assertEqual(len(selected_ids), len(set(selected_ids)), f'Selections should be distinct across calls: {selected_ids}')

    def test_05_metadata_linkage_in_api_response(self):
        """Verify project ID, institution name, state, district, and inspection records are properly returned."""
        res = self.client.post('/api/assignments/generate', json={'simulation_mode': True}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.created_assignment_ids.append(data['assignment']['id'])

        self.assertIn('inspection_id', data)
        self.assertTrue(data['inspection_id'].startswith('INS'))
        self.assertIn('assignment', data)
        self.assertIn('inspection', data)

        assignment = data['assignment']
        self.assertIsNotNone(assignment['project_name'])
        self.assertIsNotNone(assignment['project_state'])
        self.assertIsNotNone(assignment['district'])
        self.assertIsNotNone(assignment['officer_name'])
        self.assertEqual(assignment['inspection_id'], data['inspection_id'])

        # Verify inspection can be retrieved by inspection_id query
        list_res = self.client.get(f'/api/inspections?inspection_id={data["inspection_id"]}', headers=self.admin_headers)
        self.assertEqual(list_res.status_code, 200)
        list_data = list_res.get_json()
        self.assertEqual(len(list_data['inspections']), 1)
        fetched = list_data['inspections'][0]
        self.assertEqual(fetched['inspection_id'], data['inspection_id'])
        self.assertEqual(fetched['project_id'], assignment['project_id'])
        self.assertEqual(fetched['project_state'], assignment['project_state'])
        self.assertEqual(fetched['district'], assignment['district'])

        # Verify inspection can be retrieved by code endpoint
        code_res = self.client.get(f'/api/inspections/by-code/{data["inspection_id"]}', headers=self.admin_headers)
        self.assertEqual(code_res.status_code, 200)
        self.assertEqual(code_res.get_json()['inspection_id'], data['inspection_id'])

    def test_06_newly_registered_project_included_and_selectable(self):
        """Verify creating a new project adds it to the candidate pool and it can be evaluated."""
        import random, string
        suffix = ''.join(random.choices(string.digits, k=4))
        new_project_payload = {
            'name': f'Kalyan Seva Kendra {suffix}',
            'institution_name': f'Kalyan Welfare Trust {suffix}',
            'institution_type': 'Trust',
            'state': 'Karnataka',
            'district': 'Mysuru',
            'compliance_score': 85.0,
            'risk_score': 25.0,
            'risk_level': 'low',
            'status': 'active',
            'registered_beneficiaries': 75,
            'sanctioned_capacity': 100,
        }
        create_res = self.client.post('/api/projects', json=new_project_payload, headers=self.admin_headers)
        self.assertEqual(create_res.status_code, 201)
        created_project = create_res.get_json()
        pid = created_project['id']

        try:
            # Verify it is active and has no pending assignments
            proj = db.session.get(Project, pid)
            self.assertIsNotNone(proj)
            self.assertEqual(proj.status, 'active')
            self.assertEqual(len(proj.assignments), 0)

            # Verify it is scored by the engine
            engine = InspectionEngine()
            score, factors = engine._compute_project_score(proj)
            self.assertGreater(score, 0)
            self.assertEqual(factors['overdue_type'], 'never_inspected')
        finally:
            p_to_del = db.session.get(Project, pid)
            if p_to_del:
                for a in p_to_del.assignments:
                    if a.inspection: db.session.delete(a.inspection)
                    db.session.delete(a)
                db.session.delete(p_to_del)
                db.session.commit()

    def test_07_clear_feedback_when_no_eligible_institutions(self):
        """Verify clear error message is returned when no candidate units are eligible."""
        engine = InspectionEngine()
        # Query for non-existent state filter
        project, score, reason, pool_size = engine._select_project(state='NonExistentState')
        self.assertIsNone(project)
        self.assertIn('No active registered projects found in database', reason)

    def test_08_scenario_no_existing_inspections_is_eligible(self):
        """Scenario 1: Project with no existing inspections or assignments is eligible."""
        engine = InspectionEngine()
        temp_project = Project(
            project_id='PRJ_TEST_NO_INSP',
            name='Fresh Project Without Inspections',
            institution_name='Fresh Institute',
            state='Karnataka',
            district='Bengaluru Urban',
            status='active',
            compliance_score=90.0,
            risk_score=20.0,
        )
        db.session.add(temp_project)
        db.session.flush()

        try:
            self.assertEqual(len(temp_project.inspections), 0)
            self.assertEqual(len(temp_project.assignments), 0)
            self.assertTrue(engine.is_project_eligible(temp_project))
        finally:
            db.session.rollback()

    def test_09_scenario_active_inspection_is_excluded_preventing_duplicates(self):
        """Scenario 2: Project with an active inspection (assigned/in_progress/submitted) is ineligible."""
        engine = InspectionEngine()
        admin = User.query.filter_by(email='admin@nigrani.gov.in').first()
        officer_role = Role.query.filter_by(name='officer').first()
        officer = User.query.filter_by(role_id=officer_role.id).first()

        temp_project = Project(
            project_id='PRJ_TEST_ACTIVE_INSP',
            name='Project With Active Audit',
            institution_name='Active Audit Institute',
            state='Karnataka',
            district='Bengaluru Urban',
            status='active',
            compliance_score=80.0,
            risk_score=35.0,
        )
        db.session.add(temp_project)
        db.session.flush()

        try:
            for active_status in ['assigned', 'in_progress', 'submitted', 'under_review']:
                asn = Assignment(
                    project_id=temp_project.id,
                    officer_id=officer.id,
                    created_by=admin.id,
                    inspection_type='surprise',
                    status='pending' if active_status in ['assigned', 'in_progress'] else 'completed',
                )
                db.session.add(asn)
                db.session.flush()

                insp = Inspection(
                    inspection_id=f'INS_TEST_{active_status[:3].upper()}',
                    project_id=temp_project.id,
                    assignment_id=asn.id,
                    inspection_type='surprise',
                    status=active_status,
                )
                db.session.add(insp)
                db.session.flush()

                self.assertFalse(
                    engine.is_project_eligible(temp_project),
                    f"Project with inspection in '{active_status}' status must NOT be eligible (preventing duplicate active inspections)"
                )

                db.session.delete(insp)
                db.session.delete(asn)
                db.session.flush()
        finally:
            db.session.rollback()

    def test_10_scenario_completed_closed_inspection_is_eligible(self):
        """Scenario 3: Project with completed/closed/approved/rejected inspections is eligible."""
        engine = InspectionEngine()
        admin = User.query.filter_by(email='admin@nigrani.gov.in').first()
        officer_role = Role.query.filter_by(name='officer').first()
        officer = User.query.filter_by(role_id=officer_role.id).first()

        temp_project = Project(
            project_id='PRJ_TEST_CLOSED_INSP',
            name='Project With Closed History',
            institution_name='Closed History Institute',
            state='Karnataka',
            district='Bengaluru Urban',
            status='active',
            compliance_score=75.0,
            risk_score=40.0,
        )
        db.session.add(temp_project)
        db.session.flush()

        try:
            for closed_status in ['closed', 'approved', 'rejected', 'completed', 'cancelled']:
                asn = Assignment(
                    project_id=temp_project.id,
                    officer_id=officer.id,
                    created_by=admin.id,
                    inspection_type='surprise',
                    status='completed',
                )
                db.session.add(asn)
                db.session.flush()

                insp = Inspection(
                    inspection_id=f'INS_TEST_{closed_status[:3].upper()}',
                    project_id=temp_project.id,
                    assignment_id=asn.id,
                    inspection_type='surprise',
                    status=closed_status,
                )
                db.session.add(insp)
                db.session.flush()

                self.assertTrue(
                    engine.is_project_eligible(temp_project),
                    f"Project with closed inspection '{closed_status}' MUST be eligible for future surprise inspections"
                )

                db.session.delete(insp)
                db.session.delete(asn)
                db.session.flush()
        finally:
            db.session.rollback()

    def test_11_scenario_multiple_eligible_institutions_weighted_selection(self):
        """Scenario 4: When multiple institutions are eligible, pool size is tracked and risk selection operates."""
        engine = InspectionEngine()
        active_projects = Project.query.filter_by(is_archived=False, status='active').all()
        eligible_projects = [p for p in active_projects if engine.is_project_eligible(p)]

        self.assertGreaterEqual(
            len(eligible_projects), 2,
            f"Expected at least 2 eligible institutions in test database, found {len(eligible_projects)}"
        )

        selected_project, score, reason, candidate_pool_size = engine._select_project()
        self.assertIsNotNone(selected_project)
        self.assertEqual(candidate_pool_size, len(eligible_projects))
        self.assertIn(selected_project.id, [p.id for p in eligible_projects])
        self.assertIn(f"Risk-weighted random selection across {candidate_pool_size} eligible units", reason)


if __name__ == '__main__':
    unittest.main()
