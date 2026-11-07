from .base import (
    OUResultAdapter, PageInspectionReport, StudentExtractionResult,
    SubjectRecord, SemesterResultRecord
)
from .cbcs_adapter import OUCBCSStandardAdapter
from .non_cbcs_adapter import OUNonCBCSAdapter
from .registry import inspect_url, select_best_adapter, get_adapter_by_name

__all__ = [
    "OUResultAdapter",
    "PageInspectionReport",
    "StudentExtractionResult",
    "SubjectRecord",
    "SemesterResultRecord",
    "OUCBCSStandardAdapter",
    "OUNonCBCSAdapter",
    "inspect_url",
    "select_best_adapter",
    "get_adapter_by_name"
]
