import unittest
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from app import create_app, db
from app.models.user import User
from app.models.project import Project, AttendanceRecord
from app.models.alert import Alert
from app.models.settings import SystemSetting
from app.services.inspection_engine import InspectionEngine
from flask_jwt_extended import create_access_token


class EndToEndAuditModulesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('development')
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.client = self.app.test_client()

        self.admin = User.query.filter_by(email='admin@nigrani.gov.in').first()
        self.assertIsNotNone(self.admin, 'Admin user must exist')
        self.admin_token = create_access_token(identity=str(self.admin.id))
        self.auth_headers = {'Authorization': f'Bearer {self.admin_token}'}

    def tearDown(self):
        self.ctx.pop()

    def test_01_live_monitoring_status_endpoint(self):
        """Verify GET /api/monitoring/status returns active projects, coordinates, camera count, and telemetry status."""
        res = self.client.get('/api/monitoring/status', headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('projects', data)
        self.assertIn('total_active', data)
        self.assertGreater(len(data['projects']), 0)
        self.assertGreater(data['total_active'], 0)

        # Inspect first unit structure
        first = data['projects'][0]
        self.assertIn('latitude', first)
        self.assertIn('longitude', first)
        self.assertIn('camera_count', first)
        self.assertIn('telemetry_status', first)
        self.assertIn('risk_score', first)

    def test_02_ai_risk_analytics_anomalies_and_risk_endpoints(self):
        """Verify GET /api/analytics/risk and GET /api/analytics/anomalies return real database metrics."""
        # 1. /api/analytics/risk
        r_risk = self.client.get('/api/analytics/risk', headers=self.auth_headers)
        self.assertEqual(r_risk.status_code, 200)
        data_risk = r_risk.get_json()
        self.assertIn('projects', data_risk)
        self.assertIn('high_risk_projects', data_risk)
        self.assertGreater(len(data_risk['projects']), 0)
        self.assertIn('project_name', data_risk['projects'][0])

        # 2. /api/analytics/anomalies
        r_anom = self.client.get('/api/analytics/anomalies', headers=self.auth_headers)
        self.assertEqual(r_anom.status_code, 200)
        data_anom = r_anom.get_json()
        self.assertIn('anomalies', data_anom)
        self.assertGreater(len(data_anom['anomalies']), 0)
        first_anom = data_anom['anomalies'][0]
        self.assertIn('project_name', first_anom)
        self.assertIn('factors', first_anom)
        self.assertIn('detection_method', first_anom)

    def test_03_attendance_analytics_real_records(self):
        """Verify GET /api/analytics/attendance groups historical data and flags attendance variances."""
        res = self.client.get('/api/analytics/attendance', headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('trend', data)
        self.assertIn('anomalous_records', data)
        self.assertIn('total_records', data)
        self.assertIn('anomaly_rate', data)
        self.assertGreater(data['total_records'], 100)
        self.assertGreater(len(data['trend']), 0)

    def test_04_system_settings_persistence_and_engine_hyperparameters(self):
        """Verify GET and POST /api/settings update database and affect InspectionEngine dynamic weights."""
        # Save custom weights
        post_res = self.client.post('/api/settings', json={
            'risk_weight': 80,
            'random_weight': 20,
            'overdue_weight': 30,
            'compliance_weight': 20,
        }, headers=self.auth_headers)
        self.assertEqual(post_res.status_code, 200)
        data = post_res.get_json()
        self.assertEqual(data['risk_weight'], 80)
        self.assertEqual(data['random_weight'], 20)

        # Confirm persisted in database
        val_risk = SystemSetting.get_setting('risk_factor_influence')
        self.assertEqual(val_risk, '80')

        # Test InspectionEngine loads dynamic weights
        engine = InspectionEngine()
        dyn = engine._get_dynamic_weights()
        self.assertEqual(dyn['risk_influence'], 0.80)
        self.assertEqual(dyn['random_factor'], 0.20)
        self.assertEqual(dyn['w_overdue'], 0.30)

        # Reset back to default
        self.client.post('/api/settings', json={
            'risk_weight': 70,
            'random_weight': 30,
            'overdue_weight': 25,
            'compliance_weight': 20,
        }, headers=self.auth_headers)

    def test_05_alert_resolution_workflow(self):
        """Verify resolving an alert updates its database status and resolution timestamp."""
        # Create a temporary alert
        alert = Alert(
            title='Test Auditing Alert',
            description='Temporary test compliance flag for verification',
            severity='medium',
            status='open',
        )
        db.session.add(alert)
        db.session.commit()
        alert_id = alert.id

        # Resolve via PATCH /api/alerts/<id>
        patch_res = self.client.patch(f'/api/alerts/{alert_id}', json={
            'status': 'resolved',
            'reviewer_notes': 'Audited and verified in unit test'
        }, headers=self.auth_headers)
        self.assertEqual(patch_res.status_code, 200)

        # Check DB persistence
        reloaded = db.session.get(Alert, alert_id)
        self.assertEqual(reloaded.status, 'resolved')
        self.assertIsNotNone(reloaded.resolved_at)

        # Clean up
        db.session.delete(reloaded)
        db.session.commit()

    def test_06_reports_export_csv(self):
        """Verify GET /api/reports/export/csv exports real CSV records."""
        res = self.client.get('/api/reports/export/csv')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'text/csv')
        content = res.data.decode('utf-8')
        self.assertIn('Inspection ID', content)
        self.assertIn('Project Name', content)


if __name__ == '__main__':
    unittest.main()
