# Roadmap: NigraniAI

## 🏆 Milestone 1: AI/ML Vision Pipelines & SIH Jury Demo Showcase

### 🗺️ Phases Overview
- **Phase 1: Computer Vision Engine & Headcount Detection API**
  - Goal: Implement real CV person detection, crowd estimation, and bounding-box coordinates API.
  - Deliverables: OpenCV/YOLO inference service in backend, `/api/analytics/cv/count` endpoint, live unit tests.

- **Phase 2: Facial Attendance Reconciliation & Ghost Beneficiary Alerts**
  - Goal: Face detection on muster roll / inspection media, attendance variance calculation, automated anomaly alert dispatch.
  - Deliverables: Face counting service, automated alert triggering logic on variance > threshold, attendance analytics integration.

- **Phase 3: Interactive Frontend CV Test Terminal & Camera Overlay**
  - Goal: Enable live webcam and file upload testing directly within CCTV and Live Monitoring views.
  - Deliverables: React camera/upload canvas overlay with bounding boxes, real-time count HUD, direct reconciliation display.

- **Phase 4: ML Anomaly Model Hardening & Surprise Audit Engine Link**
  - Goal: Train Scikit-Learn Isolation Forest pipeline on institute performance telemetry and link live anomaly output to the 70/30 surprise audit scheduler.
  - Deliverables: Isolation Forest model service, anomaly matrix endpoint, UI hyperparameter tuning sync.

- **Phase 5: SIH Presentation Mode, Guided Scenarios & Demo Polish**
  - Goal: Deliver a flawless, 1-click jury evaluation experience with pre-canned live scenarios and walkthrough guide.
  - Deliverables: Demo floating toolbar / Scenario Selector, automated demo seeders, jury presentation script, system health banner.

---

## 📈 Phase Execution Details

### Phase 1: Computer Vision Engine & Headcount Detection API
- **Focus:** Backend CV Service
- **Tasks:**
  1. Add OpenCV / lightweight CV dependencies to backend environment.
  2. Implement `app/services/vision_service.py` with `detect_persons(image_bytes)` method.
  3. Create blueprint endpoint `POST /api/analytics/cv/count` supporting image upload or base64 frames.
  4. Unit test inference with sample images.

### Phase 2: Facial Attendance Reconciliation & Ghost Beneficiary Alerts
- **Focus:** Attendance Verification & Alerts
- **Tasks:**
  1. Implement `detect_faces(image_bytes)` in `vision_service.py`.
  2. Implement `reconcile_attendance(project_id, detected_count)` comparing registered roster vs detected count.
  3. Create alert generation trigger when difference exceeds tolerance limit.
  4. Connect with frontend Attendance view (`/attendance`).

### Phase 3: Interactive Frontend CV Test Terminal & Camera Overlay
- **Focus:** Frontend Visuals & Real-Time Feedback
- **Tasks:**
  1. Build `LiveCVTestModal.tsx` supporting webcam feed or test image upload.
  2. Render HTML5 canvas overlay with bounding boxes, confidence tags, and headcount summary.
  3. Embed test trigger into `/cctv` and `/live-monitoring` pages.
  4. Verify latency and responsive layout.

### Phase 4: ML Anomaly Model Hardening & Surprise Audit Engine Link
- **Focus:** ML Analytics & Scheduling Engine
- **Tasks:**
  1. Hardcode or train Isolation Forest feature vector pipeline (`app/services/anomaly_engine.py`).
  2. Connect anomaly score output directly to `app/services/inspection_engine.py` (multi-factor selection).
  3. Expose real-time vulnerability metrics in `/ai-analytics`.
  4. Allow instant recalculation via API.

### Phase 5: SIH Presentation Mode, Guided Scenarios & Demo Polish
- **Focus:** Final Polish & Demo Flow
- **Tasks:**
  1. Create `DemoControlBar.tsx` accessible in header/floating corner.
  2. Implement 4 instant scenario triggers (Normal, Ghost Beneficiary, Live Webcam Test, Surprise Dispatch).
  3. Create comprehensive SIH Presentation Dossier / Walkthrough documentation.
  4. End-to-end verification of all 17 views.
