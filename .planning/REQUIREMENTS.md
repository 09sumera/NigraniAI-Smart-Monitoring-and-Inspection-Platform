# Requirements: NigraniAI (Milestone 1)

## 📌 Milestone Objective
Establish operational AI/ML vision capabilities (crowd counting, face detection/attendance reconciliation, anomaly detection) integrated into the backend and frontend, and prepare an interactive, high-impact demonstration flow tailored for SIH evaluation.

---

## 📋 Functional Requirements (FR)

### FR-1: Computer Vision Headcount & Occupancy Analysis
- **FR-1.1:** Backend must provide an image/frame inference service that detects human bodies (`person`) and counts total detected individuals.
- **FR-1.2:** Endpoint `POST /api/analytics/cv/count` accepting an image (or CCTV snapshot) and returning: `detected_count`, `bounding_boxes` (x, y, w, h, confidence), and rendered annotated image or coordinates.
- **FR-1.3:** Frontend CCTV & Live Monitoring views must support a live interactive test mode (webcam or uploaded image) displaying bounding boxes and real-time count comparison against registered institute capacity.

### FR-2: Facial Attendance & Ghost Beneficiary Verification
- **FR-2.1:** Backend service to detect human faces from uploaded inspection photos or staff/student roll-call photos.
- **FR-2.2:** Compute attendance variance: `variance = registered_count - detected_faces`.
- **FR-2.3:** If variance exceeds configured threshold (e.g. > 20% absence without justification), automatically trigger high-severity alert: `Potential Ghost Beneficiary Discrepancy`.
- **FR-2.4:** Frontend Attendance Analytics view must display visual comparison with marked facial boxes and flagged variance metrics.

### FR-3: Machine Learning Anomaly & Surprise Inspection Risk Scoring
- **FR-3.1:** Train / run Isolation Forest model using Scikit-Learn on multi-dimensional institute metrics (`attendance_ratio`, `fund_utilization`, `complaint_count`, `days_since_last_inspection`).
- **FR-3.2:** Provide `/api/analytics/anomaly-matrix` returning anomaly anomaly scores (-1 anomaly, 1 normal) and vulnerability percentiles.
- **FR-3.3:** Surprise inspection engine must dynamically incorporate live anomaly scores into the 70/30 selection formula.

### FR-4: Tamper-Proof Evidence & Geofence Verification
- **FR-4.1:** Field officer mobile workspace photo capture must extract real-time EXIF timestamp and GPS coordinates.
- **FR-4.2:** Compute cryptographic SHA-256 hash of media immediately upon upload and verify GPS proximity within allowable radius (e.g. 200m) of institution coordinates.
- **FR-4.3:** Flag any upload with mismatched geofence or missing metadata as `Suspicious / Potential Geofence Bypass`.

### FR-5: SIH Jury Demo Flow & Quick-Demo Walkthrough
- **FR-5.1:** Add an interactive "Interactive Jury Demo / Live Simulation" tour or quick-action bar with one-click scenarios:
  - Scenario A: *Normal Compliant Center (Low risk, clean audit)*
  - Scenario B: *Suspected Ghost Beneficiary Center (Low headcount vs high registered roll -> Alert triggered)*
  - Scenario C: *Live Webcam AI Audit (Real-time count on jury's own faces/room)*
  - Scenario D: *Surprise Inspection Trigger & Instant Dispatch Notification*
- **FR-5.2:** Provide a clean status indicator showing active AI models, backend connection health, and database stats.

---

## 🔒 Non-Functional Requirements (NFR)
- **NFR-1 (Performance):** Computer vision inference on CPU must execute under 400ms per frame to feel instantaneous during live jury demonstrations.
- **NFR-2 (Fault Tolerance):** Graceful degradation: If camera access is blocked in browser, provide clear fallback test samples for all 17 pages.
- **NFR-3 (Data Integrity):** All inspection reports and evidence submissions must record immutable audit logs with ISO timestamps.
- **NFR-4 (Responsive UI):** Inspector workspace must remain 100% usable on mobile screen viewports (375px+).

---

## 🎯 Verification Criteria (Definition of Done)
1. `/api/analytics/cv/count` successfully detects persons and returns bounding box coordinates.
2. Attendance reconciliation flags discrepancies when detected count is significantly lower than roster.
3. CCTV / Live page includes interactive modal/tab to test image or webcam live with overlay boxes.
4. Anomaly score dynamically recalibrates when attendance or complaints are modified.
5. All 4 SIH Demo Scenarios can be triggered with one click during presentation.
