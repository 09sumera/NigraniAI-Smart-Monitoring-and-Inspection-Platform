# NigraniAI — Smart Real-Time Monitoring & Inspection Platform
## Problem Statement: SIH26095 | Ministry of Social Justice & Empowerment (MoSJE)

A centralized command & oversight platform for monitoring projects, institutes, and NGOs operating under DoSJE schemes. Features automated surprise inspections, live CCTV feeds, WebRTC random video verification, geo-tagged mobile evidence collection, and AI anomaly analytics.

---

## 🚀 Quick Start Guide

### 1. Backend (Flask REST API)
```powershell
cd backend
.\venv\Scripts\activate
# If running fresh:
pip install -r requirements.txt
python scripts/seed_data.py   # Seeds 30 projects, 62 cameras, 450 attendance logs
python run.py
```
- **API URL:** `http://localhost:5000`
- **CORS:** Enabled for `http://localhost:5173`

---

### 2. Frontend (React 18 + TypeScript + Vite + Tailwind CSS)
```powershell
cd frontend
npm install
npm run dev
```
- **Command Center URL:** `http://localhost:5173`

---

## 🔐 Demo Credentials (Seeded)

| Role | Email | Password | Access Capabilities |
|------|-------|----------|---------------------|
| **Department Admin** | `admin@nigrani.gov.in` | `Demo@1234` | Full platform, user control, audit logs, algorithm settings |
| **Department Official** | `official@nigrani.gov.in` | `Demo@1234` | Command dashboard, live monitoring, trigger surprise audit |
| **Field Inspection Officer** | `officer@nigrani.gov.in` | `Demo@1234` | Mobile inspection workspace, geo-tagging, evidence upload |
| **NGO / Coordinator** | `ngo@demo.org` | `Demo@1234` | Institution oversight, compliance and performance metrics |
| **Auditor** | `auditor@nigrani.gov.in` | `Demo@1234` | Read-only reports, compliance scores, security audit trail |

*(Quick demo login buttons are also provided on the sign-in page for instant one-click access.)*

---

## 🏛️ All 17 Application Pages Implemented

1. **Overview Dashboard** (`/dashboard`): 8 real-time KPI metrics, 6-month trend bar charts, risk portfolio pie chart, and priority compliance alert cards.
2. **Projects & Institutions** (`/projects`): Search, multi-tier risk filtering, state filtering, full modal details, and new unit registration.
3. **Live Monitoring** (`/live-monitoring`): Real-time pulse monitoring of nationwide active units with risk metrics and camera counts.
4. **Surprise Inspections** (`/surprise-inspections`): Transparent weighted multi-factor selection engine (70% risk metrics + 30% unpredictable randomization with rotation lock).
5. **Inspection Calendar** (`/calendar`): Audit milestones, statutory due dates, and surprise inspection timelines.
6. **Inspection Assignments** (`/assignments`): Roster of active, completed, and pending field assignments with justification records.
7. **Mobile Inspection Workspace** (`/mobile-workspace`): Inspector field PWA interface with browser geolocation lock, photo/video evidence upload, and structured findings submission.
8. **CCTV Surveillance** (`/cctv`): Grid of 62 simulated/live camera nodes, stream viewer overlay with FPS/timestamp overlays.
9. **Random Video Verification** (`/video-verification`): WebRTC encrypted call terminal for spot verification with institute coordinators.
10. **AI Risk & Anomaly Analytics** (`/ai-analytics`): Machine-computed vulnerability index with rule-based and Isolation Forest anomaly tags.
11. **Attendance Analytics** (`/attendance`): Flagged variance registry comparing expected rosters vs reported staff.
12. **Inspection Reports** (`/reports`): Completed audit dossiers with CSV dossier export.
13. **Evidence Repository** (`/evidence`): SHA-256 cryptographically hashed physical audit media with latitude/longitude stamps.
14. **Alerts & Notifications** (`/alerts`): Severity-tiered escalations with real-time "Mark Resolved" workflows.
15. **User Management** (`/users`): RBAC role tiers, jurisdiction filtering, and account statuses.
16. **Audit Logs** (`/audit-logs`): Security ledger recording every dispatch, login, and report update.
17. **System Settings** (`/settings`): Hyperparameter tuning sliders for deterministic risk weighting vs randomization.
