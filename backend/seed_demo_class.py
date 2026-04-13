"""Seed script: create demo class '의대 준비반' with 10 students, 2 tests, 400 scores."""
from __future__ import annotations

import sys
import httpx

BASE = "http://localhost:8000/api"

TEST1: dict[str, list[str]] = {
    "김민재":  ["O","O","O","O","O", "O","O","O","O","O", "O","O","O","O","X", "O","O","X","O","O"],
    "강시우":  ["O","O","O","O","O", "O","O","O","X","O", "O","O","O","O","X", "O","O","O","X","O"],
    "박현우":  ["O","X","X","O","X", "O","X","O","X","X", "X","O","X","O","X", "O","O","X","O","X"],
    "한도윤":  ["O","O","O","O","O", "O","O","X","O","O", "O","X","X","O","X", "X","O","X","X","X"],
    "이서연":  ["X","O","X","O","X", "O","X","O","X","O", "O","X","O","X","O", "O","X","O","X","O"],
    "임채원":  ["O","O","O","O","O", "O","O","X","O","O", "X","X","X","X","X", "O","O","O","O","O"],
    "정유나":  ["O","O","X","O","O", "O","X","O","X","O", "O","X","O","X","O", "O","X","O","X","O"],
    "최지안":  ["O","X","X","O","X", "X","O","X","X","O", "X","X","O","X","X", "X","O","X","O","X"],
    "서율하":  ["O","X","O","X","O", "X","O","X","X","O", "O","X","O","O","X", "X","O","X","O","X"],
    "윤하준":  ["X","O","X","X","O", "O","X","X","O","X", "X","O","X","O","X", "O","X","O","X","X"],
}

TEST2: dict[str, list[str]] = {
    "김민재":  ["O","O","O","O","O", "O","O","O","O","O", "O","O","O","O","O", "O","O","O","X","O"],
    "강시우":  ["O","O","O","O","X", "O","X","O","X","X", "X","O","X","O","X", "X","O","X","X","X"],
    "박현우":  ["O","O","O","O","X", "O","X","O","O","O", "O","X","O","O","O", "O","O","X","O","O"],
    "한도윤":  ["O","O","O","O","O", "O","O","X","O","O", "O","X","X","O","X", "X","O","X","X","X"],
    "이서연":  ["X","O","X","O","X", "O","X","O","X","O", "O","X","O","X","O", "O","X","O","O","O"],
    "임채원":  ["O","O","X","O","O", "O","O","X","O","O", "X","O","X","X","X", "O","O","O","O","O"],
    "정유나":  ["O","O","X","O","O", "O","X","O","X","O", "O","O","O","X","O", "O","O","O","X","O"],
    "최지안":  ["O","X","X","X","X", "X","O","X","X","O", "X","X","O","X","X", "X","O","X","O","X"],
    "서율하":  ["O","X","O","X","O", "X","O","X","X","O", "X","O","X","X","O", "O","X","O","X","O"],
    "윤하준":  ["O","O","X","O","O", "O","X","X","O","X", "X","O","O","X","O", "O","X","O","X","O"],
}

STUDENT_ORDER = [
    "강시우", "한도윤", "임채원", "서율하", "김민재",
    "이서연", "박현우", "최지안", "윤하준", "정유나",
]


def flatten(test_map: dict[str, list[str]], name_to_id: dict[str, str], test_id: str) -> list[dict]:
    out: list[dict] = []
    for name, arr in test_map.items():
        sid = name_to_id[name]
        for idx, ox in enumerate(arr, start=1):
            out.append({
                "student_id": sid,
                "test_id": test_id,
                "question_no": idx,
                "is_correct": ox == "O",
            })
    return out


def main() -> None:
    report: list[str] = []

    with httpx.Client(base_url=BASE, timeout=30.0) as client:
        # 1) Class
        r = client.post("/classes", json={"name": "의대 준비반", "teacher_name": "박성경"})
        r.raise_for_status()
        class_data = r.json()["data"]
        class_row = class_data[0] if isinstance(class_data, list) else class_data
        class_id = class_row["id"]
        report.append(f"[1] class created: status={r.status_code} id={class_id} name={class_row['name']}")

        # 2) Students
        name_to_id: dict[str, str] = {}
        for name in STUDENT_ORDER:
            rr = client.post("/students", json={
                "name": name, "class_id": class_id, "is_attending": True,
            })
            rr.raise_for_status()
            sd = rr.json()["data"]
            row = sd[0] if isinstance(sd, list) else sd
            name_to_id[name] = row["id"]
        report.append(f"[2] students created: 10/10 all 200")

        # 3) Tests
        rt1 = client.post("/tests", json={
            "title": "3월 수학 단원평가", "test_date": "2026-03-15",
            "class_id": class_id, "total_questions": 20,
        })
        rt1.raise_for_status()
        td1 = rt1.json()["data"]
        test1_row = td1[0] if isinstance(td1, list) else td1
        test1_id = test1_row["id"]

        rt2 = client.post("/tests", json={
            "title": "4월 수학 단원평가", "test_date": "2026-04-05",
            "class_id": class_id, "total_questions": 20,
        })
        rt2.raise_for_status()
        td2 = rt2.json()["data"]
        test2_row = td2[0] if isinstance(td2, list) else td2
        test2_id = test2_row["id"]
        report.append(f"[3] tests created: test1={test1_id}, test2={test2_id}")

        # 4-5) Scores batch
        payload1 = flatten(TEST1, name_to_id, test1_id)
        payload2 = flatten(TEST2, name_to_id, test2_id)

        rb1 = client.post("/scores/batch", json=payload1)
        rb1.raise_for_status()
        rb2 = client.post("/scores/batch", json=payload2)
        rb2.raise_for_status()
        report.append(f"[5] batch1 status={rb1.status_code} inserted={len(payload1)}")
        report.append(f"[5] batch2 status={rb2.status_code} inserted={len(payload2)}")

    # Validation
    mk_test1 = sum(1 for v in TEST1["김민재"] if v == "O")
    ks_test1 = sum(1 for v in TEST1["강시우"] if v == "O")
    ks_test2 = sum(1 for v in TEST2["강시우"] if v == "O")

    # Output
    print("=" * 60)
    print("DEMO CLASS SEED — RESULT")
    print("=" * 60)
    for line in report:
        print(line)
    print()
    print(f"CLASS_ID = {class_id}")
    print(f"CLASS_NAME = 의대 준비반")
    print()
    print("STUDENTS (name -> id):")
    for name in STUDENT_ORDER:
        print(f"  {name}: {name_to_id[name]}")
    print()
    print(f"TEST1_ID = {test1_id}  (3월 수학 단원평가)")
    print(f"TEST2_ID = {test2_id}  (4월 수학 단원평가)")
    print()
    print(f"TOTAL SCORES INSERTED: {len(payload1) + len(payload2)} (expected 400)")
    print()
    print("VALIDATION:")
    print(f"  김민재 시험1 정답수: {mk_test1}/20  (expected 18)  -> {'OK' if mk_test1 == 18 else 'FAIL'}")
    print(f"  강시우 시험1 정답수: {ks_test1}/20  (expected 18)  -> {'OK' if ks_test1 == 18 else 'FAIL'}")
    print(f"  강시우 시험2 정답수: {ks_test2}/20  (expected 9)   -> {'OK' if ks_test2 == 9 else 'FAIL'}")


if __name__ == "__main__":
    try:
        main()
    except httpx.HTTPStatusError as e:
        print(f"HTTP ERROR at {e.request.url}: {e.response.status_code} {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
