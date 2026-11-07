"""
Osmania University (OU) Engineering Metadata Reference.
Contains authoritative mappings for:
- College codes
- Engineering Branch codes
- Grade Points and classifications
- Hall ticket format regex and generators
"""

from typing import Dict, Optional, Tuple

OU_COLLEGES: Dict[str, str] = {
    "1005": "University College of Engineering, Osmania University (Campus)",
    "1601": "Chaitanya Bharathi Institute of Technology (CBIT)",
    "1602": "Vasavi College of Engineering (VCE)",
    "1603": "Deccan College of Engineering and Technology (DCET)",
    "1604": "Muffakham Jah College of Engineering and Technology (MJCET)",
    "1605": "ISL Engineering College",
    "1606": "Stanley College of Engineering and Technology for Women",
    "1607": "Methodist College of Engineering and Technology",
    "1608": "Matrusri Engineering College",
    "1609": "Stanley College of Engineering & Technology",
    "1610": "Lords Institute of Engineering and Technology",
    "1611": "Nawab Shah Alam Khan College of Engineering",
    "2451": "MVSR Engineering College",
    "2452": "Vasavi College of Engineering (Affiliated)",
    "2454": "Neil Gogte Institute of Technology",
    "2455": "Keshav Memorial Institute of Technology (KMIT)",
    "2456": "Keshav Memorial Engineering College"
}

OU_BRANCHES: Dict[str, str] = {
    "732": "Civil Engineering",
    "733": "Computer Science and Engineering (CSE)",
    "734": "Electrical and Electronics Engineering (EEE)",
    "735": "Electronics and Communication Engineering (ECE)",
    "736": "Mechanical Engineering",
    "737": "Information Technology (IT)",
    "738": "Production Engineering",
    "739": "Automobile Engineering",
    "740": "Bio-Medical Engineering",
    "748": "Artificial Intelligence & Machine Learning (AI&ML)",
    "749": "Artificial Intelligence & Data Science (AI&DS)",
    "750": "Computer Science & Business Systems (CSBS)",
    "751": "Internet of Things (IoT)",
    "752": "Cyber Security"
}

# OU CBCS Grading System: Grade -> (Grade Points, Description)
OU_GRADE_POINTS: Dict[str, Tuple[float, str]] = {
    "O": (10.0, "Outstanding"),
    "A+": (9.0, "Excellent"),
    "A": (8.0, "Very Good"),
    "B+": (7.0, "Good"),
    "B": (6.0, "Above Average"),
    "C": (5.0, "Average"),
    "D": (4.0, "Pass"),
    "P": (4.0, "Pass"),
    "F": (0.0, "Fail"),
    "AB": (0.0, "Absent"),
    "Ab": (0.0, "Absent"),
    "WH": (0.0, "Withheld"),
    "MALP": (0.0, "Malpractice"),
    "-": (0.0, "Not Available")
}

def decode_hall_ticket(htno: str) -> Dict[str, Optional[str]]:
    """
    Deconstructs an OU 12-digit Hall Ticket Number:
    Example: 160324732301
    - 1603: College Code
    - 24: Admission Year (2024)
    - 732: Branch Code (Civil)
    - 301: Roll Number (300+ usually lateral entry, 001-060 regular)
    """
    htno = htno.strip().upper()
    if len(htno) != 12 or not htno.isdigit():
        return {
            "hall_ticket": htno,
            "is_valid_format": False,
            "college_code": None,
            "college_name": "Unknown College",
            "batch_year": None,
            "branch_code": None,
            "branch_name": "Unknown Branch",
            "student_type": "Unknown",
            "roll_no": None
        }

    college_code = htno[0:4]
    batch_prefix = htno[4:6]
    branch_code = htno[6:9]
    roll_no = htno[9:12]

    batch_year = f"20{batch_prefix}"
    college_name = OU_COLLEGES.get(college_code, f"College ({college_code})")
    branch_name = OU_BRANCHES.get(branch_code, f"Branch ({branch_code})")

    # Roll numbers >= 301 in OU engineering indicate Lateral Entry (Diploma to 2nd year BE)
    try:
        roll_int = int(roll_no)
        student_type = "Lateral Entry" if roll_int >= 300 else "Regular"
    except ValueError:
        student_type = "Regular"

    return {
        "hall_ticket": htno,
        "is_valid_format": True,
        "college_code": college_code,
        "college_name": college_name,
        "batch_year": batch_year,
        "branch_code": branch_code,
        "branch_name": branch_name,
        "student_type": student_type,
        "roll_no": roll_no
    }
