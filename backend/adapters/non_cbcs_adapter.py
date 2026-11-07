"""
Non-CBCS / Traditional Marks Adapter for Osmania University Results.
Handles traditional marks tables (Internal, External, Total, Result).
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import httpx

from .base import (
    OUResultAdapter, PageInspectionReport, StudentExtractionResult,
    SubjectRecord, SemesterResultRecord
)
from backend.ou_metadata import decode_hall_ticket


class OUNonCBCSAdapter(OUResultAdapter):
    name = "OUNonCBCSAdapter"
    version = "1.0"

    def can_handle(self, soup: BeautifulSoup, url: str) -> float:
        text = soup.get_text().lower()
        score = 0.0
        if "osmania university" in text:
            score += 0.3
        if "internal" in text and "external" in text and "total" in text:
            score += 0.5
        if "non cbcs" in text or "non-cbcs" in text or "marks memo" in text:
            score += 0.2
        return min(1.0, score)

    def inspect_page(self, html: str, url: str) -> PageInspectionReport:
        soup = BeautifulSoup(html, "html.parser")
        is_accessible = True

        title_tag = soup.find("title")
        exam_title = title_tag.get_text().strip() if title_tag else "OU Examination Results"
        
        # Look for headers
        h1_or_b = soup.find(["h1", "h2", "h3", "b"])
        if h1_or_b:
            candidate = " ".join(h1_or_b.get_text().split())
            if len(candidate) > 15:
                exam_title = candidate

        date_match = re.search(r"(\d{1,2}-[A-Za-z]{3}-\d{4})", soup.get_text())
        exam_date_str = date_match.group(1) if date_match else None

        form_info = self.detect_form(soup, url)
        confidence = self.can_handle(soup, url)

        return PageInspectionReport(
            url=url,
            is_accessible=is_accessible,
            status_code=200,
            title=soup.title.string.strip() if soup.title else exam_title,
            exam_title=exam_title,
            exam_date_str=exam_date_str,
            exam_type="NON_CBCS_REGULAR",
            regulation="NON_CBCS",
            form_action=form_info["action"],
            form_method=form_info["method"],
            input_field_name=form_info["input_field"],
            hidden_fields=form_info["hidden_fields"],
            sample_halltickets_found=[],
            detected_length=12,
            adapter_name=self.name,
            confidence_score=confidence,
            notes=["Traditional marks structure detected (Internal / External / Total)."]
        )

    def detect_form(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
        form = soup.find("form")
        action = base_url
        method = "POST"
        hidden_fields = {}
        input_field = "htno"

        if form:
            raw_action = form.get("action", "")
            action = urljoin(base_url, raw_action) if raw_action else base_url
            method = form.get("method", "POST").upper()

            for hidden in form.find_all("input", type="hidden"):
                name = hidden.get("name")
                val = hidden.get("value", "")
                if name:
                    hidden_fields[name] = val

            text_inp = form.find("input", attrs={"type": "text"})
            if text_inp and text_inp.get("name"):
                input_field = text_inp.get("name")

        return {
            "action": action,
            "method": method,
            "input_field": input_field,
            "hidden_fields": hidden_fields
        }

    def submit_hallticket(self, client: httpx.Client, form_info: Dict[str, Any], htno: str) -> Tuple[bool, str]:
        data = dict(form_info.get("hidden_fields", {}))
        data[form_info.get("input_field", "htno")] = htno
        data["Submit"] = "Submit"

        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": form_info["action"]
        }

        try:
            if form_info["method"] == "GET":
                resp = client.get(form_info["action"], params=data, headers=headers, timeout=12.0)
            else:
                resp = client.post(form_info["action"], data=data, headers=headers, timeout=12.0)

            if resp.status_code == 200:
                text = resp.text
                if "not found" in text.lower():
                    return False, text
                if "marks" in text.lower() or "result" in text.lower():
                    return True, text
                return False, text
            return False, resp.text
        except Exception as e:
            return False, str(e)

    def extract_student_details(self, soup: BeautifulSoup, htno: str) -> Dict[str, Any]:
        info = {
            "hall_ticket": htno,
            "name": "",
            "father_name": "",
            "gender": "",
            "course": "B.E(Non-CBCS)",
            "medium": "ENGLISH"
        }
        for td in soup.find_all("td"):
            txt = td.get_text().strip()
            if "Name:" in txt:
                info["name"] = txt.replace("Name:", "").strip()
            elif "Father" in txt:
                info["father_name"] = txt.replace("Father's Name:", "").replace("Father Name:", "").strip()

        meta = decode_hall_ticket(info["hall_ticket"] or htno)
        info["college_code"] = meta["college_code"]
        info["college_name"] = meta["college_name"]
        info["branch_code"] = meta["branch_code"]
        info["branch_name"] = meta["branch_name"]
        info["batch_year"] = meta["batch_year"]
        info["student_type"] = meta["student_type"]
        return info

    def extract_subject_marks(self, soup: BeautifulSoup) -> List[SubjectRecord]:
        subjects: List[SubjectRecord] = []
        for tbl in soup.find_all("table"):
            text = tbl.get_text().lower()
            if "internal" in text and "external" in text:
                rows = tbl.find_all("tr")
                for r in rows:
                    tds = [td.get_text().strip() for td in r.find_all("td")]
                    if len(tds) >= 5 and tds[0].isalnum():
                        try:
                            # Sub code, Sub Name, Internal, External, Total, Result
                            code = tds[0]
                            name = tds[1]
                            im = float(tds[2]) if tds[2].isdigit() else None
                            em = float(tds[3]) if tds[3].isdigit() else None
                            tot = float(tds[4]) if tds[4].isdigit() else None
                            res = tds[5].upper() if len(tds) > 5 else "PASSED"
                            status = "PASSED" if "P" in res else "FAILED"
                            grade = "PASS" if status == "PASSED" else "FAIL"

                            subjects.append(SubjectRecord(
                                subject_code=code,
                                subject_name=name,
                                internal_marks=im,
                                external_marks=em,
                                total_marks=tot,
                                grade=grade,
                                status=status
                            ))
                        except Exception:
                            continue
        return subjects

    def extract_overall_result(self, soup: BeautifulSoup) -> Dict[str, Any]:
        return {
            "semester": "All",
            "sgpa": None,
            "cgpa": None,
            "overall_status": "PASSED",
            "semesters": []
        }

    def normalize_result(self, raw_data: Dict[str, Any], raw_html: str) -> StudentExtractionResult:
        student_details = raw_data.get("student_details", {})
        subjects = raw_data.get("subjects", [])
        overall = raw_data.get("overall", {})

        backlogs = sum(1 for s in subjects if s.status == "FAILED")
        status = "PASSED" if backlogs == 0 else "PROMOTED"

        total_marks = sum(s.total_marks or 0.0 for s in subjects)

        return StudentExtractionResult(
            hall_ticket=student_details.get("hall_ticket", ""),
            name=student_details.get("name"),
            father_name=student_details.get("father_name"),
            gender=student_details.get("gender"),
            college_code=student_details.get("college_code"),
            college_name=student_details.get("college_name"),
            branch_code=student_details.get("branch_code"),
            branch_name=student_details.get("branch_name"),
            course=student_details.get("course", "B.E(Non-CBCS)"),
            medium=student_details.get("medium", "ENGLISH"),
            batch_year=student_details.get("batch_year"),
            student_type=student_details.get("student_type", "Regular"),
            semester=overall.get("semester", ""),
            total_marks=total_marks if total_marks > 0 else None,
            overall_status=status,
            backlog_count=backlogs,
            subjects=subjects,
            semesters=[],
            raw_html_snippet=raw_html[:4000] if raw_html else None
        )
