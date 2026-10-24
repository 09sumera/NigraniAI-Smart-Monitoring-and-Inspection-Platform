# Project State: NigraniAI

## 📍 Current Status
- **Active Milestone:** Milestone 1 — AI/ML Vision Pipelines & SIH Jury Demo Showcase
- **Current Phase:** Phase 1: Computer Vision Engine & Headcount Detection API
- **Phase Status:** Ready for Planning (`/gsd-plan-phase 1`)
- **Last Updated:** 2026-10-24

---

## 🧭 Milestone Progress Overview
| Phase | Title | Status | Completion |
|-------|-------|--------|------------|
| Phase 1 | Computer Vision Engine & Headcount Detection API | 🟡 Pending Planning | 0% |
| Phase 2 | Facial Attendance Reconciliation & Ghost Beneficiary Alerts | ⚪ Backlog | 0% |
| Phase 3 | Interactive Frontend CV Test Terminal & Camera Overlay | ⚪ Backlog | 0% |
| Phase 4 | ML Anomaly Model Hardening & Surprise Audit Engine Link | ⚪ Backlog | 0% |
| Phase 5 | SIH Presentation Mode, Guided Scenarios & Demo Polish | ⚪ Backlog | 0% |

---

## 🔑 Key Architectural Decisions Log
1. **Repository Initialized:** Initialized local Git repository with strict `.gitignore` ignoring virtualenv, node_modules, and SQLite databases.
2. **Vision Model Selection:** Adopted lightweight OpenCV CPU-optimized inference (MobileNet-SSD / Haar / YuNet) for fast local response times (<300ms) without needing heavy PyTorch/CUDA overhead on demo laptops.
3. **Ghost Beneficiary Algorithm:** Automated variance formula comparing physical visual headcount with registered institutional rosters, automatically escalating variance breaches to high-priority alerts.
4. **SIH Evaluation Alignment:** Prioritized interactive jury testing (webcam feed / upload tester + one-click demo scenario triggers) to maximize scoring under live presentation conditions.

---

## ⏭️ Next Recommended Step
Run `/gsd-plan-phase 1` to generate the detailed implementation plan and task breakdown for Phase 1.
