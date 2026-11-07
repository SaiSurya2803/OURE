"""
Revaluation and Updated Results Intelligence Engine for OU Results Intelligence.
Performs student-level and subject-level matching between Original and Revaluation exams,
detects status transitions, marks/grade point differentials, and backlog clearances.
"""

from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from backend.database import (
    ExamModel, StudentModel, ResultModel, SubjectMarksModel, RevaluationComparisonModel
)
from backend.ou_metadata import OU_GRADE_POINTS


def run_revaluation_comparison(
    db: Session,
    original_exam_id: int,
    revaluation_exam_id: int
) -> Dict[str, Any]:
    """
    Executes a comprehensive comparison between an original examination and its revaluation/revised run.
    """
    orig_exam = db.query(ExamModel).filter(ExamModel.id == original_exam_id).first()
    reval_exam = db.query(ExamModel).filter(ExamModel.id == revaluation_exam_id).first()

    if not orig_exam or not reval_exam:
        return {"error": "One or both examinations not found"}

    # Fetch results
    orig_results = db.query(ResultModel).filter(ResultModel.exam_id == original_exam_id).all()
    reval_results = db.query(ResultModel).filter(ResultModel.exam_id == revaluation_exam_id).all()

    # Index original results by hall_ticket
    orig_by_ht: Dict[str, ResultModel] = {r.hall_ticket: r for r in orig_results}

    # Clean existing comparison records for this pair
    db.query(RevaluationComparisonModel).filter(
        RevaluationComparisonModel.original_exam_id == original_exam_id,
        RevaluationComparisonModel.revaluation_exam_id == revaluation_exam_id
    ).delete()

    student_diffs = []
    subject_agg: Dict[str, Dict[str, Any]] = {}
    branch_agg: Dict[str, Dict[str, Any]] = {}

    total_improved_students = 0
    total_decreased_students = 0
    total_unchanged_students = 0
    total_fail_to_pass = 0
    total_pass_to_fail = 0

    for rv_res in reval_results:
        htno = rv_res.hall_ticket
        student = db.query(StudentModel).filter(StudentModel.id == rv_res.student_id).first()
        student_name = student.name if student else "Candidate"
        branch_name = student.branch_name if student else "Unknown"
        branch_code = student.branch_code if student else "Unknown"

        orig_res = orig_by_ht.get(htno)
        
        # If student not in original scan, still analyze their revaluation grades
        orig_subjects = {}
        if orig_res:
            orig_sm_list = db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == orig_res.id).all()
            orig_subjects = {sm.subject_code: sm for sm in orig_sm_list}

        reval_sm_list = db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == rv_res.id).all()
        
        student_improved = False
        student_decreased = False
        subject_comparisons = []

        for r_sm in reval_sm_list:
            code = r_sm.subject_code
            o_sm = orig_subjects.get(code)

            o_grade = o_sm.grade if o_sm else "-"
            r_grade = r_sm.grade
            o_pts = o_sm.grade_points if o_sm else 0.0
            r_pts = r_sm.grade_points

            o_status = o_sm.status if o_sm else "UNKNOWN"
            r_status = r_sm.status

            pts_diff = round(r_pts - o_pts, 2)
            backlog_cleared = False
            status_change = "UNCHANGED"

            if o_status in ["FAILED", "ABSENT"] and r_status == "PASSED":
                status_change = "FAILED_TO_PASSED"
                backlog_cleared = True
                student_improved = True
                total_fail_to_pass += 1
            elif o_status == "PASSED" and r_status in ["FAILED", "ABSENT"]:
                status_change = "PASSED_TO_FAILED"
                student_decreased = True
                total_pass_to_fail += 1
            elif pts_diff > 0:
                status_change = "GRADE_IMPROVED"
                student_improved = True
            elif pts_diff < 0:
                status_change = "GRADE_DECREASED"
                student_decreased = True
            else:
                status_change = "UNCHANGED"

            # Subject aggregation
            if code not in subject_agg:
                subject_agg[code] = {
                    "subject_code": code,
                    "subject_name": r_sm.subject_name,
                    "reval_appeared": 0,
                    "improved": 0,
                    "decreased": 0,
                    "unchanged": 0,
                    "backlogs_cleared": 0
                }
            s_agg = subject_agg[code]
            s_agg["reval_appeared"] += 1
            if backlog_cleared or status_change in ["GRADE_IMPROVED", "FAILED_TO_PASSED"]:
                s_agg["improved"] += 1
            elif status_change in ["GRADE_DECREASED", "PASSED_TO_FAILED"]:
                s_agg["decreased"] += 1
            else:
                s_agg["unchanged"] += 1

            if backlog_cleared:
                s_agg["backlogs_cleared"] += 1

            # Save DB comparison record
            comp_rec = RevaluationComparisonModel(
                original_exam_id=original_exam_id,
                revaluation_exam_id=revaluation_exam_id,
                student_id=rv_res.student_id,
                hall_ticket=htno,
                subject_code=code,
                subject_name=r_sm.subject_name,
                original_grade=o_grade,
                revaluation_grade=r_grade,
                grade_points_diff=pts_diff,
                status_change=status_change,
                backlog_cleared=backlog_cleared
            )
            db.add(comp_rec)

            subject_comparisons.append({
                "subject_code": code,
                "subject_name": r_sm.subject_name,
                "original_grade": o_grade,
                "revaluation_grade": r_grade,
                "points_difference": pts_diff,
                "status_change": status_change,
                "backlog_cleared": backlog_cleared
            })

        if student_improved:
            total_improved_students += 1
        elif student_decreased:
            total_decreased_students += 1
        else:
            total_unchanged_students += 1

        # Branch aggregation
        if branch_code not in branch_agg:
            branch_agg[branch_code] = {
                "branch_code": branch_code,
                "branch_name": branch_name,
                "total_appeared": 0,
                "improved": 0,
                "backlogs_cleared": 0
            }
        b_agg = branch_agg[branch_code]
        b_agg["total_appeared"] += 1
        if student_improved:
            b_agg["improved"] += 1
        if any(sc["backlog_cleared"] for sc in subject_comparisons):
            b_agg["backlogs_cleared"] += 1

        # SGPA diff
        o_sgpa = orig_res.sgpa if orig_res else None
        r_sgpa = rv_res.sgpa
        sgpa_diff = round(r_sgpa - o_sgpa, 2) if (r_sgpa is not None and o_sgpa is not None) else None

        student_diffs.append({
            "hall_ticket": htno,
            "student_name": student_name,
            "branch_name": branch_name,
            "original_sgpa": o_sgpa,
            "revaluation_sgpa": r_sgpa,
            "sgpa_diff": sgpa_diff,
            "original_status": orig_res.result_status if orig_res else "NOT_IN_ORIGINAL",
            "revaluation_status": rv_res.result_status,
            "student_overall_change": "IMPROVED" if student_improved else ("DECREASED" if student_decreased else "UNCHANGED"),
            "subjects": subject_comparisons
        })

    db.commit()

    total_candidates = len(reval_results)
    pass_pct_orig = orig_exam.pass_percentage
    pass_pct_reval = reval_exam.pass_percentage

    return {
        "original_exam": {
            "id": orig_exam.id,
            "title": orig_exam.title,
            "total_candidates": orig_exam.total_valid_results,
            "pass_percentage": pass_pct_orig
        },
        "revaluation_exam": {
            "id": reval_exam.id,
            "title": reval_exam.title,
            "total_candidates": reval_exam.total_valid_results,
            "pass_percentage": pass_pct_reval
        },
        "summary": {
            "total_revaluation_candidates": total_candidates,
            "improved_students": total_improved_students,
            "decreased_students": total_decreased_students,
            "unchanged_students": total_unchanged_students,
            "backlogs_cleared": total_fail_to_pass,
            "passed_to_failed": total_pass_to_fail,
            "improvement_rate_pct": round((total_improved_students / total_candidates * 100), 2) if total_candidates > 0 else 0.0,
            "pass_percentage_shift": round(pass_pct_reval - pass_pct_orig, 2)
        },
        "subject_breakdown": list(subject_agg.values()),
        "branch_breakdown": list(branch_agg.values()),
        "student_comparisons": student_diffs
    }
