"""
seed_demo_users.py — Ensures the 5 standard NigraniAI demo accounts exist and are functional.

Usage:
    python scripts/seed_demo_users.py [--reset-passwords]

Expected Demo Accounts:
    admin@nigrani.gov.in
    official@nigrani.gov.in
    officer@nigrani.gov.in
    ngo@demo.org
    auditor@nigrani.gov.in
    Password: Demo@1234
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User, Role
from app.models.project import Project
from app.models.inspection import Assignment, Inspection
from app.utils.auth_utils import ensure_demo_accounts
import random

def main():
    reset_passwords = '--reset-passwords' in sys.argv or True  # Default to ensuring demo password works
    app = create_app('development')
    with app.app_context():
        db.create_all()
        print("[*] Checking roles and demo accounts...")
        ensure_demo_accounts(repair_passwords=reset_passwords)

        # Ensure officer@nigrani.gov.in has at least one assignment if projects exist
        officer = User.query.filter_by(email='officer@nigrani.gov.in').first()
        if officer:
            existing_asn = Assignment.query.filter_by(officer_id=officer.id).first()
            if not existing_asn and Project.query.count() > 0:
                proj = Project.query.first()
                admin = User.query.filter_by(email='admin@nigrani.gov.in').first()
                new_asn = Assignment(
                    project_id=proj.id,
                    officer_id=officer.id,
                    created_by=admin.id if admin else officer.id,
                    inspection_type='surprise',
                    assignment_reason='Demonstration surprise inspection task',
                    risk_score_at_assignment=proj.risk_score,
                    status='pending',
                    is_announced=False
                )
                db.session.add(new_asn)
                db.session.flush()

                insp = Inspection(
                    inspection_id=f"INS{random.randint(1000000, 9999999)}",
                    project_id=proj.id,
                    assignment_id=new_asn.id,
                    inspection_type='surprise',
                    status='assigned'
                )
                db.session.add(insp)
                db.session.commit()
                print("  [OK] Assigned demonstration inspection to officer@nigrani.gov.in")

        print("\n=== Demo Accounts Status ===")
        demo_emails = [
            'admin@nigrani.gov.in',
            'official@nigrani.gov.in',
            'officer@nigrani.gov.in',
            'ngo@demo.org',
            'auditor@nigrani.gov.in'
        ]
        for email in demo_emails:
            u = User.query.filter_by(email=email).first()
            if u:
                pw_check = u.check_password('Demo@1234')
                print(f"  - {u.email:<26} | Role: {u.role.name:<12} | Status: {'Active' if u.is_active else 'Inactive':<8} | Auth Verified: {pw_check}")
            else:
                print(f"  - {email:<26} | MISSING")
        print("\nAll demo accounts are ready for testing.\n")

if __name__ == '__main__':
    main()
