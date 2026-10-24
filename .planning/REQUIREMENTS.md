# Requirements: NigraniAI (Milestone 1 — AI/ML Vision & SIH Demo Showcase)

## 📌 Milestone Objective
Establish reliable, CPU-compatible computer vision capabilities (headcount detection, separate face detection for attendance reconciliation, anomaly scoring) integrated into the NigraniAI backend and frontend. Address pre-existing API contract gaps, design non-destructive metadata persistence, provide demo resilience (browser webcam + privacy-safe sample images), and establish automated test coverage.

---

## 📋 Functional Requirements (FR)

### FR-0: Existing API Contract Alignment & Healing (Pre-requisite)
- **FR-0.1 (Algorithmic Anomalies Endpoint):** Backend must provide `GET /api/analytics/anomalies` returning `{ anomalies: [...] }` to satisfy [`AIRiskAnalyticsPage.tsx`](file:///frontend/src/pages/AIRiskAnalyticsPage.tsx#L31), eliminating 404 console errors. Each anomaly item must include `project_id`, `project_name`, `anomaly_type`, `severity`, `confidence`, `description`, and `detected_at`.
- **FR-0.2 (Attendance Analytics Contract):** Backend must provide `GET /api/analytics/attendance` returning `{ trend: [...], anomalous_records: [...], total_records: int, anomaly_rate: float }` to satisfy [`AttendanceAnalyticsPage.tsx`](file:///frontend/src/pages/AttendanceAnalyticsPage.tsx#L30). The existing endpoint `GET /api/monitoring/attendance` must be preserved for backward compatibility.
- **FR-0.3 (Risk Analysis Response Keys):** Backend `GET /api/analytics/risk` must return both `projects` (for [`AIRiskAnalyticsPage.tsx`](file:///frontend/src/pages/AIRiskAnalyticsPage.tsx#L33)) and `high_risk_projects` (for existing consumers) ensuring non-breaking backward compatibility.

### FR-1: Lightweight Computer Vision Headcount & Occupancy Analysis
- **FR-1.1 (Model Selection & Licensing):** Use `opencv-python-headless` and a lightweight, permissive-licensed (e.g., Apache 2.0, MIT, BSD) pretrained CPU-compatible model (such as MobileNet-SSD or lightweight ONNX person-detector). Evaluate accuracy and licensing before finalizing. Avoid heavy PyTorch/CUDA runtime dependencies.
- **FR-1.2 (Headcount Detection Endpoint):** Backend endpoint `POST /api/analytics/cv/count` accepting an image (multipart upload or base64 data URL) and returning: `detected_count`, `bounding_boxes` (list of `[x, y, w, h]`), `confidence_scores`, `model_info`, and `processing_time_ms`.
- **FR-1.3 (Performance Measurement):** Do not claim speculative latency targets until empirically measured on host CPU. Record and log actual processing times in response headers/payload.

### FR-2: Decoupled Face Detection & Attendance Reconciliation
- **FR-2.1 (Decoupled Face Detection):** Provide face detection (e.g., OpenCV Haar cascade or YuNet) strictly for counting and localization of faces in attendance/muster roll photos. Face detection must remain strictly decoupled from biometric identity verification (no storage or comparison of identifiable biometric feature vectors).
- **FR-2.2 (Attendance Variance Reconciliation):** Compute variance against registered rosters: `discrepancy = expected_count - detected_count`.
- **FR-2.3 (Automated Discrepancy Escalation):** When discrepancy exceeds configured threshold (e.g. >20% unexplained variance), generate an automatic high-severity `Alert` flagged as `Potential Ghost Beneficiary Discrepancy`.
- **FR-2.4 (Attendance Visuals):** Integrate detection summaries into the Attendance Analytics dashboard view.

### FR-3: Detection Metadata Persistence
- **FR-3.1 (Non-Destructive Schema Design):** Introduce a dedicated `CVDetectionRecord` model (in `app/models/evidence.py` or new `app/models/cv_detection.py`) with fields:
  - `id` (Integer, Primary Key)
  - `project_id` (Integer, ForeignKey to `projects.id`, nullable)
  - `camera_id` (Integer, ForeignKey to `cameras.id`, nullable)
  - `evidence_id` (Integer, ForeignKey to `evidence.id`, nullable)
  - `source_type` (String: `'webcam'`, `'cctv_feed'`, `'sample_image'`, `'upload'`)
  - `detected_headcount` (Integer)
  - `detected_faces` (Integer)
  - `bounding_boxes` (JSON/Text serialized)
  - `confidence_scores` (JSON/Text serialized)
  - `processing_time_ms` (Float)
  - `discrepancy_flag` (Boolean, default False)
  - `created_at` (DateTime)
- **FR-3.2 (Database Preservation):** Use non-destructive schema migration/creation (`db.create_all()` or `CREATE TABLE IF NOT EXISTS`). Must not drop, truncate, or overwrite existing tables or rows in `nigraniai.db`.

### FR-4: Demo Resilience & Privacy Safeguards
- **FR-4.1 (Browser Webcam Mode):** Support live browser webcam streaming via HTML5 `navigator.mediaDevices.getUserMedia` with explicit camera permission handling and user-friendly error banners (e.g. `PermissionDeniedError`, `NotFoundError`).
- **FR-4.2 (Sample-Image Testing Mode):** Provide bundled, privacy-safe sample images (e.g., classroom, assembly hall, empty room) with zero personally identifiable information (PII) to allow instant testing even when camera access is unavailable.
- **FR-4.3 (Graceful Fallback):** When camera access fails or is denied, the frontend must automatically offer 1-click fallback to the privacy-safe sample image dataset without breaking or hanging the UI.

### FR-5: Machine Learning Anomaly & Surprise Inspection Integration
- **FR-5.1 (Isolation Forest Hardening):** Train/configure Scikit-Learn Isolation Forest on multi-dimensional project parameters (`attendance_ratio`, `fund_utilization`, `complaint_count`, `days_since_inspection`).
- **FR-5.2 (Surprise Engine Linking):** Integrate real-time anomaly scores directly into the multi-factor 70/30 selection formula in `app/services/inspection_engine.py`.

### FR-6: SIH Jury Presentation Flow
- **FR-6.1 (Interactive Demo Scenarios):** Provide a top-bar or floating demo panel allowing the jury/presenter to trigger 4 pre-canned inspection scenarios:
  1. *Compliant Institution (Standard inspection cycle, low risk)*
  2. *Ghost Beneficiary Alert (Low headcount vs inflated attendance)*
  3. *Live Webcam / Sample Image AI Test (Real-time detection with overlay)*
  4. *Surprise Audit Dispatch (Real-time weighted selection)*

---

## 🔒 Non-Functional & Security Requirements (NFR)
- **NFR-1 (Dependency Footprint):** Keep backend dependencies lightweight (`opencv-python-headless`). Reject multi-gigabyte frameworks (e.g. full PyTorch/CUDA) unless explicitly required by user.
- **NFR-2 (Privacy & Ethics):** Test datasets and sample images must not contain PII or identifiable private citizens. No biometric recognition templates are to be stored.
- **NFR-3 (Data Integrity & Backward Compatibility):** All existing database tables, columns, seeded projects (30), cameras (62), and attendance records (450) must remain intact.
- **NFR-4 (Security & Secrets Hygiene):** `.env`, database binaries (`*.db`, `*.sqlite`), and uploaded media must remain strictly excluded in `.gitignore`.

---

## 🧪 Testing Requirements
- **TR-1 (API Contract Tests):** Automated tests verifying status codes and JSON schema matching for:
  - `GET /api/analytics/anomalies`
  - `GET /api/analytics/attendance`
  - `GET /api/analytics/risk` (both `projects` and `high_risk_projects` keys)
- **TR-2 (Computer Vision Unit Tests):** Verify `POST /api/analytics/cv/count` on synthetic sample images returns valid bounding boxes and positive counts.
- **TR-3 (Persistence Tests):** Verify `CVDetectionRecord` creation, retrieval, and foreign key relationships with `Project` and `Camera`.
- **TR-4 (Frontend Integration Checks):** Verify webcam error handling, canvas bounding box rendering, and fallback to sample images without crashing.

---

## 🎯 Verification Criteria (Definition of Done)
1. All three contract mismatches (`/analytics/anomalies`, `/analytics/attendance`, `projects` key) are verified with passing automated tests.
2. `opencv-python-headless` runs person detection on CPU and records measured latency without crashing.
3. `CVDetectionRecord` table is created in SQLite without dropping or damaging existing tables.
4. Live webcam and sample-image test modes render bounding boxes with clear error handling.
5. Automated test suite runs clean with `pytest`.
