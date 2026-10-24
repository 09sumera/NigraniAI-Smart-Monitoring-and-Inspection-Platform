# Roadmap: NigraniAI (Milestone 1 — AI/ML Vision & SIH Demo Showcase)

## 🗺️ Phases Overview

- **Phase 1: API Contract Alignment, Metadata Persistence & Test Foundation**
  - **Goal:** Heal pre-existing frontend-backend contract mismatches, introduce non-destructive detection metadata schema, and set up automated test framework (`pytest`).
  - **Deliverables:**
    - New `GET /api/analytics/anomalies` endpoint matching `AIRiskAnalyticsPage.tsx`.
    - New `GET /api/analytics/attendance` endpoint matching `AttendanceAnalyticsPage.tsx` (preserving `/api/monitoring/attendance`).
    - Response key alignment in `GET /api/analytics/risk` (`projects` + `high_risk_projects`).
    - `CVDetectionRecord` SQLAlchemy model & non-destructive SQLite table creation script.
    - Automated API contract & persistence tests (`backend/tests/test_api_contracts.py`).

- **Phase 2: Lightweight Computer Vision Engine & Benchmark Evaluation**
  - **Goal:** Integrate `opencv-python-headless`, evaluate model options with permissive licenses, measure CPU latency, provide privacy-safe sample images, and build the detection API.
  - **Deliverables:**
    - Model evaluation document assessing footprint, licensing (Apache/MIT/BSD), and accuracy.
    - Pre-trained lightweight model weights & synthetic/non-PII benchmark sample images.
    - Backend `vision_service.py` supporting decoupled person counting and face counting.
    - `POST /api/analytics/cv/count` API endpoint with measured latency logging.
    - Automated CV unit tests (`backend/tests/test_vision.py`).

- **Phase 3: Facial Attendance Reconciliation & Ghost Beneficiary Alerts**
  - **Goal:** Connect face detection counts with muster roll records to flag ghost beneficiaries and trigger high-severity alerts.
  - **Deliverables:**
    - Attendance discrepancy calculator (`expected_staff` / `enrolled_beneficiaries` vs `detected_faces`).
    - Automated `Alert` escalation service on variance > threshold.
    - Updates to `/attendance` analytics view linking live detections to discrepancy logs.

- **Phase 4: Frontend Live CV Test Terminal & Camera Overlay**
  - **Goal:** Build an interactive, resilient camera & sample-image testing modal in the frontend with bounding box overlays.
  - **Deliverables:**
    - `LiveCVTestModal.tsx` supporting HTML5 `getUserMedia` browser webcam feed.
    - Clear permission denial / error handling states with instant fallback to privacy-safe sample images.
    - Dynamic HTML5 canvas drawing bounding boxes, confidence tags, and detected counts.
    - Integration into `/cctv` and `/live-monitoring` pages.

- **Phase 5: ML Anomaly Model Hardening & Surprise Audit Engine Link**
  - **Goal:** Strengthen Scikit-Learn Isolation Forest pipeline and link real-time anomaly scores directly into the surprise inspection selection algorithm.
  - **Deliverables:**
    - Refactored `anomaly_engine.py` using Scikit-Learn Isolation Forest.
    - Dynamic anomaly score injection into `InspectionEngine` (70% deterministic + 30% random rotation).
    - Anomaly matrix telemetry view in `/ai-analytics`.

- **Phase 6: SIH Jury Presentation Mode & End-to-End Demo Polish**
  - **Goal:** Deliver a flawless 1-click demonstration experience tailored for hackathon jury evaluation.
  - **Deliverables:**
    - Floating `DemoControlBar.tsx` with 4 pre-canned inspection scenarios:
      1. *Compliant Center (Standard cycle, low risk)*
      2. *Ghost Beneficiary Discrepancy (Flagged attendance variance)*
      3. *Live Webcam / Sample AI Scan (Instant bounding boxes & count)*
      4. *Surprise Audit Trigger (Real-time weighted dispatch)*
    - Comprehensive jury demo script & walkthrough documentation.
    - End-to-end smoke verification across all 17 views.

---

## 📈 Phase Execution Details

### Phase 1: API Contract Alignment, Metadata Persistence & Test Foundation
- **Tasks:**
  1. Audit schema requirements of `AIRiskAnalyticsPage.tsx` and `AttendanceAnalyticsPage.tsx`.
  2. Implement `GET /api/analytics/anomalies` in `backend/app/routes/analytics.py` returning `{ anomalies: [...] }`.
  3. Implement `GET /api/analytics/attendance` in `backend/app/routes/analytics.py` returning `{ trend: [...], anomalous_records: [...], total_records: int, anomaly_rate: float }`, keeping `monitoring.py` intact.
  4. Alias `projects` alongside `high_risk_projects` in `GET /api/analytics/risk`.
  5. Define `CVDetectionRecord` model in `backend/app/models/` without modifying existing model tables.
  6. Execute non-destructive table creation verifying `nigraniai.db` preserves existing 30 projects and 450 attendance records.
  7. Write and run contract tests in `backend/tests/test_api_contracts.py`.

### Phase 2: Lightweight Computer Vision Engine & Benchmark Evaluation
- **Tasks:**
  1. Add `opencv-python-headless` to `backend/requirements.txt`.
  2. Evaluate candidate lightweight CPU models (e.g. MobileNet-SSD Caffe/ONNX vs YOLO-nano ONNX), verifying permissive licensing (BSD/MIT/Apache 2.0) and footprint (<30MB).
  3. Prepare bundled non-PII, synthetic/royalty-free sample images under `backend/app/static/samples/`.
  4. Implement `app/services/vision_service.py` with separate `detect_persons(image_bytes)` and `detect_faces(image_bytes)`.
  5. Empirically measure CPU inference duration and log measured baselines.
  6. Expose `POST /api/analytics/cv/count` endpoint returning counts, bounding boxes, confidence, and measured duration.
  7. Write automated tests with sample images in `backend/tests/test_vision.py`.

### Phase 3: Facial Attendance Reconciliation & Ghost Beneficiary Alerts
- **Tasks:**
  1. Implement attendance variance comparison logic in `app/services/attendance_service.py`.
  2. Automatically generate high-severity `Alert` instances when headcount discrepancy exceeds tolerance threshold.
  3. Persist scan results to `CVDetectionRecord` with `discrepancy_flag=True`.
  4. Connect with Attendance Analytics view to show visual comparison tags.

### Phase 4: Frontend Live CV Test Terminal & Camera Overlay
- **Tasks:**
  1. Create `LiveCVTestModal.tsx` in `frontend/src/components/`.
  2. Implement HTML5 `navigator.mediaDevices.getUserMedia` video stream capture with error boundaries.
  3. Add privacy-safe sample image selector as a 1-click fallback when camera is denied or unavailable.
  4. Implement HTML5 canvas rendering bounding box coordinates, label overlays, and headcount summary.
  5. Integrate modal launch buttons into `CCTVPage.tsx` and `LiveMonitoringPage.tsx`.

### Phase 5: ML Anomaly Model Hardening & Surprise Audit Engine Link
- **Tasks:**
  1. Build Scikit-Learn Isolation Forest pipeline on multi-dimensional telemetry (`app/services/anomaly_engine.py`).
  2. Inject anomaly scores into `app/services/inspection_engine.py` selection weight formula.
  3. Expose real-time hyperparameter adjustments and anomaly telemetry via API.
  4. Verify front-end synchronization on `/ai-analytics` and `/settings` pages.

### Phase 6: SIH Jury Presentation Mode & End-to-End Demo Polish
- **Tasks:**
  1. Build floating `DemoControlBar.tsx` with instant 1-click triggers for the 4 primary jury scenarios.
  2. Add system health / AI model status pill to command center header.
  3. Produce a step-by-step SIH Presentation Walkthrough guide (`docs/SIH_DEMO_WALKTHROUGH.md`).
  4. Run complete end-to-end regression and verification pass across all 17 application pages.
