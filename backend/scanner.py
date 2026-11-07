"""
Asynchronous Background Scan Engine for OU Results Intelligence.
Supports:
- Concurrent worker processing with rate limiting
- Pause, Resume, Cancel, and Retry failed candidates
- Real-time logging, metrics (speed, ETA, progress %)
- Persistent database synchronization
"""

import time
import threading
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup
import httpx
from sqlalchemy.orm import Session

from backend.database import (
    SessionLocal, ExamModel, StudentModel, ResultModel,
    SubjectMarksModel, ScanJobModel, ScanLogModel
)
from backend.adapters import get_adapter_by_name
from backend.adapters.base import StudentExtractionResult


class ScanWorkerContext:
    def __init__(self, job_id: str, exam_id: int, url: str, candidates: List[str], adapter_name: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.exam_id = exam_id
        self.url = url
        self.candidates = candidates
        self.adapter_name = adapter_name
        self.config = config
        
        # State control
        self.pause_event = threading.Event()
        self.pause_event.set()  # set = running, clear = paused
        self.cancel_event = threading.Event()
        
        # Metrics
        self.total = len(candidates)
        self.processed = 0
        self.successful = 0
        self.failed = 0
        self.status = "QUEUED"  # QUEUED, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.speed: float = 0.0
        self.eta_seconds: int = 0
        self.failed_list: List[str] = []
        self.success_list: List[str] = []
        self.recent_logs: List[Dict[str, Any]] = []


class ScanEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ScanEngine, cls).__new__(cls)
                cls._instance._active_jobs = {}
            return cls._instance

    def _log(self, ctx: ScanWorkerContext, level: str, message: str, db: Optional[Session] = None):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message
        }
        ctx.recent_logs.append(entry)
        if len(ctx.recent_logs) > 500:
            ctx.recent_logs.pop(0)

        # Write to DB if session provided or new session
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
        try:
            log_model = ScanLogModel(
                job_id=ctx.job_id,
                level=level,
                message=message,
                timestamp=datetime.utcnow()
            )
            db.add(log_model)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            if should_close:
                db.close()

    def create_scan_job(
        self,
        exam_id: int,
        url: str,
        candidates: List[str],
        adapter_name: str = "OUCBCSStandardAdapter",
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        job_id = str(uuid.uuid4())
        ctx = ScanWorkerContext(
            job_id=job_id,
            exam_id=exam_id,
            url=url,
            candidates=candidates,
            adapter_name=adapter_name,
            config=config or {}
        )
        self._active_jobs[job_id] = ctx

        # Persist scan job in DB
        db = SessionLocal()
        try:
            job_model = ScanJobModel(
                id=job_id,
                exam_id=exam_id,
                url=url,
                status="QUEUED",
                total_candidates=len(candidates),
                processed_candidates=0,
                successful_results=0,
                failed_attempts=0,
                config_json=str(config)
            )
            db.add(job_model)
            db.commit()
            self._log(ctx, "INFO", f"Scan job queued with {len(candidates)} candidates.", db=db)
        finally:
            db.close()

        # Start worker thread
        thread = threading.Thread(target=self._run_worker, args=(ctx,), daemon=True)
        thread.start()

        return job_id

    def pause_scan(self, job_id: str) -> bool:
        ctx = self._active_jobs.get(job_id)
        if not ctx or ctx.status != "RUNNING":
            return False
        ctx.pause_event.clear()
        ctx.status = "PAUSED"
        self._sync_job_db(ctx)
        self._log(ctx, "WARNING", "Scan paused by user.")
        return True

    def resume_scan(self, job_id: str) -> bool:
        ctx = self._active_jobs.get(job_id)
        if not ctx or ctx.status != "PAUSED":
            return False
        ctx.pause_event.set()
        ctx.status = "RUNNING"
        self._sync_job_db(ctx)
        self._log(ctx, "INFO", "Scan resumed by user.")
        return True

    def cancel_scan(self, job_id: str) -> bool:
        ctx = self._active_jobs.get(job_id)
        if not ctx:
            return False
        ctx.cancel_event.set()
        ctx.pause_event.set()  # Unblock if currently paused
        ctx.status = "CANCELLED"
        self._sync_job_db(ctx)
        self._log(ctx, "ERROR", "Scan cancelled by user.")
        return True

    def retry_failed(self, job_id: str) -> Optional[str]:
        ctx = self._active_jobs.get(job_id)
        failed_hts = []
        if ctx:
            failed_hts = list(ctx.failed_list)
        else:
            # Query from DB
            db = SessionLocal()
            try:
                job_model = db.query(ScanJobModel).filter(ScanJobModel.id == job_id).first()
                if job_model:
                    pass
            finally:
                db.close()

        if not failed_hts:
            return None

        # Create new retry job
        return self.create_scan_job(
            exam_id=ctx.exam_id if ctx else 1,
            url=ctx.url if ctx else "",
            candidates=failed_hts,
            adapter_name=ctx.adapter_name if ctx else "OUCBCSStandardAdapter",
            config={"is_retry": True, "original_job_id": job_id}
        )

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        ctx = self._active_jobs.get(job_id)
        if ctx:
            pct = round((ctx.processed / ctx.total * 100), 1) if ctx.total > 0 else 0
            return {
                "id": ctx.job_id,
                "exam_id": ctx.exam_id,
                "url": ctx.url,
                "status": ctx.status,
                "total": ctx.total,
                "processed": ctx.processed,
                "successful": ctx.successful,
                "failed": ctx.failed,
                "pending": ctx.total - ctx.processed,
                "progress_percentage": pct,
                "speed_per_sec": round(ctx.speed, 2),
                "eta_seconds": ctx.eta_seconds,
                "recent_logs": ctx.recent_logs[-50:]
            }

        # Fallback to DB
        db = SessionLocal()
        try:
            job = db.query(ScanJobModel).filter(ScanJobModel.id == job_id).first()
            if not job:
                return None
            pct = round((job.processed_candidates / job.total_candidates * 100), 1) if job.total_candidates > 0 else 0
            logs = db.query(ScanLogModel).filter(ScanLogModel.job_id == job_id).order_by(ScanLogModel.id.asc()).limit(50).all()
            return {
                "id": job.id,
                "exam_id": job.exam_id,
                "url": job.url,
                "status": job.status,
                "total": job.total_candidates,
                "processed": job.processed_candidates,
                "successful": job.successful_results,
                "failed": job.failed_attempts,
                "pending": job.total_candidates - job.processed_candidates,
                "progress_percentage": pct,
                "speed_per_sec": job.speed_per_sec,
                "eta_seconds": job.eta_seconds,
                "recent_logs": [{"timestamp": l.timestamp.isoformat(), "level": l.level, "message": l.message} for l in logs]
            }
        finally:
            db.close()

    def list_jobs(self) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            jobs = db.query(ScanJobModel).order_by(ScanJobModel.created_at.desc()).limit(20).all()
            results = []
            for j in jobs:
                pct = round((j.processed_candidates / j.total_candidates * 100), 1) if j.total_candidates > 0 else 0
                results.append({
                    "id": j.id,
                    "exam_id": j.exam_id,
                    "url": j.url,
                    "status": j.status,
                    "total": j.total_candidates,
                    "processed": j.processed_candidates,
                    "successful": j.successful_results,
                    "failed": j.failed_attempts,
                    "progress_percentage": pct,
                    "created_at": j.created_at.isoformat() if j.created_at else None
                })
            return results
        finally:
            db.close()

    def _sync_job_db(self, ctx: ScanWorkerContext):
        db = SessionLocal()
        try:
            job = db.query(ScanJobModel).filter(ScanJobModel.id == ctx.job_id).first()
            if job:
                job.status = ctx.status
                job.processed_candidates = ctx.processed
                job.successful_results = ctx.successful
                job.failed_attempts = ctx.failed
                job.speed_per_sec = ctx.speed
                job.eta_seconds = ctx.eta_seconds
                if ctx.status == "RUNNING" and not job.start_time:
                    job.start_time = datetime.utcnow()
                if ctx.status in ["COMPLETED", "FAILED", "CANCELLED"]:
                    job.end_time = datetime.utcnow()
                db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def _run_worker(self, ctx: ScanWorkerContext):
        ctx.status = "RUNNING"
        ctx.start_time = time.time()
        self._sync_job_db(ctx)
        self._log(ctx, "INFO", f"Scanner initialized for examination target URL: {ctx.url}")

        adapter = get_adapter_by_name(ctx.adapter_name)
        
        # Prepare HTTP client
        with httpx.Client(verify=False, timeout=12.0, follow_redirects=True) as client:
            # 1. Fetch form metadata
            try:
                page_resp = client.get(ctx.url, headers={"User-Agent": "Mozilla/5.0"})
                soup = BeautifulSoup(page_resp.text, "html.parser")
                form_info = adapter.detect_form(soup, ctx.url)
            except Exception as e:
                ctx.status = "FAILED"
                self._sync_job_db(ctx)
                self._log(ctx, "ERROR", f"Failed to retrieve form details: {str(e)}")
                return

            self._log(ctx, "INFO", f"Form detected: {form_info['method']} to {form_info['action']}. Processing candidate queue...")

            last_sync_time = time.time()

            for idx, htno in enumerate(ctx.candidates):
                # Check for cancellation
                if ctx.cancel_event.is_set():
                    self._log(ctx, "WARNING", f"Scan cancelled after processing {ctx.processed} candidates.")
                    break

                # Handle pause
                if not ctx.pause_event.is_set():
                    self._log(ctx, "INFO", "Scan paused. Worker standing by...")
                    ctx.pause_event.wait()
                    if ctx.cancel_event.is_set():
                        break
                    self._log(ctx, "INFO", "Scan resumed. Continuing queue...")

                # Submit candidate hall ticket
                try:
                    success, html_content = adapter.submit_hallticket(client, form_info, htno)
                    if success:
                        res_soup = BeautifulSoup(html_content, "html.parser")
                        student_info = adapter.extract_student_details(res_soup, htno)
                        subjects = adapter.extract_subject_marks(res_soup)
                        overall = adapter.extract_overall_result(res_soup)
                        
                        normalized = adapter.normalize_result(
                            {"student_details": student_info, "subjects": subjects, "overall": overall},
                            html_content
                        )

                        # Save to database
                        self._save_student_result(ctx.exam_id, normalized)
                        ctx.successful += 1
                        ctx.success_list.append(htno)
                        self._log(ctx, "SUCCESS", f"Candidate {htno}: {normalized.name or 'Found'} | Status: {normalized.overall_status} | Backlogs: {normalized.backlog_count}")
                    else:
                        ctx.failed += 1
                        ctx.failed_list.append(htno)
                except Exception as e:
                    ctx.failed += 1
                    ctx.failed_list.append(htno)
                    self._log(ctx, "ERROR", f"Error on {htno}: {str(e)}")

                ctx.processed += 1

                # Calculate speed and ETA
                elapsed = time.time() - ctx.start_time
                if elapsed > 0:
                    ctx.speed = ctx.processed / elapsed
                    remaining = ctx.total - ctx.processed
                    ctx.eta_seconds = int(remaining / ctx.speed) if ctx.speed > 0 else 0

                # Periodically sync to DB every 2 seconds or every 5 items
                if time.time() - last_sync_time > 2.0 or idx == len(ctx.candidates) - 1:
                    self._sync_job_db(ctx)
                    last_sync_time = time.time()

                # Controlled rate limit: 100ms delay to be polite to OU servers
                time.sleep(0.1)

            # Finalize status
            if not ctx.cancel_event.is_set():
                ctx.status = "COMPLETED"
                self._log(ctx, "INFO", f"Scan completed successfully. Total: {ctx.total}, Found: {ctx.successful}, Not found: {ctx.failed}.")
            else:
                ctx.status = "CANCELLED"

            ctx.end_time = time.time()
            self._sync_job_db(ctx)
            # Update examination summary stats
            self._update_exam_stats(ctx.exam_id)

    def _save_student_result(self, exam_id: int, res: StudentExtractionResult):
        db = SessionLocal()
        try:
            # 1. Upsert Student
            student = db.query(StudentModel).filter(StudentModel.hall_ticket == res.hall_ticket).first()
            if not student:
                student = StudentModel(
                    hall_ticket=res.hall_ticket,
                    name=res.name,
                    father_name=res.father_name,
                    gender=res.gender,
                    college_code=res.college_code,
                    college_name=res.college_name,
                    branch_code=res.branch_code,
                    branch_name=res.branch_name,
                    course=res.course,
                    medium=res.medium,
                    batch_year=res.batch_year
                )
                db.add(student)
                db.flush()
            else:
                if res.name:
                    student.name = res.name
                if res.father_name:
                    student.father_name = res.father_name
                if res.gender:
                    student.gender = res.gender
                db.flush()

            # 2. Check existing result for this exam
            exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
            is_rv = (exam.exam_type == "REVALUATION") if exam else False

            result = db.query(ResultModel).filter(
                ResultModel.exam_id == exam_id,
                ResultModel.student_id == student.id
            ).first()

            if not result:
                result = ResultModel(
                    exam_id=exam_id,
                    student_id=student.id,
                    hall_ticket=res.hall_ticket,
                    semester=res.semester,
                    sgpa=res.sgpa,
                    cgpa=res.cgpa,
                    result_status=res.overall_status,
                    total_credits=res.total_credits,
                    total_marks=res.total_marks,
                    max_marks=res.max_marks,
                    backlog_count=res.backlog_count,
                    is_revaluation=is_rv,
                    raw_html_snippet=res.raw_html_snippet
                )
                db.add(result)
                db.flush()
            else:
                result.semester = res.semester
                result.sgpa = res.sgpa
                result.cgpa = res.cgpa
                result.result_status = res.overall_status
                result.total_credits = res.total_credits
                result.backlog_count = res.backlog_count
                result.version += 1
                db.flush()

            # 3. Insert or update Subject Marks
            # Delete old subject marks for this specific result
            db.query(SubjectMarksModel).filter(SubjectMarksModel.result_id == result.id).delete()

            for s in res.subjects:
                sm = SubjectMarksModel(
                    result_id=result.id,
                    exam_id=exam_id,
                    student_id=student.id,
                    hall_ticket=res.hall_ticket,
                    subject_code=s.subject_code,
                    subject_name=s.subject_name,
                    internal_marks=s.internal_marks,
                    external_marks=s.external_marks,
                    total_marks=s.total_marks,
                    max_marks=s.max_marks,
                    credits=s.credits,
                    grade=s.grade,
                    grade_points=s.grade_points,
                    status=s.status
                )
                db.add(sm)

            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def _update_exam_stats(self, exam_id: int):
        db = SessionLocal()
        try:
            results = db.query(ResultModel).filter(ResultModel.exam_id == exam_id).all()
            total_valid = len(results)
            passed = sum(1 for r in results if r.result_status == "PASSED")
            failed = sum(1 for r in results if r.result_status in ["FAILED", "PROMOTED", "DETAINED"])
            pct = round((passed / total_valid * 100), 2) if total_valid > 0 else 0.0

            exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
            if exam:
                exam.total_valid_results = total_valid
                exam.total_passed = passed
                exam.total_failed = failed
                exam.pass_percentage = pct
                db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


scan_engine = ScanEngine()
