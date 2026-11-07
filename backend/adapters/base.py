"""
Base Adapter and Schema Definitions for OU Results Intelligence.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field
from bs4 import BeautifulSoup
import httpx


class SubjectRecord(BaseModel):
    subject_code: str
    subject_name: str
    credits: float = 0.0
    grade: str = "-"
    grade_points: float = 0.0
    internal_marks: Optional[float] = None
    external_marks: Optional[float] = None
    total_marks: Optional[float] = None
    max_marks: Optional[float] = None
    status: str = "PASSED"  # PASSED, FAILED, ABSENT, WITHHELD


class SemesterResultRecord(BaseModel):
    semester: str = ""
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None
    result_status: str = "PASSED"  # PASSED, PROMOTED, FAILED, ALREADY PROMOTED


class StudentExtractionResult(BaseModel):
    hall_ticket: str
    name: Optional[str] = None
    father_name: Optional[str] = None
    gender: Optional[str] = None
    college_code: Optional[str] = None
    college_name: Optional[str] = None
    branch_code: Optional[str] = None
    branch_name: Optional[str] = None
    course: str = "B.E(CBCS)"
    medium: str = "ENGLISH"
    batch_year: Optional[str] = None
    student_type: str = "Regular"
    
    # Academic Results
    semester: str = ""
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None
    total_credits: float = 0.0
    total_marks: Optional[float] = None
    max_marks: Optional[float] = None
    overall_status: str = "PASSED"
    backlog_count: int = 0
    subjects: List[SubjectRecord] = Field(default_factory=list)
    semesters: List[SemesterResultRecord] = Field(default_factory=list)
    raw_html_snippet: Optional[str] = None


class PageInspectionReport(BaseModel):
    url: str
    is_accessible: bool
    status_code: int = 200
    title: str = ""
    exam_title: str = ""
    exam_date_str: Optional[str] = None
    exam_type: str = "REGULAR"  # REGULAR, REVALUATION, BACKLOG, MAKEUP
    regulation: str = "AICTE"   # AICTE, CBCS, NON_CBCS
    
    # Form details
    form_action: str = ""
    form_method: str = "POST"
    input_field_name: str = "htno"
    hidden_fields: Dict[str, str] = Field(default_factory=dict)
    sample_halltickets_found: List[str] = Field(default_factory=list)
    detected_length: int = 12
    
    # Engine details
    adapter_name: str = "OUCBCSStandardAdapter"
    confidence_score: float = 0.0
    notes: List[str] = Field(default_factory=list)
    error_detail: Optional[str] = None


class OUResultAdapter(ABC):
    """
    Abstract Base Class for all Osmania University Result Page Adapters.
    """
    name: str = "BaseAdapter"
    version: str = "1.0"

    @abstractmethod
    def can_handle(self, soup: BeautifulSoup, url: str) -> float:
        """
        Evaluate how well this adapter can parse the given page.
        Returns a confidence score between 0.0 and 1.0.
        """
        pass

    @abstractmethod
    def inspect_page(self, html: str, url: str) -> PageInspectionReport:
        """
        Analyze HTML and return comprehensive inspection report.
        """
        pass

    @abstractmethod
    def detect_form(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
        """
        Identify form action, method, input fields and hidden fields.
        """
        pass

    @abstractmethod
    def submit_hallticket(self, client: httpx.Client, form_info: Dict[str, Any], htno: str) -> Tuple[bool, str]:
        """
        Submit a candidate hall ticket to the server and return (success, html_response).
        """
        pass

    @abstractmethod
    def extract_student_details(self, soup: BeautifulSoup, htno: str) -> Dict[str, Any]:
        """
        Extract personal information (name, father name, course, gender, etc.)
        """
        pass

    @abstractmethod
    def extract_subject_marks(self, soup: BeautifulSoup) -> List[SubjectRecord]:
        """
        Extract subjects, grades, credits, marks.
        """
        pass

    @abstractmethod
    def extract_overall_result(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extract SGPA, CGPA, result status per semester.
        """
        pass

    @abstractmethod
    def normalize_result(self, raw_data: Dict[str, Any], raw_html: str) -> StudentExtractionResult:
        """
        Clean, normalize and structure into StudentExtractionResult.
        """
        pass

    def validate_result(self, result: StudentExtractionResult) -> Tuple[bool, List[str]]:
        """
        Validate consistency of extracted result.
        """
        errors = []
        if not result.hall_ticket:
            errors.append("Missing hall ticket number.")
        if not result.subjects:
            errors.append("No subjects extracted for candidate.")
        return len(errors) == 0, errors
