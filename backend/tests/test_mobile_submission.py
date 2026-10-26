import sys
import os
import io
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.inspection import Inspection, Assignment
from app.models.evidence import Evidence
from app.models.project import Project
from app.models.user import User
from flask_jwt_extended import create_access_token
import hashlib

class MobileWorkspaceSubmissionTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('development')
        self.client = self.app.test_client()
        self.png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        self.jpg_bytes = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
        )

        # Login as demo officer
        res = self.client.post('/api/auth/login', json={'email': 'officer@nigrani.gov.in', 'password': 'Demo@1234'})
        self.assertEqual(res.status_code, 200)
        self.officer_token = res.get_json()['access_token']
        self.officer_headers = {'Authorization': f'Bearer {self.officer_token}'}

        # Login as admin for cross-inspection authorization
        res_admin = self.client.post('/api/auth/login', json={'email': 'admin@nigrani.gov.in', 'password': 'Demo@1234'})
        self.assertEqual(res_admin.status_code, 200)
        self.admin_token = res_admin.get_json()['access_token']
        self.admin_headers = {'Authorization': f'Bearer {self.admin_token}'}

        with self.app.app_context():
            officer = User.query.filter_by(email='officer@nigrani.gov.in').first()
            # Prepare inspection 25 as active assigned inspection
            insp = db.session.get(Inspection, 25)
            if insp:
                insp.status = 'assigned'
                insp.observations = None
                insp.findings = None
                insp.submitted_at = None
                insp.started_at = None
                if insp.assignment:
                    insp.assignment.status = 'pending'
                # Clean up any existing test evidence for inspection 25
                for e in Evidence.query.filter_by(inspection_id=25).all():
                    db.session.delete(e)
                db.session.commit()
            self.target_id = 25
            self.target_project_id = insp.project_id if insp else 8

    def test_01_inspections_list(self):
        res = self.client.get('/api/inspections?per_page=15', headers=self.officer_headers)
        self.assertEqual(res.status_code, 200)
        inspections = res.get_json()['inspections']
        self.assertTrue(len(inspections) > 0)
        found = next((i for i in inspections if i['id'] == self.target_id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found['status'], 'assigned')

    def test_02_validation_missing_observations(self):
        res = self.client.patch(
            f'/api/inspections/{self.target_id}',
            data={'status': 'submitted', 'findings': 'Test findings', 'severity': 'medium'},
            headers=self.officer_headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('observations', res.get_json().get('error', '').lower())

    def test_03_validation_missing_findings(self):
        res = self.client.patch(
            f'/api/inspections/{self.target_id}',
            data={'status': 'submitted', 'observations': 'Test obs', 'severity': 'medium'},
            headers=self.officer_headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('findings', res.get_json().get('error', '').lower())

    def test_04_validation_invalid_severity(self):
        res = self.client.patch(
            f'/api/inspections/{self.target_id}',
            data={'status': 'submitted', 'observations': 'Test obs', 'findings': 'Test finds', 'severity': 'extreme'},
            headers=self.officer_headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('severity', res.get_json().get('error', '').lower())

    def test_05_validation_invalid_file_extension(self):
        res = self.client.patch(
            f'/api/inspections/{self.target_id}',
            data={
                'status': 'submitted',
                'observations': 'Valid observation',
                'findings': 'Valid finding',
                'severity': 'medium',
                'file': (io.BytesIO(b'malicious content'), 'exploit.exe')
            },
            headers=self.officer_headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('format', res.get_json().get('error', '').lower())

    def test_06_unauthorized_officer_submission(self):
        # Officer 11 trying to modify inspection 24 (assigned to officer 5)
        res = self.client.patch(
            '/api/inspections/24',
            data={'status': 'submitted', 'observations': 'Obs', 'findings': 'Finds'},
            headers=self.officer_headers
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn('unauthorized', res.get_json().get('error', '').lower())

    def test_07_nonexistent_inspection(self):
        res = self.client.patch('/api/inspections/99999', data={'status': 'submitted'}, headers=self.officer_headers)
        self.assertEqual(res.status_code, 404)

    def test_08_successful_submission_workflow_and_persistence(self):
        submit_data = {
            'status': 'submitted',
            'inspection_id': str(self.target_id),
            'project_id': str(self.target_project_id),
            'observations': 'On-site verification completed. Beneficiary attendance aligns with records. Infrastructure clean and functional.',
            'findings': 'No major non-compliance detected. Minor maintenance required in secondary washroom.',
            'severity': 'medium',
            'latitude': '19.07600',
            'longitude': '72.87770',
            'file': (io.BytesIO(self.png_bytes), 'inspection_evidence.png'),
            'description': 'On-site mobile evidence capture'
        }
        res = self.client.patch(f'/api/inspections/{self.target_id}', data=submit_data, headers=self.officer_headers)
        self.assertEqual(res.status_code, 200)
        resp_json = res.get_json()
        self.assertEqual(resp_json['status'], 'submitted')
        self.assertEqual(resp_json['observations'], submit_data['observations'])
        self.assertEqual(resp_json['findings'], submit_data['findings'])
        self.assertEqual(resp_json['severity'], 'medium')
        self.assertEqual(len(resp_json.get('evidence', [])), 1)

        # Verify DB persistence
        with self.app.app_context():
            insp_db = db.session.get(Inspection, self.target_id)
            self.assertEqual(insp_db.status, 'submitted')
            self.assertIsNotNone(insp_db.submitted_at)
            self.assertIsNotNone(insp_db.started_at)
            self.assertAlmostEqual(insp_db.latitude, 19.076, places=4)
            self.assertAlmostEqual(insp_db.longitude, 72.8777, places=4)

            assign_db = db.session.get(Assignment, insp_db.assignment_id)
            self.assertEqual(assign_db.status, 'completed')
            self.assertIsNotNone(assign_db.completed_at)

            project_db = db.session.get(Project, self.target_project_id)
            self.assertIsNotNone(project_db.last_inspection_date)

            evi_db = Evidence.query.filter_by(inspection_id=self.target_id).first()
            self.assertIsNotNone(evi_db)
            self.assertEqual(evi_db.evidence_type, 'photo')
            self.assertTrue(os.path.exists(evi_db.file_path))

        # Verify duplicate submission is rejected
        dup_data = {
            'status': 'submitted',
            'inspection_id': str(self.target_id),
            'project_id': str(self.target_project_id),
            'observations': 'Duplicate attempt observations.',
            'findings': 'Duplicate attempt findings.',
            'severity': 'medium',
            'file': (io.BytesIO(self.png_bytes), 'dup_evidence.png'),
        }
        res_dup = self.client.patch(f'/api/inspections/{self.target_id}', data=dup_data, headers=self.officer_headers)
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn('already been submitted', res_dup.get_json().get('error', '').lower())

    def test_09_standalone_evidence_upload(self):
        evi_upload_data = {
            'project_id': str(self.target_project_id),
            'inspection_id': str(self.target_id),
            'latitude': '19.07600',
            'longitude': '72.87770',
            'description': 'Standalone secondary evidence capture',
            'file': (io.BytesIO(self.png_bytes), 'secondary_evidence.png')
        }
        evi_res = self.client.post('/api/evidence/upload', data=evi_upload_data, headers=self.officer_headers)
        self.assertEqual(evi_res.status_code, 201)
        self.assertTrue(evi_res.get_json().get('evidence_id', '').startswith('EVI'))

    def test_10_jpg_evidence_submission_workflow_inspection_41(self):
        """Verify submitting report with a JPG image on inspection 41 (INS4203837) succeeds and links properly."""
        with self.app.app_context():
            insp_41 = db.session.get(Inspection, 41)
            self.assertIsNotNone(insp_41, 'Inspection 41 must exist in the database')
            existing_evi = Evidence.query.filter_by(inspection_id=41).first()
            if existing_evi:
                # If inspection 41 already has live submitted evidence (e.g. EVI6632275), preserve it and verify
                self.assertEqual(insp_41.status, 'submitted')
                self.assertTrue(os.path.isfile(existing_evi.file_path))
                self.assertEqual(existing_evi.evidence_type, 'photo')
                res = self.client.get(f'/api/evidence/{existing_evi.id}/file')
                self.assertEqual(res.status_code, 200)
                self.assertIn('image/', res.content_type)
                return

            pid = insp_41.project_id
            officer_id = insp_41.assignment.officer_id if insp_41.assignment else 3
            token = create_access_token(identity=str(officer_id))
            assigned_officer_headers = {'Authorization': f'Bearer {token}'}

        submit_data = {
            'status': 'submitted',
            'inspection_id': '41',
            'project_id': str(pid),
            'observations': 'Physical infrastructure verified on site. Attendance register matched.',
            'findings': 'All documentation verified. Minor paint flaking in hallway.',
            'severity': 'low',
            'latitude': '19.07600',
            'longitude': '72.87770',
            'file': (io.BytesIO(self.jpg_bytes), 'INSPECTION_ON_SITE_41.JPG'),
            'description': 'On-site mobile evidence capture'
        }

        res = self.client.patch('/api/inspections/41', data=submit_data, headers=assigned_officer_headers)
        self.assertEqual(res.status_code, 200, f'Expected 200 but got {res.status_code}: {res.get_json()}')
        resp_json = res.get_json()
        self.assertEqual(resp_json['id'], 41)
        self.assertEqual(resp_json['inspection_id'], 'INS4203837')
        self.assertEqual(resp_json['status'], 'submitted')
        self.assertEqual(resp_json['severity'], 'low')
        self.assertEqual(len(resp_json.get('evidence', [])), 1)
        evi = resp_json['evidence'][0]
        self.assertEqual(evi['evidence_type'], 'photo')
        self.assertTrue(evi['file_name'].lower().endswith('.jpg'))

        expected_hash = hashlib.sha256(self.jpg_bytes).hexdigest()

        # Verify DB records & physical disk file
        with self.app.app_context():
            insp_db = db.session.get(Inspection, 41)
            self.assertEqual(insp_db.status, 'submitted')
            self.assertIsNotNone(insp_db.submitted_at)
            self.assertEqual(insp_db.assignment.status, 'completed')

            evi_db = Evidence.query.filter_by(inspection_id=41).first()
            self.assertIsNotNone(evi_db)
            self.assertEqual(evi_db.evidence_id, evi['evidence_id'])
            self.assertTrue(os.path.isabs(evi_db.file_path), f'file_path must be absolute: {evi_db.file_path}')
            self.assertTrue(os.path.isfile(evi_db.file_path), f'file must physically exist at: {evi_db.file_path}')
            self.assertEqual(evi_db.file_size, len(self.jpg_bytes))
            self.assertEqual(evi_db.file_hash, expected_hash)

            # Verify saved bytes match exactly
            with open(evi_db.file_path, 'rb') as f:
                saved_bytes = f.read()
            self.assertEqual(saved_bytes, self.jpg_bytes)

            evidence_db_id = evi_db.id
            evidence_code = evi_db.evidence_id

        # Verify serving endpoint retrieves the identical file
        file_res = self.client.get(f'/api/evidence/{evidence_db_id}/file', headers=assigned_officer_headers)
        self.assertEqual(file_res.status_code, 200)
        self.assertEqual(file_res.data, self.jpg_bytes)

        # Verify serving by code retrieves the identical file
        code_res = self.client.get(f'/api/evidence/by-code/{evidence_code}/file', headers=assigned_officer_headers)
        self.assertEqual(code_res.status_code, 200)
        self.assertEqual(code_res.data, self.jpg_bytes)

    def test_11_jpg_evidence_filename_edge_cases(self):
        """Verify filenames with uppercase extension, spaces, or client path prefixes are safely processed."""
        evi_upload_data = {
            'project_id': str(self.target_project_id),
            'inspection_id': str(self.target_id),
            'latitude': '19.07600',
            'longitude': '72.87770',
            'description': 'Uppercase JPG extension test',
            'file': (io.BytesIO(self.jpg_bytes), r'C:\fakepath\FIELD PHOTO 2026.JPG')
        }
        evi_res = self.client.post('/api/evidence/upload', data=evi_upload_data, headers=self.officer_headers)
        self.assertEqual(evi_res.status_code, 201)
        data = evi_res.get_json()
        self.assertTrue(data['file_name'].lower().endswith('.jpg'))
        self.assertEqual(data['evidence_type'], 'photo')

    def test_12_rollback_on_evidence_processing_error(self):
        """Verify that when evidence processing encounters an error, db.session rolls back cleanly."""
        bad_data = {
            'status': 'submitted',
            'observations': 'Valid observation',
            'findings': 'Valid finding',
            'severity': 'low',
            'latitude': '999.0',  # Invalid latitude triggers 400
            'file': (io.BytesIO(self.jpg_bytes), 'test.jpg')
        }
        res = self.client.patch(f'/api/inspections/{self.target_id}', data=bad_data, headers=self.officer_headers)
        self.assertEqual(res.status_code, 400)

        # Subsequent valid request must succeed without session pollution
        good_data = {
            'status': 'submitted',
            'observations': 'Valid observation after failure',
            'findings': 'Valid finding after failure',
            'severity': 'low',
            'file': (io.BytesIO(self.jpg_bytes), 'valid_after_fail.jpg')
        }
        res_good = self.client.patch(f'/api/inspections/{self.target_id}', data=good_data, headers=self.officer_headers)
        self.assertEqual(res_good.status_code, 200)

    def test_13_health_check_endpoint(self):
        """Verify /api/health endpoint reports healthy status and verifies uploads directory."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['upload_folder_exists'])
        self.assertTrue(data['photos_folder_exists'])

    def test_14_evidence_repository_contract_and_image_serving(self):
        """Verify /api/evidence returns file_url and download_url, and media can be retrieved without Authorization header."""
        res = self.client.get('/api/evidence', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('evidence', data)
        self.assertGreater(len(data['evidence']), 0)

        for item in data['evidence']:
            self.assertIn('file_url', item)
            self.assertIn('download_url', item)
            self.assertTrue(item['file_url'].startswith('/api/evidence/'))

        # Pick photo evidence and verify browser image request (unauthenticated GET) succeeds
        photo_items = [e for e in data['evidence'] if e.get('evidence_type') == 'photo']
        self.assertGreater(len(photo_items), 0, 'Must have at least one photo in repository')

        target = photo_items[0]
        img_res = self.client.get(target['file_url'])
        self.assertEqual(img_res.status_code, 200)
        self.assertIn('image/', img_res.content_type)
        self.assertGreater(len(img_res.data), 0)

    def test_15_evidence_evi6632275_retrieval(self):
        """Verify EVI6632275 for Vishwas Disability Welfare Trust physically exists and is retrievable by ID and code."""
        with self.app.app_context():
            e = Evidence.query.filter_by(evidence_id='EVI6632275').first()
            self.assertIsNotNone(e, 'Evidence EVI6632275 must exist in database')
            self.assertEqual(e.project.name, 'Vishwas Disability Welfare Trust')
            self.assertEqual(e.inspection_id, 41)
            self.assertTrue(os.path.isfile(e.file_path), f'File must exist on disk at {e.file_path}')
            disk_size = os.path.getsize(e.file_path)
            self.assertEqual(disk_size, e.file_size)

            with open(e.file_path, 'rb') as f:
                disk_bytes = f.read()

            evidence_id = e.id

        # 1. Unauthenticated browser GET by ID (as used by <img src="/api/evidence/{id}/file" />)
        res_file = self.client.get(f'/api/evidence/{evidence_id}/file')
        self.assertEqual(res_file.status_code, 200)
        self.assertEqual(res_file.content_type, 'image/jpeg')
        self.assertEqual(len(res_file.data), disk_size)
        self.assertEqual(res_file.data, disk_bytes)

        # 2. Unauthenticated browser GET by code
        res_code = self.client.get('/api/evidence/by-code/EVI6632275/file')
        self.assertEqual(res_code.status_code, 200)
        self.assertEqual(res_code.content_type, 'image/jpeg')
        self.assertEqual(res_code.data, disk_bytes)

        # 3. Authenticated download
        res_dl = self.client.get(f'/api/evidence/{evidence_id}/download', headers=self.admin_headers)
        self.assertEqual(res_dl.status_code, 200)
        self.assertEqual(res_dl.data, disk_bytes)

    def test_16_all_evidence_records_file_resolution(self):
        """Verify every evidence record in the database resolves to a valid media file without broken 404s."""
        with self.app.app_context():
            all_records = Evidence.query.all()
            self.assertGreater(len(all_records), 0)

        for e in all_records:
            res = self.client.get(f'/api/evidence/{e.id}/file')
            self.assertEqual(
                res.status_code,
                200,
                f'Evidence {e.id} ({e.evidence_id}) file failed to resolve: {res.get_json()}'
            )
            self.assertGreater(len(res.data), 0)

    def test_17_evidence_review_authorization_and_workflow(self):
        """Verify authorized review workflow: role checks, persist decision, reviewer tracking, and inspection status decoupling."""
        with self.app.app_context():
            insp_41 = db.session.get(Inspection, 41)
            initial_insp_status = insp_41.status
            e = Evidence.query.filter_by(evidence_id='EVI6632275').first()
            self.assertIsNotNone(e)
            evidence_id = e.id

        # 1. Unauthorized officer attempt -> 403 Forbidden
        res_officer = self.client.patch(
            f'/api/evidence/{evidence_id}/verify',
            json={'verification_status': 'verified', 'reviewer_notes': 'Officer trying to approve own report'},
            headers=self.officer_headers
        )
        self.assertEqual(res_officer.status_code, 403)
        self.assertIn('Access denied', res_officer.get_json().get('error', ''))

        # 2. Authorized admin review -> 200 OK
        review_payload = {
            'verification_status': 'verified',
            'reviewer_notes': 'Field muster roll cross-checked with attendance roster. Telemetry verified within 15m.'
        }
        res_admin = self.client.patch(
            f'/api/evidence/{evidence_id}/verify',
            json=review_payload,
            headers=self.admin_headers
        )
        self.assertEqual(res_admin.status_code, 200)
        data = res_admin.get_json()
        self.assertEqual(data['verification_status'], 'verified')
        self.assertEqual(data['reviewer_notes'], review_payload['reviewer_notes'])
        self.assertIsNotNone(data.get('reviewer_name'))
        self.assertIsNotNone(data.get('reviewed_at'))

        # 3. Verify database persistence and decoupling from inspection status
        with self.app.app_context():
            e_db = db.session.get(Evidence, evidence_id)
            self.assertEqual(e_db.verification_status, 'verified')
            self.assertEqual(e_db.reviewer_notes, review_payload['reviewer_notes'])
            self.assertIsNotNone(e_db.reviewed_at)

            insp_check = db.session.get(Inspection, 41)
            self.assertEqual(
                insp_check.status,
                initial_insp_status,
                'Inspection report status must remain decoupled from evidence verification status'
            )

        # 4. Refresh repository list and confirm updated reviewer metadata is present
        list_res = self.client.get('/api/evidence', headers=self.admin_headers)
        self.assertEqual(list_res.status_code, 200)
        items = list_res.get_json()['evidence']
        found = next((item for item in items if item['id'] == evidence_id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found['verification_status'], 'verified')
        self.assertIsNotNone(found.get('reviewer_name'))
        self.assertEqual(found.get('reviewer_notes'), review_payload['reviewer_notes'])

        # Reset back to pending so user can test the interactive UI
        with self.app.app_context():
            e_db = db.session.get(Evidence, evidence_id)
            e_db.verification_status = 'pending'
            e_db.reviewer_notes = None
            e_db.reviewer_id = None
            e_db.reviewed_at = None
            db.session.commit()

    def test_18_new_upload_defaults_to_pending_not_auto_approved(self):
        """Verify uploaded evidence strictly defaults to pending status and is not automatically approved."""
        upload_data = {
            'project_id': str(self.target_project_id),
            'inspection_id': str(self.target_id),
            'latitude': '19.07600',
            'longitude': '72.87770',
            'description': 'Verification default status test',
            'file': (io.BytesIO(self.jpg_bytes), 'default_status_test.jpg')
        }
        res = self.client.post('/api/evidence/upload', data=upload_data, headers=self.officer_headers)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(
            data.get('verification_status'),
            'pending',
            'New evidence uploads must default to pending and cannot be auto-approved'
        )

        with self.app.app_context():
            e_db = db.session.get(Evidence, data['id'])
            self.assertEqual(e_db.verification_status, 'pending')
            # Clean up test upload
            if os.path.exists(e_db.file_path):
                try: os.remove(e_db.file_path)
                except OSError: pass
            db.session.delete(e_db)
            db.session.commit()

    def test_19_missing_file_fallback_returns_404_cleanly(self):
        """Verify requesting non-existent evidence returns 404 with structured error JSON."""
        res = self.client.get('/api/evidence/999999/file')
        self.assertEqual(res.status_code, 404)
        self.assertIn('not found', res.get_json().get('error', '').lower())

if __name__ == '__main__':
    unittest.main()

