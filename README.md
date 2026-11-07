# OURE — OU RESULTS INTELLIGENCE
### Automated Osmania University Examination Results & Analytics Platform

**OU Results Intelligence** is a production-ready, full-stack web application designed specifically to automate Osmania University (OU) engineering result analysis.

Simply paste an official Osmania University examination results URL (e.g. `https://www.osmania.ac.in/res07/20260921.jsp`), and the platform will automatically:
1. **Inspect** the official result webpage and form structure.
2. **Discover** college codes, branches, batches, and candidate hall ticket patterns.
3. **Collect** student results in controlled, rate-limited asynchronous batches.
4. **Normalize & Store** student records and subject-level marks into the database.
5. **Compute Analytics** (Pass percentages, SGPA statistics, branch comparisons, grade distributions, toppers leaderboards).
6. **Diff Revaluation** runs to track grade improvements and backlog clearances.
7. **Generate Reports** in multi-sheet Excel (.xlsx), CSV, and executive ReportLab PDF formats.

---

## Architecture Overview

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend API**: Python FastAPI, BeautifulSoup4, httpx, Pydantic v2.
- **Extraction Engine**: Modular Adapter Architecture (`OUCBCSStandardAdapter`, `OUNonCBCSAdapter`).
- **Database**: SQLite with WAL mode & Foreign Keys (plug-and-play PostgreSQL / Supabase via `DATABASE_URL`).
- **Background Worker**: Multi-threaded asynchronous Scan Engine with Pause, Resume, Cancel, and Retry support.
- **Export Generators**: `openpyxl` for formatted Excel workbooks and `reportlab` for executive PDF dossiers with analytical disclaimers.

---

## 12 Dedicated Pages

1. **Landing Page (`/`)**: Hero, feature overview, quick URL analyzer bar, and pipeline overview.
2. **Dashboard (`/dashboard`)**: KPI metric counters, active scans, recent examinations, quick action shortcuts.
3. **Analyze Results (`/analyze`)**: Core entrypoint — paste official OU URL, review live inspection report, configure candidate matrix, and launch scan.
4. **Scan Monitor (`/scans` & `/scans/[id]`)**: Real-time progress bar, speed (items/sec), ETA countdown, and streaming color-coded terminal log.
5. **Results Explorer (`/results`)**: Searchable, filterable student data table with modal marks memo preview.
6. **Academic Analytics (`/analytics`)**: Interactive Recharts for branch pass rates, grade distributions, backlog breakdowns, and Top 10/20/50 merit rosters.
7. **Revaluation Intelligence (`/revaluation`)**: Student and subject-level matching between original and revised results, tracking marks improved and backlogs cleared.
8. **Student Database (`/students`)**: Directory of indexed engineering students across colleges and branches.
9. **Student Profile (`/students/[htno]`)**: Detailed candidate profile with SGPA progression graph, exam history, revaluation audit trail, and PDF memo download.
10. **Reports & Downloads (`/reports`)**: Download center for Excel workbooks, CSV datasets, and PDF dossiers.
11. **Examination History (`/examinations`)**: Central repository of all analyzed and archived examinations.
12. **Settings (`/settings`)**: Rate limiting controls, timeout adjustments, user-agent configuration, and adapter registry status.

---

## Running the Platform Locally

### 1. Start the Backend API (FastAPI)
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
API Documentation is available at: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend (Next.js)
```bash
cd frontend
npm run start
```
Frontend Web Application is accessible at: `http://localhost:3000`

---

## Verification & Automated Tests
To run the automated end-to-end integration test verifying live website inspection, candidate scanning, analytics calculation, revaluation diffing, and PDF/Excel generation:
```bash
python verify_system.py
```
