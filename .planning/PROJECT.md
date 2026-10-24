# Project: NigraniAI (Smart Real-Time Monitoring & Inspection Platform)

## 📌 Executive Summary
**Problem Statement:** SIH26095 | Ministry of Social Justice & Empowerment (MoSJE)  
**Vision:** An intelligent, centralized command & oversight platform designed to ensure transparency, accountability, and real-time fraud/ghost-beneficiary detection across residential schools, rehabilitation homes, hostels, and NGOs funded by DoSJE schemes.

---

## 🎯 Target Audience & Personas
1. **Department Admin (MoSJE):** Platform governance, audit logs, algorithm risk weighting hyperparameter tuning, master access.
2. **Department Official / State Nodal Officer:** Nationwide command dashboard, live telemetry, trigger targeted surprise inspections.
3. **Field Inspection Officer:** Mobile-first field inspection PWA, GPS geofencing, real-time photographic & video evidence collection, SHA-256 hash anchoring.
4. **NGO / Institution Coordinator:** Facility compliance oversight, attendance logging, grievance & resolution submission.
5. **Auditor / Vigilance Unit:** Read-only compliance scorecards, audit trail analysis, tamper-proof reporting dossiers.

---

## 🏗️ Architecture & Technology Stack
- **Backend:** Python 3.11+, Flask REST API, Flask-SQLAlchemy, SQLite (dev) / PostgreSQL (target), Flask-JWT-Extended, Marshmallow, Scikit-Learn, Pandas, NumPy, Pillow.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **AI/ML & Vision Engine:**
  - Computer Vision for headcount / crowd estimation in CCTV feeds.
  - Facial verification / biometric variance detection for attendance.
  - Multi-factor risk engine (70% deterministic indicators + 30% unpredictable pseudo-random rotation).
  - Unsupervised anomaly detection (Isolation Forest & heuristic rule engines).
- **Security & Integrity:** SHA-256 evidence hashing, EXIF metadata extraction, timestamp & coordinates watermarking, role-based access control (RBAC).

---

## 📊 Current Codebase State
- **Backend:** Core Flask app initialized with 12 modular route blueprints (`auth`, `dashboard`, `projects`, `monitoring`, `inspections`, `assignments`, `evidence`, `analytics`, `alerts`, `users`, `audit`, `reports`). SQLite seed script with 30 projects, 62 simulated cameras, and 450 attendance logs.
- **Frontend:** 17 fully designed and connected views including Command Center, CCTV Matrix, WebRTC call terminal, Mobile Inspector PWA, Surprise Inspection Generator, and Anomaly Dashboard.
- **Status:** Functional UI and mock REST API ready. Needs deep AI/ML model integration (live vision, face recognition, dynamic crowd detection), live streaming verification, and end-to-end SIH presentation demo scenarios.

---

## 🎯 Active Milestone: Milestone 1 — AI/ML Vision Pipelines & SIH Jury Polish
Transforming mock/simulated vision and anomaly endpoints into actionable computer vision pipelines with live camera feed inference, facial match verification, automated anomaly alerts, and a polished SIH jury demo showcase.
