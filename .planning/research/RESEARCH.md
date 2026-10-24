# Research: AI/ML Vision Pipelines & SIH Inspection Architecture

## 1. Domain Background: MoSJE Monitoring Challenges
Institutions funded under DoSJE schemes (e.g., residential schools, de-addiction centers, old age homes) face major inspection challenges:
- **Ghost Beneficiaries / Inflated Rosters:** Registering more students or residents than physically present to claim excess grant-in-aid.
- **Predetermined / Leaked Inspections:** Advance warning allows institutions to temporarily arrange fake attendance or borrow equipment.
- **Evidence Tampering:** Re-using old inspection photos or spoofing location coordinates.
- **CCTV Feed Stagnation / Looping:** Static or pre-recorded video loops played to conceal empty premises.

---

## 2. Technical Evaluation: Computer Vision & AI Options

### A. Headcount / Occupancy & Crowd Estimation
- **Option 1: YOLOv8-nano / YOLOv11-nano (Ultralytics)**
  - *Pros:* Fast inference (15-30ms on CPU), detects `person` class with high accuracy, lightweight weights (~6MB), easy bounding box rendering and live counting.
  - *Cons:* Requires torch / ultralytics dependencies.
  - *Recommendation:* Ideal for local CPU inference in live demo or video processing endpoints.
- **Option 2: OpenCV Haar Cascades / HOG + Linear SVM**
  - *Pros:* Ultra-lightweight, zero additional heavy torch dependencies, runs anywhere.
  - *Cons:* Lower accuracy under varied angles and occlusion.
- **Option 3: Lightweight OpenCV MobileNet-SSD**
  - *Pros:* No PyTorch dependency required, uses `cv2.dnn.readNetFromCaffe`, fast on any laptop CPU.
  - *Recommendation:* Great fallback or primary option if user environment does not have CUDA/PyTorch preinstalled.

### B. Facial Verification / Attendance Matching
- **Option 1: FaceNet / dlib / DeepFace**
  - Provides Euclidean distance or cosine similarity on 128D/512D facial embedding vectors.
- **Option 2: OpenCV Face Detector (YuNet / Haar) + Histogram Comparison / Local Binary Patterns**
  - Instant zero-dependency face detection and basic verification matching.
- **Option 3: Hybrid Simulation with Real OpenCV Detection**
  - Real-time OpenCV face detection to extract faces from uploaded officer photos or CCTV snapshot, compute verification confidence scores, and flag mismatch against registered roster.

### C. Anomaly Scoring & Risk Engine
- **Isolation Forest (Scikit-Learn):**
  - Already in `requirements.txt` (`scikit-learn==1.5.0`).
  - Evaluates multidimensional features:
    1. Ratio of detected headcount vs registered capacity (`attendance_ratio`).
    2. Variance in daily meal counts vs occupancy.
    3. Days elapsed since last physical inspection.
    4. Grievance / complaint ticket count.
    5. Prior violation history score.
- **Heuristic Weighted Risk Engine:**
  - Deterministic 70% weight + 30% pseudo-random seed rotation with lock periods to prevent repeated audits on same compliant center.

---

## 3. SIH Demo & Jury Presentation Strategy
- **Interactive "Live Test Cam":** Allow the jury or presenter to enable their own webcam or upload an arbitrary test image/video and see the real-time AI headcount bounding boxes, attendance reconciliation, and anomaly alert trigger live on screen.
- **Surprise Audit Simulator:** Demonstrate the algorithm picking an institution based on real-time anomaly score spike, dispatching an inspector notification, and tracking geofenced verification.
- **Tamper-Proof Audit Trail:** Show cryptographic SHA-256 hash comparison between mobile upload and database record, proving immutability.
