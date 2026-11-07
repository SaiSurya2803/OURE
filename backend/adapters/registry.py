"""
Adapter Registry and Inspection Factory for OU Results Intelligence.
"""

from typing import List, Optional, Tuple
from bs4 import BeautifulSoup
import httpx

from .base import OUResultAdapter, PageInspectionReport
from .cbcs_adapter import OUCBCSStandardAdapter
from .non_cbcs_adapter import OUNonCBCSAdapter

ADAPTERS: List[OUResultAdapter] = [
    OUCBCSStandardAdapter(),
    OUNonCBCSAdapter()
]

def get_adapter_by_name(name: str) -> Optional[OUResultAdapter]:
    for adapter in ADAPTERS:
        if adapter.name == name:
            return adapter
    return ADAPTERS[0]

def select_best_adapter(soup: BeautifulSoup, url: str) -> Tuple[OUResultAdapter, float]:
    best_adapter = ADAPTERS[0]
    highest_score = -1.0
    for adapter in ADAPTERS:
        score = adapter.can_handle(soup, url)
        if score > highest_score:
            highest_score = score
            best_adapter = adapter
    return best_adapter, highest_score

def inspect_url(url: str, custom_html: Optional[str] = None) -> PageInspectionReport:
    """
    Connects to the given URL (or uses custom uploaded HTML) and produces
    an intelligent webpage inspection report.
    """
    html_content = ""
    status_code = 200

    if custom_html:
        html_content = custom_html
    else:
        # Fetch from remote URL
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        try:
            with httpx.Client(verify=False, timeout=15.0, follow_redirects=True) as client:
                resp = client.get(url, headers=headers)
                status_code = resp.status_code
                if status_code != 200:
                    return PageInspectionReport(
                        url=url,
                        is_accessible=False,
                        status_code=status_code,
                        error_detail=f"Official server returned HTTP status {status_code}.",
                        notes=["Please verify the URL or upload saved HTML/PDF/Excel manually."]
                    )
                html_content = resp.text
        except httpx.ConnectTimeout:
            return PageInspectionReport(
                url=url,
                is_accessible=False,
                status_code=504,
                error_detail="Connection timed out while reaching Osmania University server.",
                notes=["The OU server might be undergoing maintenance. You can use manual HTML upload."]
            )
        except httpx.ConnectError as e:
            return PageInspectionReport(
                url=url,
                is_accessible=False,
                status_code=503,
                error_detail=f"Connection failed: {str(e)}",
                notes=["Network error. Check network connection or use manual upload."]
            )
        except Exception as e:
            return PageInspectionReport(
                url=url,
                is_accessible=False,
                status_code=500,
                error_detail=f"Inspection error: {str(e)}",
                notes=["Unexpected error encountered during page inspection."]
            )

    soup = BeautifulSoup(html_content, "html.parser")
    adapter, confidence = select_best_adapter(soup, url)
    report = adapter.inspect_page(html_content, url)
    report.confidence_score = confidence
    return report
