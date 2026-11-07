"""
OU Results Intelligence — Backend API Application.
High-performance FastAPI service powering automated Osmania University
examination inspection, collection, analytics, revaluation matching, and exports.
"""

import io
import os
import csv
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import (
    init_db, get_db, SessionLocal, ExamModel, StudentModel,
    ResultModel, SubjectMarksModel, ScanJobModel, RevaluationComparisonModel
)
from backend.ou_metadata import OU_COLLEGES, OU_BRANCHES, decode_hall_ticket
from backend.adapters import inspect_url, get_adapter_by_name
from backend.discovery import HallTicketDiscoveryEngine, DiscoveryConfig
from backend.scanner import scan_engine
from backend.analytics import calculate_exam_analytics
from backend.revaluation import run_revaluation_comparison
from backend.exports import (
    generate_excel_report, generate_analytics_pdf, generate_student_card_pdf
)

app = FastAPI(
    title="OU Results Intelligence API",
    version="1.0.0",
    description="Automated Osmania University Examination Results & Analytics Platform"
)

# CORS Configuration from Environment
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
def on_startup():
    init_db()


# --- Request & Response Models ---

class AnalyzeUrlRequest(BaseModel):
    url: str
    custom_html: Optional[str] = None


class StartScanRequest(BaseModel):
    url: str
    exam_title: Optional[str] = None
    exam_type: Optional[str] = "REGULAR"
    regulation: Optional[str] = "AICTE"
    exam_date_str: Optional[str] = None
    adapter_name: Optional[str] = "OUCBCSStandardAdapter"
    discovery_config: Optional[DiscoveryConfig] = None
    candidate_list: Optional[List[str]] = None


class RevaluationRequest(BaseModel):
    original_exam_id: int
    revaluation_exam_id: int


# --- API Endpoints ---

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "OU Results Intelligence",
        "timestamp": datetime.utcnow().isoformat(),
        "adapters_available": ["OUCBCSStandardAdapter", "OUNonCBCSAdapter"]
    }


@app.get("/api/metadata")
def get_metadata():
    return {
        "colleges": OU_COLLEGES,
        "branches": OU_BRANCHES
    }


@app.post("/api/analyze-url")
def analyze_url_endpoint(req: AnalyzeUrlRequest, db: Session = Depends(get_db)):
    """
    Step 1 Core Feature: Inspects the provided official OU URL,
    understands page structure, forms, and detects exam details and candidate patterns.
    """
    url = req.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URL protocol. Must start with http:// or https://")

    report = inspect_url(url, req.custom_html)

    # Check if an exam already exists with this exact URL
    existing_exam = db.query(ExamModel).filter(ExamModel.url == url).first()
    existing_id = existing_exam.id if existing_exam else None

    # Generate suggested candidates from discovered sample hall tickets on the page
    suggested_candidates = []
    if report.sample_halltickets_found:
        suggested_candidates = HallTicketDiscoveryEngine.auto_discover_from_samples(
            report.sample_halltickets_found,
            max_per_branch=10
        )
    else:
        # Fallback suggestion
        suggested_candidates = HallTicketDiscoveryEngine.auto_discover_from_samples(
            ["160324732301"], max_per_branch=5
        )

    return {
        "report": report.model_dump(),
        "existing_exam_id": existing_id,
        "suggested_candidates": suggested_candidates[:60],
        "suggested_count": len(suggested_candidates)
    }


@app.post("/api/scans/start")
def start_scan_endpoint(req: StartScanRequest, db: Session = Depends(get_db)):
    """
    Step 2 Core Feature: Registers examination and kicks off background scanning worker.
    """
    url = req.url.strip()
    
    # 1. Upsert or find ExamModel
    exam = db.query(ExamModel).filter(ExamModel.url == url).first()
    if not exam:
        exam = ExamModel(
            url=url,
            title=req.exam_title or "Osmania University Examination Result",
            exam_type=req.exam_type or "REGULAR",
            regulation=req.regulation or "AICTE",
            exam_date_str=req.exam_date_str,
            adapter_name=req.adapter_name or "OUCBCSStandardAdapter"
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
    else:
        if req.exam_title:
            exam.title = req.exam_title
        if req.exam_type:
            exam.exam_type = req.exam_type
        db.commit()

    # 2. Determine Candidate List
    candidates = []
    if req.candidate_list and len(req.candidate_list) > 0:
        candidates = req.candidate_list
    elif req.discovery_config:
        candidates = HallTicketDiscoveryEngine.generate_from_config(req.discovery_config)
    else:
        # Auto discover with defaults
        candidates = HallTicketDiscoveryEngine.auto_discover_from_samples(["160324732301"], max_per_branch=15)

    if not candidates:
        raise HTTPException(status_code=400, detail="No candidate hall tickets generated or supplied.")

    # 3. Create Scan Job
    job_id = scan_engine.create_scan_job(
        exam_id=exam.id,
        url=url,
        candidates=candidates,
        adapter_name=req.adapter_name or "OUCBCSStandardAdapter",
        config={
            "exam_title": exam.title,
            "exam_type": exam.exam_type
        }
    )

    return {
        "job_id": job_id,
        "exam_id": exam.id,
        "url": url,
        "total_candidates": len(candidates),
        "status": "QUEUED"
    }


@app.get("/api/scans")
def list_scans_endpoint():
    return scan_engine.list_jobs()


@app.get("/api/scans/{job_id}/status")
def get_scan_status_endpoint(job_id: str):
    status = scan_engine.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Scan job not found.")
    return status


@app.post("/api/scans/{job_id}/pause")
def pause_scan_endpoint(job_id: str):
    success = scan_engine.pause_scan(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to pause scan (job not running or not found).")
    return {"status": "PAUSED", "job_id": job_id}


@app.post("/api/scans/{job_id}/resume")
def resume_scan_endpoint(job_id: str):
    success = scan_engine.resume_scan(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to resume scan (job not paused or not found).")
    return {"status": "RUNNING", "job_id": job_id}


@app.post("/api/scans/{job_id}/cancel")
def cancel_scan_endpoint(job_id: str):
    success = scan_engine.cancel_scan(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to cancel scan.")
    return {"status": "CANCELLED", "job_id": job_id}


@app.post("/api/scans/{job_id}/retry")
def retry_scan_endpoint(job_id: str):
    new_job_id = scan_engine.retry_failed(job_id)
    if not new_job_id:
        raise HTTPException(status_code=400, detail="No failed records found to retry.")
    return {"new_job_id": new_job_id, "status": "QUEUED"}


@app.get("/api/examinations")
def list_examinations(db: Session = Depends(get_db)):
    exams = db.query(ExamModel).order_by(ExamModel.created_at.desc()).all()
    out = []
    for e in exams:
        out.append({
            "id": e.id,
            "title": e.title,
            "url": e.url,
            "exam_date_str": e.exam_date_str,
            "exam_type": e.exam_type,
            "regulation": e.regulation,
            "total_candidates": e.total_valid_results,
            "pass_percentage": e.pass_percentage,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return out


@app.get("/api/examinations/{exam_id}")
def get_exam_details(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")
    return {
        "id": exam.id,
        "title": exam.title,
        "url": exam.url,
        "exam_date_str": exam.exam_date_str,
        "exam_type": exam.exam_type,
        "regulation": exam.regulation,
        "total_candidates": exam.total_valid_results,
        "pass_percentage": exam.pass_percentage,
        "created_at": exam.created_at.isoformat() if exam.created_at else None
    }


@app.get("/api/examinations/{exam_id}/analytics")
def get_exam_analytics_endpoint(
    exam_id: int,
    branch: Optional[str] = Query("ALL"),
    semester: Optional[str] = Query("ALL"),
    status: Optional[str] = Query("ALL"),
    db: Session = Depends(get_db)
):
    stats = calculate_exam_analytics(
        db=db,
        exam_id=exam_id,
        branch_filter=branch,
        semester_filter=semester,
        status_filter=status
    )
    return stats


@app.get("/api/examinations/{exam_id}/results")
def get_exam_results_table(
    exam_id: int,
    search: Optional[str] = Query(""),
    branch: Optional[str] = Query("ALL"),
    status: Optional[str] = Query("ALL"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(ResultModel, StudentModel).join(StudentModel, ResultModel.student_id == StudentModel.id).filter(ResultModel.exam_id == exam_id)

    if branch and branch != "ALL":
        query = query.filter(StudentModel.branch_code == branch)
    if status and status != "ALL":
        query = query.filter(ResultModel.result_status == status)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (StudentModel.hall_ticket.ilike(search_term)) |
            (StudentModel.name.ilike(search_term))
        )

    total_count = query.count()
    offset = (page - 1) * limit
    records = query.order_by(ResultModel.sgpa.desc().nullslast()).offset(offset).limit(limit).all()

    items = []
    for r, s in records:
        # Get subjects for modal preview
        subjects = db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == r.id).all()
        items.append({
            "id": r.id,
            "hall_ticket": s.hall_ticket,
            "student_name": s.name,
            "father_name": s.father_name,
            "gender": s.gender,
            "college_code": s.college_code,
            "college_name": s.college_name,
            "branch_code": s.branch_code,
            "branch_name": s.branch_name,
            "semester": r.semester,
            "sgpa": r.sgpa,
            "cgpa": r.cgpa,
            "result_status": r.result_status,
            "total_credits": r.total_credits,
            "backlog_count": r.backlog_count,
            "subjects_count": len(subjects),
            "subjects": [
                {
                    "code": sm.subject_code,
                    "name": sm.subject_name,
                    "credits": sm.credits,
                    "grade": sm.grade,
                    "grade_points": sm.grade_points,
                    "status": sm.status
                }
                for sm in subjects
            ]
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
        "items": items
    }


@app.post("/api/revaluation/compare")
def compare_revaluation_endpoint(req: RevaluationRequest, db: Session = Depends(get_db)):
    """
    Revaluation & Updated Results Intelligence: Matches student results by
    hall ticket and subject code, computing difference matrices and backlog clearances.
    """
    diff_report = run_revaluation_comparison(
        db=db,
        original_exam_id=req.original_exam_id,
        revaluation_exam_id=req.revaluation_exam_id
    )
    return diff_report


@app.get("/api/students")
def list_students_endpoint(
    search: Optional[str] = Query(""),
    branch: Optional[str] = Query("ALL"),
    college: Optional[str] = Query("ALL"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(StudentModel)
    if branch and branch != "ALL":
        query = query.filter(StudentModel.branch_code == branch)
    if college and college != "ALL":
        query = query.filter(StudentModel.college_code == college)
    if search:
        st = f"%{search.strip()}%"
        query = query.filter(
            (StudentModel.hall_ticket.ilike(st)) |
            (StudentModel.name.ilike(st))
        )

    total = query.count()
    offset = (page - 1) * limit
    students = query.order_by(StudentModel.hall_ticket.asc()).offset(offset).limit(limit).all()

    items = []
    for s in students:
        # Count total exams appeared
        res_count = db.query(ResultModel).filter(ResultModel.student_id == s.id).count()
        latest_res = db.query(ResultModel).filter(ResultModel.student_id == s.id).order_by(ResultModel.id.desc()).first()
        items.append({
            "id": s.id,
            "hall_ticket": s.hall_ticket,
            "name": s.name,
            "father_name": s.father_name,
            "gender": s.gender,
            "college_code": s.college_code,
            "college_name": s.college_name,
            "branch_code": s.branch_code,
            "branch_name": s.branch_name,
            "batch_year": s.batch_year,
            "exams_count": res_count,
            "latest_sgpa": latest_res.sgpa if latest_res else None,
            "latest_status": latest_res.result_status if latest_res else "N/A"
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }


@app.get("/api/students/{hall_ticket}")
def get_student_profile(hall_ticket: str, db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.hall_ticket == hall_ticket).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student hall ticket not found in database.")

    results = db.query(ResultModel, ExamModel).join(ExamModel, ResultModel.exam_id == ExamModel.id).filter(ResultModel.student_id == student.id).order_by(ExamModel.id.asc()).all()

    history = []
    for r, exam in results:
        subjects = db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == r.id).all()
        history.append({
            "exam_id": exam.id,
            "exam_title": exam.title,
            "exam_date_str": exam.exam_date_str,
            "exam_type": exam.exam_type,
            "semester": r.semester,
            "sgpa": r.sgpa,
            "cgpa": r.cgpa,
            "result_status": r.result_status,
            "total_credits": r.total_credits,
            "backlog_count": r.backlog_count,
            "subjects": [
                {
                    "subject_code": sm.subject_code,
                    "subject_name": sm.subject_name,
                    "credits": sm.credits,
                    "grade": sm.grade,
                    "grade_points": sm.grade_points,
                    "status": sm.status
                }
                for sm in subjects
            ]
        })

    # Find any revaluation comparisons for this student
    revals = db.query(RevaluationComparisonModel).filter(RevaluationComparisonModel.hall_ticket == hall_ticket).all()
    reval_history = [
        {
            "subject_code": rv.subject_code,
            "subject_name": rv.subject_name,
            "original_grade": rv.original_grade,
            "revaluation_grade": rv.revaluation_grade,
            "points_difference": rv.grade_points_diff,
            "status_change": rv.status_change,
            "backlog_cleared": rv.backlog_cleared
        }
        for rv in revals
    ]

    return {
        "student": {
            "hall_ticket": student.hall_ticket,
            "name": student.name,
            "father_name": student.father_name,
            "gender": student.gender,
            "college_code": student.college_code,
            "college_name": student.college_name,
            "branch_code": student.branch_code,
            "branch_name": student.branch_name,
            "batch_year": student.batch_year,
            "course": student.course,
            "medium": student.medium
        },
        "academic_history": history,
        "revaluation_history": reval_history
    }


# --- Report & Download Routes ---

@app.get("/api/exports/excel/{exam_id}")
def export_excel_endpoint(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    analytics = calculate_exam_analytics(db, exam_id)
    records = db.query(ResultModel, StudentModel).join(StudentModel, ResultModel.student_id == StudentModel.id).filter(ResultModel.exam_id == exam_id).all()

    formatted_records = []
    for r, s in records:
        formatted_records.append({
            "hall_ticket": s.hall_ticket,
            "semester": r.semester,
            "sgpa": r.sgpa,
            "cgpa": r.cgpa,
            "result_status": r.result_status,
            "total_credits": r.total_credits,
            "backlog_count": r.backlog_count,
            "student": {
                "name": s.name,
                "father_name": s.father_name,
                "gender": s.gender,
                "college_code": s.college_code,
                "college_name": s.college_name,
                "branch_code": s.branch_code,
                "branch_name": s.branch_name
            }
        })

    excel_bytes = generate_excel_report(
        exam_info={"title": exam.title, "exam_date_str": exam.exam_date_str, "regulation": exam.regulation, "exam_type": exam.exam_type},
        analytics_data=analytics,
        results_records=formatted_records
    )

    filename = f"OU_Results_Intelligence_Exam_{exam_id}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/exports/csv/{exam_id}")
def export_csv_endpoint(exam_id: int, db: Session = Depends(get_db)):
    records = db.query(ResultModel, StudentModel).join(StudentModel, ResultModel.student_id == StudentModel.id).filter(ResultModel.exam_id == exam_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Hall Ticket", "Student Name", "Father's Name", "Gender",
        "College Code", "College Name", "Branch Code", "Branch Name",
        "Semester", "SGPA", "CGPA", "Result Status", "Credits", "Backlogs"
    ])

    for r, s in records:
        writer.writerow([
            s.hall_ticket, s.name, s.father_name, s.gender,
            s.college_code, s.college_name, s.branch_code, s.branch_name,
            r.semester, r.sgpa, r.cgpa, r.result_status, r.total_credits, r.backlog_count
        ])

    csv_data = output.getvalue()
    filename = f"OU_Results_{exam_id}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/exports/pdf/analytics/{exam_id}")
def export_analytics_pdf_endpoint(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    analytics = calculate_exam_analytics(db, exam_id)
    pdf_bytes = generate_analytics_pdf(
        exam_info={"title": exam.title, "exam_date_str": exam.exam_date_str, "regulation": exam.regulation, "exam_type": exam.exam_type},
        analytics_data=analytics
    )

    filename = f"OU_Analytics_Dossier_Exam_{exam_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/exports/pdf/student/{hall_ticket}")
def export_student_pdf_endpoint(hall_ticket: str, db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.hall_ticket == hall_ticket).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    results = db.query(ResultModel, ExamModel).join(ExamModel, ResultModel.exam_id == ExamModel.id).filter(ResultModel.student_id == student.id).all()

    formatted_results = []
    for r, exam in results:
        subjects = db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == r.id).all()
        formatted_results.append({
            "exam_title": exam.title,
            "semester": r.semester,
            "sgpa": r.sgpa,
            "cgpa": r.cgpa,
            "result_status": r.result_status,
            "total_credits": r.total_credits,
            "backlog_count": r.backlog_count,
            "subjects": [
                {
                    "subject_code": s.subject_code,
                    "subject_name": s.subject_name,
                    "credits": s.credits,
                    "grade": s.grade,
                    "grade_points": s.grade_points,
                    "status": s.status
                }
                for s in subjects
            ]
        })

    pdf_bytes = generate_student_card_pdf(
        student={
            "hall_ticket": student.hall_ticket,
            "name": student.name,
            "father_name": student.father_name,
            "gender": student.gender,
            "college_code": student.college_code,
            "college_name": student.college_name,
            "branch_code": student.branch_code,
            "branch_name": student.branch_name
        },
        results=formatted_results
    )

    filename = f"OU_Student_Report_{hall_ticket}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.post("/api/import/file")
async def import_file_endpoint(file: UploadFile = File(...)):
    """
    Fallback feature: Upload saved HTML, CSV, or Text file when live URL is blocked or offline.
    """
    content = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".html") or filename.endswith(".htm") or filename.endswith(".jsp"):
        text = content.decode("utf-8", errors="ignore")
        report = inspect_url("https://www.osmania.ac.in/custom-upload.jsp", custom_html=text)
        return {
            "type": "HTML_INSPECTION",
            "report": report.model_dump(),
            "detected_candidates": report.sample_halltickets_found
        }
    else:
        text = content.decode("utf-8", errors="ignore")
        candidates = HallTicketDiscoveryEngine.parse_imported_text(text)
        return {
            "type": "CANDIDATE_LIST",
            "total_discovered": len(candidates),
            "candidates": candidates[:100]
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)

