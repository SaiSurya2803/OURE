"""
Automated Hall Ticket Discovery Engine for OU Results Intelligence.
Generates candidate hall tickets from discovered patterns, branch matrices,
ranges, or custom import lists.
"""

from typing import List, Dict, Set, Optional, Tuple
from pydantic import BaseModel
from backend.ou_metadata import OU_COLLEGES, OU_BRANCHES, decode_hall_ticket


class DiscoveryConfig(BaseModel):
    mode: str = "AUTO"  # AUTO, PATTERN, RANGE, CUSTOM_LIST
    college_codes: List[str] = []
    batch_year: Optional[str] = "24"  # 2-digit e.g. "24" for 2024
    branch_codes: List[str] = []
    include_regular: bool = True       # rolls 1..60
    include_lateral: bool = True       # rolls 301..330
    custom_start_roll: Optional[int] = None
    custom_end_roll: Optional[int] = None
    start_hallticket: Optional[str] = None
    end_hallticket: Optional[str] = None
    custom_list: List[str] = []


class HallTicketDiscoveryEngine:
    """
    Intelligent generator and validator for OU Hall Ticket candidates.
    """

    @staticmethod
    def auto_discover_from_samples(
        sample_hts: List[str],
        max_per_branch: int = 15,
        target_branches: Optional[List[str]] = None
    ) -> List[str]:
        """
        Takes samples discovered during inspection (e.g. ['160324732301', '160324733302'])
        and synthesizes candidate hall tickets covering all active engineering branches
        for those discovered colleges and batches.
        """
        candidates: Set[str] = set()

        # Add samples first
        for ht in sample_hts:
            ht_clean = ht.strip()
            if len(ht_clean) == 12 and ht_clean.isdigit():
                candidates.add(ht_clean)

        colleges_found = set()
        batches_found = set()

        for ht in sample_hts:
            if len(ht) == 12 and ht.isdigit():
                colleges_found.add(ht[0:4])
                batches_found.add(ht[4:6])

        # If no samples, fallback to top OU engineering colleges
        if not colleges_found:
            colleges_found = {"1603", "1604", "1005"}
        if not batches_found:
            batches_found = {"24", "23", "22"}

        branches = target_branches if target_branches else ["732", "733", "734", "735", "736", "737", "748"]

        for coll in colleges_found:
            for bch in batches_found:
                for brn in branches:
                    # Regular candidates (001 up to max_per_branch)
                    for r in range(1, min(max_per_branch + 1, 61)):
                        roll_str = f"{r:03d}"
                        candidates.add(f"{coll}{bch}{brn}{roll_str}")
                    # Lateral candidates (301 up to 301 + max_per_branch)
                    for r in range(301, 301 + min(max_per_branch, 30)):
                        roll_str = f"{r:03d}"
                        candidates.add(f"{coll}{bch}{brn}{roll_str}")

        return sorted(list(candidates))

    @staticmethod
    def generate_from_config(config: DiscoveryConfig) -> List[str]:
        candidates: Set[str] = set()

        if config.mode == "CUSTOM_LIST" and config.custom_list:
            for item in config.custom_list:
                clean = item.strip()
                if len(clean) == 12 and clean.isdigit():
                    candidates.add(clean)
            return sorted(list(candidates))

        if config.mode == "RANGE" and config.start_hallticket and config.end_hallticket:
            start_str = config.start_hallticket.strip()
            end_str = config.end_hallticket.strip()
            if start_str.isdigit() and end_str.isdigit() and len(start_str) == 12 and len(end_str) == 12:
                s_int = int(start_str)
                e_int = int(end_str)
                if s_int <= e_int and (e_int - s_int) <= 2000:
                    for i in range(s_int, e_int + 1):
                        candidates.add(str(i))
                    return sorted(list(candidates))

        # Default or PATTERN mode
        colleges = config.college_codes if config.college_codes else ["1603"]
        batch = config.batch_year if config.batch_year else "24"
        branches = config.branch_codes if config.branch_codes else ["732", "733", "734", "735", "736", "737"]

        start_r = config.custom_start_roll or 1
        end_r = config.custom_end_roll or 30

        for coll in colleges:
            for brn in branches:
                if config.include_regular:
                    for r in range(start_r, min(end_r + 1, 61)):
                        candidates.add(f"{coll}{batch}{brn}{r:03d}")
                if config.include_lateral:
                    for r in range(301, 301 + (end_r - start_r + 1)):
                        candidates.add(f"{coll}{batch}{brn}{r:03d}")

        return sorted(list(candidates))

    @staticmethod
    def parse_imported_text(text: str) -> List[str]:
        import re
        matches = re.findall(r"\b([0-9]{12})\b", text)
        return sorted(list(set(matches)))
