# Project State: NigraniAI

## 📍 Current Status
- **Active Milestone:** Milestone 1 — AI/ML Vision Pipelines & SIH Jury Demo Showcase
- **Current Phase:** Phase 1: API Contract Alignment, Metadata Persistence & Test Foundation
- **Phase Status:** Pending User Approval Before Planning (`/gsd-plan-phase 1`)
- **Last Updated:** 2026-10-24

---

## 🧭 Milestone Progress Overview
| Phase | Title | Status | Completion |
|-------|-------|--------|------------|
| Phase 1 | API Contract Alignment, Metadata Persistence & Test Foundation | 🟡 Awaiting User Approval | 0% |
| Phase 2 | Lightweight Computer Vision Engine & Benchmark Evaluation | ⚪ Backlog | 0% |
| Phase 3 | Facial Attendance Reconciliation & Ghost Beneficiary Alerts | ⚪ Backlog | 0% |
| Phase 4 | Frontend Live CV Test Terminal & Camera Overlay | ⚪ Backlog | 0% |
| Phase 5 | ML Anomaly Model Hardening & Surprise Audit Engine Link | ⚪ Backlog | 0% |
| Phase 6 | SIH Jury Presentation Mode & End-to-End Demo Polish | ⚪ Backlog | 0% |

---

## 🔑 Key Architectural Decisions Log
1. **Repository Initialized:** Initialized local Git repository with strict `.gitignore` ignoring virtualenv, node_modules, and SQLite databases.
2. **API Contract Healing First (Phase 1):** Addressed 3 pre-existing frontend-backend contract mismatches (`/analytics/anomalies`, `/analytics/attendance`, and `projects` key) before adding new CV features.
3. **Dedicated Metadata Persistence:** Adopted a dedicated `CVDetectionRecord` model instead of altering existing tables, preserving 100% backward compatibility with existing rows in `nigraniai.db`.
4. **Lightweight CV & Measured Latency:** Committed to `opencv-python-headless` and a permissively licensed lightweight CPU model (MobileNet-SSD / ONNX); removed speculative speed claims until measured on host CPU. Decoupled face detection from biometric identity verification.
5. **Demo Resilience & Privacy:** Standardized on dual-mode testing (HTML5 browser webcam + privacy-safe non-PII synthetic sample images) with explicit permission error handling.

---

## ⏭️ Next Step
Awaiting user review and approval of updated planning documents before running `/gsd-plan-phase 1`.
