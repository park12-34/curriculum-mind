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

class ClassCreate(BaseModel):
    name: str
    teacher_name: str | None = None


class ClassUpdate(BaseModel):
    name: str | None = None
    teacher_name: str | None = None


class StudentCreate(BaseModel):
    name: str
    class_id: str
    birth_date: str | None = None
    school_name: str | None = None
    enrolled_at: str | None = None
    is_attending: bool = False
    subjects: list[str] | None = None


class StudentUpdate(BaseModel):
    name: str | None = None
    class_id: str | None = None
    birth_date: str | None = None
    school_name: str | None = None
    enrolled_at: str | None = None
    is_attending: bool | None = None
    subjects: list[str] | None = None


class TestCreate(BaseModel):
    title: str
    test_date: str | None = None
    class_id: str
    total_questions: int


class ScoreItem(BaseModel):
    student_id: str
    test_id: str
    question_no: int
    is_correct: bool


# ── Classes ───────────────────────────────────────────────

@router.get("/classes")
async def list_classes():
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/classes",
            headers=_HEADERS,
            params={"order": "created_at.desc"},
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


@router.post("/classes")
async def create_class(body: ClassCreate):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/classes",
            headers=_HEADERS,
            json=body.model_dump(exclude_none=True),
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


@router.put("/classes/{class_id}")
async def update_class(class_id: str, body: ClassUpdate):
    payload = body.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_BASE}/classes",
            headers={**_HEADERS, "Prefer": "return=representation"},
            params={"id": f"eq.{class_id}"},
            json=payload,
        )
        resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"success": True, "data": rows[0]}


@router.get("/classes/{class_id}/students")
async def list_students_by_class(class_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/students",
            headers=_HEADERS,
            params={"class_id": f"eq.{class_id}", "order": "name.asc"},
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


@router.get("/classes/{class_id}/tests")
async def list_tests_by_class(class_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/tests",
            headers=_HEADERS,
            params={"class_id": f"eq.{class_id}", "order": "test_date.desc"},
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


# ── Students ──────────────────────────────────────────────

@router.get("/students/{student_id}")
async def get_student(student_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/students",
            headers=_HEADERS,
            params={"id": f"eq.{student_id}"},
        )
        resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"success": True, "data": rows[0]}


@router.post("/students")
async def create_student(body: StudentCreate):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/students",
            headers=_HEADERS,
            json=body.model_dump(exclude_none=True),
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


@router.put("/students/{student_id}")
async def update_student(student_id: str, body: StudentUpdate):
    payload = body.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_BASE}/students",
            headers={**_HEADERS, "Prefer": "return=representation"},
            params={"id": f"eq.{student_id}"},
            json=payload,
        )
        resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"success": True, "data": rows[0]}


@router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{_BASE}/students",
            headers=_HEADERS,
            params={"id": f"eq.{student_id}"},
        )
        resp.raise_for_status()
    return {"success": True, "data": None}


@router.get("/students/{student_id}/history")
async def get_student_history(student_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/rpc/get_student_history",
            headers=_HEADERS,
            json={"p_student_id": student_id},
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


# ── Tests ─────────────────────────────────────────────────

@router.post("/tests")
async def create_test(body: TestCreate):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/tests",
            headers=_HEADERS,
            json=body.model_dump(exclude_none=True),
        )
        resp.raise_for_status()
    return {"success": True, "data": resp.json()}


@router.get("/tests/{test_id}")
async def get_test(test_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/tests",
            headers=_HEADERS,
            params={"id": f"eq.{test_id}"},
        )
        resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"success": True, "data": rows[0]}


# ── Scores ────────────────────────────────────────────────

@router.get("/tests/{test_id}/scores")
async def get_scores_by_test(test_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_BASE}/scores",
            headers=_HEADERS,
            params={
                "test_id": f"eq.{test_id}",
                "select": "student_id,question_no,is_correct",
                "order": "student_id.asc,question_no.asc",
            },
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"success": True, "data": resp.json()}


@router.post("/scores/batch")
async def batch_create_scores(items: list[ScoreItem]):
    rows = [item.model_dump() for item in items]
    headers = {**_HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/scores",
            headers=headers,
            params={"on_conflict": "student_id,test_id,question_no"},
            json=rows,
        )
        if resp.status_code >= 400:
            detail = resp.text
            raise HTTPException(status_code=resp.status_code, detail=detail)
    return {"success": True, "data": {"inserted": len(rows)}}
