"""
Database models and connection engine for OU Results Intelligence.
Supports SQLite (with WAL mode & foreign keys) and PostgreSQL via DATABASE_URL.
"""

import os
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index, event
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ou_results.db")

# For SQLite, configure connect_args
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Enable WAL mode and foreign keys for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine))
Base = declarative_base()


class ExamModel(Base):
    __tablename__ = "examinations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), unique=True, index=True, nullable=False)
    exam_date_str = Column(String(100), nullable=True)
    exam_type = Column(String(50), default="REGULAR")  # REGULAR, BACKLOG, REVALUATION, BRIDGE_COURSE
    regulation = Column(String(50), default="AICTE")   # AICTE, CBCS, NON_CBCS
    semester = Column(String(50), nullable=True)
    academic_year = Column(String(50), nullable=True)
    adapter_name = Column(String(100), default="OUCBCSStandardAdapter")
    parent_exam_id = Column(Integer, ForeignKey("examinations.id"), nullable=True)
    
    # Aggregated stats cache
    total_candidates_scanned = Column(Integer, default=0)
    total_valid_results = Column(Integer, default=0)
    total_passed = Column(Integer, default=0)
    total_failed = Column(Integer, default=0)
    pass_percentage = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    results = relationship("ResultModel", back_populates="examination", cascade="all, delete-orphan")
    parent_exam = relationship("ExamModel", remote_side=[id])


class StudentModel(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hall_ticket = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=True)
    father_name = Column(String(200), nullable=True)
    gender = Column(String(20), nullable=True)
    college_code = Column(String(20), index=True, nullable=True)
    college_name = Column(String(300), nullable=True)
    branch_code = Column(String(20), index=True, nullable=True)
    branch_name = Column(String(200), nullable=True)
    course = Column(String(100), default="B.E(CBCS)")
    medium = Column(String(50), default="ENGLISH")
    batch_year = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    results = relationship("ResultModel", back_populates="student", cascade="all, delete-orphan")


class ResultModel(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_id = Column(Integer, ForeignKey("examinations.id"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), index=True, nullable=False)
    hall_ticket = Column(String(20), index=True, nullable=False)
    semester = Column(String(50), nullable=True)
    sgpa = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    result_status = Column(String(50), default="PASSED")  # PASSED, PROMOTED, FAILED, ALREADY PROMOTED, DETAINED
    total_credits = Column(Float, default=0.0)
    total_marks = Column(Float, nullable=True)
    max_marks = Column(Float, nullable=True)
    backlog_count = Column(Integer, default=0)
    is_revaluation = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    raw_html_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    examination = relationship("ExamModel", back_populates="results")
    student = relationship("StudentModel", back_populates="results")
    subject_marks = relationship("SubjectMarksModel", back_populates="result", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_exam_student", "exam_id", "student_id", unique=True),
    )


class SubjectMarksModel(Base):
    __tablename__ = "subject_marks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    result_id = Column(Integer, ForeignKey("results.id"), index=True, nullable=False)
    exam_id = Column(Integer, ForeignKey("examinations.id"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), index=True, nullable=False)
    hall_ticket = Column(String(20), index=True, nullable=False)
    
    subject_code = Column(String(50), index=True, nullable=False)
    subject_name = Column(String(300), nullable=False)
    internal_marks = Column(Float, nullable=True)
    external_marks = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=True)
    max_marks = Column(Float, nullable=True)
    credits = Column(Float, default=0.0)
    grade = Column(String(20), nullable=False)  # O, A+, A, B+, B, C, D, F, Ab, WH
    grade_points = Column(Float, default=0.0)
    status = Column(String(20), default="PASSED")  # PASSED, FAILED, ABSENT, WITHHELD

    result = relationship("ResultModel", back_populates="subject_marks")


class RevaluationComparisonModel(Base):
    __tablename__ = "revaluation_comparisons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_exam_id = Column(Integer, ForeignKey("examinations.id"), index=True, nullable=False)
    revaluation_exam_id = Column(Integer, ForeignKey("examinations.id"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), index=True, nullable=False)
    hall_ticket = Column(String(20), index=True, nullable=False)
    
    subject_code = Column(String(50), index=True, nullable=False)
    subject_name = Column(String(300), nullable=False)
    
    original_grade = Column(String(20), nullable=True)
    revaluation_grade = Column(String(20), nullable=True)
    original_marks = Column(Float, nullable=True)
    revaluation_marks = Column(Float, nullable=True)
    marks_diff = Column(Float, nullable=True)
    grade_points_diff = Column(Float, nullable=True)
    
    # Transition classification: FAILED_TO_PASSED, PASSED_TO_FAILED, GRADE_IMPROVED, GRADE_DECREASED, UNCHANGED
    status_change = Column(String(50), default="UNCHANGED")
    backlog_cleared = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScanJobModel(Base):
    __tablename__ = "scan_jobs"

    id = Column(String(100), primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("examinations.id"), index=True, nullable=True)
    url = Column(String(1000), nullable=False)
    status = Column(String(50), default="QUEUED")  # QUEUED, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED
    
    total_candidates = Column(Integer, default=0)
    processed_candidates = Column(Integer, default=0)
    successful_results = Column(Integer, default=0)
    failed_attempts = Column(Integer, default=0)
    
    speed_per_sec = Column(Float, default=0.0)
    eta_seconds = Column(Integer, default=0)
    
    config_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("ScanLogModel", back_populates="job", cascade="all, delete-orphan", order_by="ScanLogModel.id.desc()")


class ScanLogModel(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(100), ForeignKey("scan_jobs.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String(20), default="INFO")  # INFO, SUCCESS, WARNING, ERROR
    message = Column(Text, nullable=False)

    job = relationship("ScanJobModel", back_populates="logs")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
