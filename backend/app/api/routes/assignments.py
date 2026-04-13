from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from app.core.config import get_settings

router = APIRouter()

settings = get_settings()
_BASE = f"{settings.SUPABASE_URL}/rest/v1"
_HEADERS = {
    "apikey": settings.SUPABASE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


# ── Pydantic Models ──────────────────────────────────────

class AssignmentCreate(BaseModel):
    class_id: str
    title: str
    description: str | None = None
    due_date: str | None = None


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = None


class SubmissionItem(BaseModel):
    student_id: str
    is_completed: bool


# ── Assignments ──────────────────────────────────────────

@router.get("/classes/{class_id}/assignments")
async def list_assignments_by_class(class_id: str):
    """반의 숙제 목록. 각 항목에 completion_rate 포함."""
    async with httpx.AsyncClient() as client:
        # 숙제 목록
        assignments_resp = await client.get(
            f"{_BASE}/assignments",
            headers=_HEADERS,
            params={"class_id": f"eq.{class_id}", "order": "due_date.desc,created_at.desc"},
        )
        assignments_resp.raise_for_status()
        assignments = assignments_resp.json()

        # 반 학생 수
        students_resp = await client.get(
            f"{_BASE}/students",
            headers=_HEADERS,
            params={"class_id": f"eq.{class_id}", "select": "id"},
        )
        students_resp.raise_for_status()
        student_count = len(students_resp.json())

        if not assignments or student_count == 0:
            return {
                "success": True,
                "data": [{**a, "completion_rate": 0, "completed_count": 0, "total_students": student_count} for a in assignments],
            }

        # 각 숙제의 완료 수
        assignment_ids = [a["id"] for a in assignments]
        id_filter = "in.(" + ",".join(assignment_ids) + ")"
        subs_resp = await client.get(
            f"{_BASE}/assignment_submissions",
            headers=_HEADERS,
            params={
                "assignment_id": id_filter,
                "is_completed": "eq.true",
                "select": "assignment_id",
            },
        )
        subs_resp.raise_for_status()
        completed = subs_resp.json()

    completed_by_assignment: dict[str, int] = {}
    for row in completed:
        aid = row["assignment_id"]
        completed_by_assignment[aid] = completed_by_assignment.get(aid, 0) + 1

    result = []
    for a in assignments:
        done = completed_by_assignment.get(a["id"], 0)
        rate = round(done / student_count * 100) if student_count else 0
        result.append({
            **a,
            "completion_rate": rate,
            "completed_count": done,
            "total_students": student_count,
        })

    return {"success": True, "data": result}


@router.post("/assignments")
async def create_assignment(body: AssignmentCreate):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/assignments",
            headers=_HEADERS,
            json=body.model_dump(exclude_none=True),
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    rows = resp.json()
    return {"success": True, "data": rows[0] if rows else None}


@router.put("/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, body: AssignmentUpdate):
    payload = body.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_BASE}/assignments",
            headers=_HEADERS,
            params={"id": f"eq.{assignment_id}"},
            json=payload,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True, "data": rows[0]}


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{_BASE}/assignments",
            headers=_HEADERS,
            params={"id": f"eq.{assignment_id}"},
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"success": True, "data": None}


@router.get("/assignments/{assignment_id}/submissions")
async def list_assignment_submissions(assignment_id: str):
    """숙제의 submissions. 반 학생 전원이 행으로 나오게 LEFT JOIN."""
    async with httpx.AsyncClient() as client:
        # 숙제 정보로 class_id 조회
        a_resp = await client.get(
            f"{_BASE}/assignments",
            headers=_HEADERS,
            params={"id": f"eq.{assignment_id}", "select": "id,class_id,title,due_date"},
        )
        a_resp.raise_for_status()
        a_rows = a_resp.json()
        if not a_rows:
            raise HTTPException(status_code=404, detail="Assignment not found")
        assignment = a_rows[0]
        class_id = assignment["class_id"]

        # 반 학생
        students_resp = await client.get(
            f"{_BASE}/students",
            headers=_HEADERS,
            params={"class_id": f"eq.{class_id}", "select": "id,name", "order": "name.asc"},
        )
        students_resp.raise_for_status()
        students = students_resp.json()

        # 기존 submissions
        subs_resp = await client.get(
            f"{_BASE}/assignment_submissions",
            headers=_HEADERS,
            params={
                "assignment_id": f"eq.{assignment_id}",
                "select": "student_id,is_completed,completed_at",
            },
        )
        subs_resp.raise_for_status()
        subs = subs_resp.json()

    subs_by_student = {s["student_id"]: s for s in subs}
    rows = []
    for st in students:
        sub = subs_by_student.get(st["id"])
        rows.append({
            "student_id": st["id"],
            "student_name": st["name"],
            "is_completed": sub["is_completed"] if sub else False,
            "completed_at": sub.get("completed_at") if sub else None,
        })

    return {
        "success": True,
        "data": {
            "assignment": assignment,
            "submissions": rows,
        },
    }


@router.post("/assignments/{assignment_id}/submissions/batch")
async def batch_save_submissions(assignment_id: str, items: list[SubmissionItem]):
    """upsert submissions (UNIQUE (assignment_id, student_id))."""
    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    rows = []
    for it in items:
        rows.append({
            "assignment_id": assignment_id,
            "student_id": it.student_id,
            "is_completed": it.is_completed,
            "completed_at": now_iso if it.is_completed else None,
        })

    if not rows:
        return {"success": True, "data": {"upserted": 0}}

    headers = {**_HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/assignment_submissions",
            headers=headers,
            params={"on_conflict": "assignment_id,student_id"},
            json=rows,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

    return {"success": True, "data": {"upserted": len(rows)}}
