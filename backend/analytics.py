"""
Complete Results Analytics Engine for OU Results Intelligence.
Calculates high-precision statistics, distributions, branch comparisons,
subject-wise metrics, and toppers leaderboards using actual collected database data.
"""

import math
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import ExamModel, StudentModel, ResultModel, SubjectMarksModel


def calculate_exam_analytics(
    db: Session,
    exam_id: int,
    branch_filter: Optional[str] = None,
    semester_filter: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes complete statistical breakdown for an examination.
    """
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        return {"error": "Examination not found"}

    # Base query
    query = db.query(ResultModel, StudentModel).join(StudentModel, ResultModel.student_id == StudentModel.id).filter(ResultModel.exam_id == exam_id)

    if branch_filter and branch_filter != "ALL":
        query = query.filter(StudentModel.branch_code == branch_filter)
    if semester_filter and semester_filter != "ALL":
        query = query.filter(ResultModel.semester == semester_filter)
    if status_filter and status_filter != "ALL":
        query = query.filter(ResultModel.result_status == status_filter)

    records = query.all()
    total_valid = len(records)

    if total_valid == 0:
        return {
            "exam_id": exam.id,
            "exam_title": exam.title,
            "total_students": 0,
            "passed": 0,
            "failed": 0,
            "promoted": 0,
            "pass_percentage": 0.0,
            "zero_backlogs_count": 0,
            "zero_backlogs_pct": 0.0,
            "sgpa_stats": {
                "average": 0.0,
                "highest": 0.0,
                "lowest": 0.0,
                "median": 0.0,
                "std_dev": 0.0
            },
            "backlog_breakdown": {"0": 0, "1": 0, "2": 0, "3+": 0},
            "branch_performance": [],
            "subject_analytics": [],
            "grade_distribution": {},
            "toppers": {
                "top10": [],
                "top20": [],
                "top50": []
            }
        }

    # Pass / Fail counts
    passed_count = sum(1 for r, _ in records if r.result_status == "PASSED")
    promoted_count = sum(1 for r, _ in records if r.result_status in ["PROMOTED", "ALREADY PROMOTED"])
    failed_count = sum(1 for r, _ in records if r.result_status in ["FAILED", "DETAINED"])
    pass_pct = round((passed_count / total_valid) * 100, 2)

    # Backlog counts
    zero_backlogs = sum(1 for r, _ in records if r.backlog_count == 0)
    zero_backlogs_pct = round((zero_backlogs / total_valid) * 100, 2)
    one_backlog = sum(1 for r, _ in records if r.backlog_count == 1)
    two_backlogs = sum(1 for r, _ in records if r.backlog_count == 2)
    three_plus = sum(1 for r, _ in records if r.backlog_count >= 3)

    # SGPA statistics
    sgpas = [r.sgpa for r, _ in records if r.sgpa is not None and r.sgpa > 0]
    if sgpas:
        sgpas_sorted = sorted(sgpas)
        n = len(sgpas)
        avg_sgpa = round(sum(sgpas) / n, 2)
        highest_sgpa = round(max(sgpas), 2)
        lowest_sgpa = round(min(sgpas), 2)
        median_sgpa = round(sgpas_sorted[n // 2] if n % 2 != 0 else (sgpas_sorted[n // 2 - 1] + sgpas_sorted[n // 2]) / 2, 2)
        
        # Standard Deviation
        variance = sum((x - avg_sgpa) ** 2 for x in sgpas) / n
        std_dev = round(math.sqrt(variance), 2)
    else:
        avg_sgpa = highest_sgpa = lowest_sgpa = median_sgpa = std_dev = 0.0

    # Branch-wise analytics
    branch_map: Dict[str, Dict[str, Any]] = {}
    for r, s in records:
        bcode = s.branch_code or "Unknown"
        bname = s.branch_name or f"Branch ({bcode})"
        if bcode not in branch_map:
            branch_map[bcode] = {
                "branch_code": bcode,
                "branch_name": bname,
                "total": 0,
                "passed": 0,
                "promoted": 0,
                "failed": 0,
                "sgpas": []
            }
        b = branch_map[bcode]
        b["total"] += 1
        if r.result_status == "PASSED":
            b["passed"] += 1
        elif r.result_status in ["PROMOTED", "ALREADY PROMOTED"]:
            b["promoted"] += 1
        else:
            b["failed"] += 1
        if r.sgpa:
            b["sgpas"].append(r.sgpa)

    branch_performance = []
    for bcode, data in branch_map.items():
        tot = data["total"]
        pct = round((data["passed"] / tot) * 100, 2) if tot > 0 else 0.0
        avg_s = round(sum(data["sgpas"]) / len(data["sgpas"]), 2) if data["sgpas"] else 0.0
        branch_performance.append({
            "branch_code": bcode,
            "branch_name": data["branch_name"],
            "total": tot,
            "passed": data["passed"],
            "promoted": data["promoted"],
            "failed": data["failed"],
            "pass_percentage": pct,
            "average_sgpa": avg_s
        })
    branch_performance.sort(key=lambda x: x["pass_percentage"], reverse=True)

    # Subject-wise analytics & Grade distributions
    subjects_query = db.query(SubjectMarksModel).filter(SubjectMarksModel.exam_id == exam_id).all()
    subject_map: Dict[str, Dict[str, Any]] = {}
    global_grade_dist: Dict[str, int] = {
        "O": 0, "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0, "Ab": 0
    }

    for sm in subjects_query:
        code = sm.subject_code
        g = sm.grade.upper()
        if g in global_grade_dist:
            global_grade_dist[g] += 1
        elif g in ["AB", "ABSENT"]:
            global_grade_dist["Ab"] += 1

        if code not in subject_map:
            subject_map[code] = {
                "subject_code": code,
                "subject_name": sm.subject_name,
                "credits": sm.credits,
                "appeared": 0,
                "passed": 0,
                "failed": 0,
                "absent": 0,
                "grades": {"O": 0, "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0, "Ab": 0}
            }
        s_data = subject_map[code]
        s_data["appeared"] += 1
        if sm.status == "PASSED":
            s_data["passed"] += 1
        elif sm.status == "ABSENT":
            s_data["absent"] += 1
            s_data["failed"] += 1
        else:
            s_data["failed"] += 1

        if g in s_data["grades"]:
            s_data["grades"][g] += 1
        elif g in ["AB", "ABSENT"]:
            s_data["grades"]["Ab"] += 1

    subject_analytics = []
    for code, data in subject_map.items():
        app = data["appeared"]
        pct = round((data["passed"] / app) * 100, 2) if app > 0 else 0.0
        subject_analytics.append({
            "subject_code": code,
            "subject_name": data["subject_name"],
            "credits": data["credits"],
            "total_appeared": app,
            "passed": data["passed"],
            "failed": data["failed"],
            "pass_percentage": pct,
            "grades": data["grades"]
        })
    subject_analytics.sort(key=lambda x: x["pass_percentage"], reverse=True)

    # Toppers calculation
    topper_candidates = []
    for r, s in records:
        topper_candidates.append({
            "hall_ticket": s.hall_ticket,
            "student_name": s.name or "Student",
            "father_name": s.father_name or "",
            "branch_code": s.branch_code,
            "branch_name": s.branch_name,
            "college_name": s.college_name,
            "sgpa": r.sgpa or 0.0,
            "cgpa": r.cgpa,
            "total_credits": r.total_credits,
            "backlog_count": r.backlog_count,
            "result_status": r.result_status
        })

    # Sort primarily by SGPA desc, zero backlogs first, total credits desc
    topper_candidates.sort(
        key=lambda x: (x["backlog_count"] == 0, x["sgpa"], x["total_credits"]),
        reverse=True
    )

    ranked_toppers = []
    for rank, cand in enumerate(topper_candidates, 1):
        cand_copy = dict(cand)
        cand_copy["rank"] = rank
        ranked_toppers.append(cand_copy)

    return {
        "exam_id": exam.id,
        "exam_title": exam.title,
        "exam_date": exam.exam_date_str,
        "regulation": exam.regulation,
        "exam_type": exam.exam_type,
        "total_students": total_valid,
        "passed": passed_count,
        "promoted": promoted_count,
        "failed": failed_count,
        "pass_percentage": pass_pct,
        "zero_backlogs_count": zero_backlogs,
        "zero_backlogs_pct": zero_backlogs_pct,
        "backlog_breakdown": {
            "0": zero_backlogs,
            "1": one_backlog,
            "2": two_backlogs,
            "3+": three_plus
        },
        "sgpa_stats": {
            "average": avg_sgpa,
            "highest": highest_sgpa,
            "lowest": lowest_sgpa,
            "median": median_sgpa,
            "std_dev": std_dev
        },
        "branch_performance": branch_performance,
        "subject_analytics": subject_analytics,
        "grade_distribution": global_grade_dist,
        "toppers": {
            "top10": ranked_toppers[:10],
            "top20": ranked_toppers[:20],
            "top50": ranked_toppers[:50]
        }
    }
