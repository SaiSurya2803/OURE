"""
CBCS / AICTE Standard Adapter for Osmania University Results.
Handles modern AICTE/CBCS results tables (AutoNumber1..AutoNumber6).
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
from backend.ou_metadata import decode_hall_ticket, OU_GRADE_POINTS


class OUCBCSStandardAdapter(OUResultAdapter):
    name = "OUCBCSStandardAdapter"
    version = "1.0"

    def can_handle(self, soup: BeautifulSoup, url: str) -> float:
        score = 0.0
        # Check title and text
        text = soup.get_text().lower()
        if "osmania university" in text:
            score += 0.3
        if "hall ticket" in text or "htno" in text:
            score += 0.2
        # Look for OU table IDs
        if soup.find("table", id="AutoNumber1") or soup.find("table", id="AutoNumber6"):
            score += 0.4
        if soup.find("input", attrs={"name": "htno"}):
            score += 0.1
        return min(1.0, score)

    def inspect_page(self, html: str, url: str) -> PageInspectionReport:
        soup = BeautifulSoup(html, "html.parser")
        is_accessible = True
        
        # 1. Exam Title & Date
        exam_title = ""
        exam_date_str = None
        t1 = soup.find("table", id="AutoNumber1")
        if t1:
            # First row usually has bold exam title
            bold_el = t1.find("b")
            if bold_el:
                exam_title = " ".join(bold_el.get_text().split())
            
            # Find date pattern like 05-Nov-2026 or 19-Sep-2026
            date_match = re.search(r"(\d{1,2}-[A-Za-z]{3}-\d{4})", t1.get_text())
            if date_match:
                exam_date_str = date_match.group(1)
        
        if not exam_title:
            title_tag = soup.find("title")
            exam_title = title_tag.get_text().strip() if title_tag else "Osmania University Examination Result"

        # 2. Determine Exam Type & Regulation
        exam_type = "REGULAR"
        title_upper = exam_title.upper()
        if "REVALUATION" in title_upper or "RV" in title_upper:
            exam_type = "REVALUATION"
        elif "MAKE-UP" in title_upper or "MAKEUP" in title_upper:
            exam_type = "MAKEUP"
        elif "BACKLOG" in title_upper and "MAIN" not in title_upper:
            exam_type = "BACKLOG"

        regulation = "AICTE"
        if "NON CBCS" in title_upper or "NON-CBCS" in title_upper:
            regulation = "NON_CBCS"
        elif "CBCS" in title_upper:
            regulation = "CBCS"

        # 3. Form Details
        form_info = self.detect_form(soup, url)

        # 4. Detect sample hall tickets from help text
        sample_hts = []
        body_text = soup.get_text()
        ht_matches = re.findall(r"(?:Ex:?\s*|\b)([0-9]{12})\b", body_text)
        if ht_matches:
            # preserve unique while maintaining order
            for ht in ht_matches:
                if ht not in sample_hts:
                    sample_hts.append(ht)

        # Determine confidence
        confidence = self.can_handle(soup, url)

        notes = [
            f"Detected exam: {exam_title[:60]}...",
            f"Regulation: {regulation}, Type: {exam_type}",
            f"Target action: {form_info['action']} via {form_info['method']}",
            f"Sample hall tickets discovered on page: {', '.join(sample_hts[:3]) if sample_hts else 'None'}"
        ]

        return PageInspectionReport(
            url=url,
            is_accessible=is_accessible,
            status_code=200,
            title=soup.title.string.strip() if soup.title else exam_title,
            exam_title=exam_title,
            exam_date_str=exam_date_str,
            exam_type=exam_type,
            regulation=regulation,
            form_action=form_info["action"],
            form_method=form_info["method"],
            input_field_name=form_info["input_field"],
            hidden_fields=form_info["hidden_fields"],
            sample_halltickets_found=sample_hts[:5],
            detected_length=12,
            adapter_name=self.name,
            confidence_score=confidence,
            notes=notes
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

            # Check text input for htno
            text_inp = form.find("input", attrs={"type": "text"})
            if text_inp and text_inp.get("name"):
                input_field = text_inp.get("name")

        # Default hidden field for OU jsp
        if not hidden_fields:
            hidden_fields["mbstatus"] = "SEARCH"

        return {
            "action": action,
            "method": method,
            "input_field": input_field,
            "hidden_fields": hidden_fields
        }

    def submit_hallticket(self, client: httpx.Client, form_info: Dict[str, Any], htno: str) -> Tuple[bool, str]:
        data = dict(form_info.get("hidden_fields", {}))
        data[form_info.get("input_field", "htno")] = htno
        data["Submit.x"] = "15"
        data["Submit.y"] = "15"
        data["Submit"] = "Go"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": form_info["action"],
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            if form_info["method"] == "GET":
                resp = client.get(form_info["action"], params=data, headers=headers, timeout=12.0)
            else:
                resp = client.post(form_info["action"], data=data, headers=headers, timeout=12.0)

            if resp.status_code == 200:
                # Check whether result was found or "not found"
                text = resp.text
                if "is not found" in text.lower() or "not found" in text.lower() and "AutoNumber3" not in text:
                    return False, text
                if "AutoNumber3" in text or "Personal Details" in text:
                    return True, text
                # In some pages, valid result is determined by subject marks
                if "Marks Details" in text or "Sub Code" in text:
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
            "course": "B.E(CBCS)",
            "medium": "ENGLISH"
        }

        t3 = soup.find("table", id="AutoNumber3")
        if not t3:
            # Fallback search for Personal Details table
            for tbl in soup.find_all("table"):
                if "Personal Details" in tbl.get_text():
                    t3 = tbl
                    break

        if t3:
            cells = [td.get_text().strip() for td in t3.find_all("td")]
            for i in range(len(cells) - 1):
                label = cells[i].lower().replace(".", "").strip()
                val = cells[i + 1].strip()
                if "hall ticket" in label:
                    info["hall_ticket"] = val or htno
                elif label == "name":
                    info["name"] = val
                elif "father" in label:
                    info["father_name"] = val
                elif "gender" in label:
                    info["gender"] = val
                elif "course" in label:
                    info["course"] = val
                elif "medium" in label:
                    info["medium"] = val

        # Enrich with OU metadata decoder
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
        t4 = soup.find("table", id="AutoNumber4")
        if not t4:
            for tbl in soup.find_all("table"):
                if "Marks Details" in tbl.get_text() or "Sub Code" in tbl.get_text():
                    t4 = tbl
                    break

        if not t4:
            return subjects

        rows = t4.find_all("tr")
        for row in rows:
            tds = row.find_all("td")
            if len(tds) < 4:
                continue

            c0 = tds[0].get_text().strip()
            c1 = tds[1].get_text().strip()
            c2 = tds[2].get_text().strip()
            c3 = tds[3].get_text().strip()

            # Skip header row
            if "sub code" in c0.lower() or "subject" in c0.lower():
                continue

            # In OU tables:
            # Col 0: Sub Code (e.g. 277, 302U)
            # Col 1: Subject Name
            # Col 2: Credits
            # Col 3: Grade Secured (e.g. A, B, C, F, Ab)
            try:
                credits_val = float(c2)
            except ValueError:
                credits_val = 0.0

            grade_val = c3.upper().strip()
            grade_points, _ = OU_GRADE_POINTS.get(grade_val, (0.0, "Fail"))

            # Determine pass/fail status
            if grade_val in ["F", "FAIL"]:
                subj_status = "FAILED"
            elif grade_val in ["AB", "ABSENT"]:
                subj_status = "ABSENT"
            elif grade_val in ["WH", "WITHHELD"]:
                subj_status = "WITHHELD"
            else:
                subj_status = "PASSED"

            subjects.append(SubjectRecord(
                subject_code=c0,
                subject_name=c1,
                credits=credits_val,
                grade=grade_val,
                grade_points=grade_points,
                status=subj_status
            ))

        return subjects

    def extract_overall_result(self, soup: BeautifulSoup) -> Dict[str, Any]:
        result_data = {
            "semester": "",
            "sgpa": None,
            "cgpa": None,
            "overall_status": "PASSED",
            "semesters": []
        }

        t5 = soup.find("table", id="AutoNumber5")
        if not t5:
            for tbl in soup.find_all("table"):
                if "Result With SGPA" in tbl.get_text() or "Over all CGPA" in tbl.get_text():
                    t5 = tbl
                    break

        if not t5:
            return result_data

        rows = t5.find_all("tr")
        for row in rows:
            tds = row.find_all("td")
            if len(tds) < 3:
                continue

            sem_text = tds[0].get_text().strip()
            sgpa_text = tds[1].get_text().strip()
            cgpa_text = tds[2].get_text().strip()

            if "semester" in sem_text.lower():
                continue

            # Parse SGPA and Status (e.g., 'PASSED-9' or 'PROMOTED--' or 'PASSED-8.25')
            sgpa_val = None
            status_val = "PASSED"

            if "PASSED" in sgpa_text:
                status_val = "PASSED"
                m = re.search(r"PASSED-([\d.]+)", sgpa_text)
                if m:
                    try:
                        sgpa_val = float(m.group(1))
                    except ValueError:
                        pass
            elif "PROMOTED" in sgpa_text:
                status_val = "PROMOTED"
            elif "FAILED" in sgpa_text:
                status_val = "FAILED"
            elif "DETAINED" in sgpa_text:
                status_val = "DETAINED"

            cgpa_val = None
            if cgpa_text and cgpa_text != "-":
                try:
                    cgpa_val = float(cgpa_text)
                except ValueError:
                    pass

            record = SemesterResultRecord(
                semester=sem_text,
                sgpa=sgpa_val,
                cgpa=cgpa_val,
                result_status=status_val
            )
            result_data["semesters"].append(record)

            # Latest or highest semester recorded
            result_data["semester"] = sem_text
            if sgpa_val is not None:
                result_data["sgpa"] = sgpa_val
            if cgpa_val is not None:
                result_data["cgpa"] = cgpa_val
            result_data["overall_status"] = status_val

        return result_data

    def normalize_result(self, raw_data: Dict[str, Any], raw_html: str) -> StudentExtractionResult:
        student_details = raw_data.get("student_details", {})
        subjects = raw_data.get("subjects", [])
        overall = raw_data.get("overall", {})

        # Compute backlogs from subjects
        backlogs = sum(1 for s in subjects if s.status in ["FAILED", "ABSENT"])
        
        # Calculate SGPA if not present in overall summary
        sgpa = overall.get("sgpa")
        total_credits = sum(s.credits for s in subjects)
        if sgpa is None and total_credits > 0:
            weighted_points = sum(s.credits * s.grade_points for s in subjects)
            sgpa = round(weighted_points / total_credits, 2)

        # Determine overall status
        status = overall.get("overall_status", "PASSED")
        if backlogs > 0 and status == "PASSED":
            status = "PROMOTED"

        return StudentExtractionResult(
            hall_ticket=student_details.get("hall_ticket", ""),
            name=student_details.get("name"),
            father_name=student_details.get("father_name"),
            gender=student_details.get("gender"),
            college_code=student_details.get("college_code"),
            college_name=student_details.get("college_name"),
            branch_code=student_details.get("branch_code"),
            branch_name=student_details.get("branch_name"),
            course=student_details.get("course", "B.E(CBCS)"),
            medium=student_details.get("medium", "ENGLISH"),
            batch_year=student_details.get("batch_year"),
            student_type=student_details.get("student_type", "Regular"),
            semester=overall.get("semester", ""),
            sgpa=sgpa,
            cgpa=overall.get("cgpa"),
            total_credits=total_credits,
            overall_status=status,
            backlog_count=backlogs,
            subjects=subjects,
            semesters=overall.get("semesters", []),
            raw_html_snippet=raw_html[:4000] if raw_html else None
        )
