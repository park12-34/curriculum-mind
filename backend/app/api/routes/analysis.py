from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.utils.json_utils import parse_llm_json

router = APIRouter()

settings = get_settings()
_BASE = f"{settings.SUPABASE_URL}/rest/v1"
_HEADERS = {
    "apikey": settings.SUPABASE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
    "Content-Type": "application/json",
}

llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    openai_api_key=settings.OPENAI_API_KEY,
    temperature=0,
)


# ── Helpers ───────────────────────────────────────────────

async def _supabase_get(path: str, params: dict | None = None) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{_BASE}{path}", headers=_HEADERS, params=params or {})
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


async def _supabase_rpc(fn: str, payload: dict) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/rpc/{fn}", headers=_HEADERS, json=payload,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


async def _ask_llm(prompt: str) -> dict:
    response = await llm.ainvoke(prompt)
    return parse_llm_json(response.content)


# ── 1. 오답 패턴 분석 ────────────────────────────────────

PATTERN_PROMPT = """\
당신은 교육 데이터 분석 전문가입니다.

아래는 한 학생의 시험별 오답 데이터입니다:
{wrong_data}

이 학생의 오답 패턴을 분석하여 아래 JSON 형식으로 응답하세요:
```json
{{
  "weak_concepts": ["취약 개념1", "취약 개념2", ...],
  "root_cause": "반복 오답의 근본 원인 분석",
  "recommendation": "구체적인 학습 개선 방안"
}}
```
"""


@router.post("/analysis/pattern/{student_id}")
async def analyze_pattern(student_id: str):
    # 학생의 모든 오답 조회
    scores = await _supabase_get("/scores", {
        "student_id": f"eq.{student_id}",
        "is_correct": "eq.false",
        "select": "test_id,question_no,is_correct",
        "order": "test_id.asc,question_no.asc",
    })
    if not scores:
        return {"success": True, "data": {
            "weak_concepts": [],
            "root_cause": "오답 데이터가 없습니다.",
            "recommendation": "시험 데이터를 먼저 입력해주세요.",
        }}

    # 시험 정보 보강
    test_ids = list({s["test_id"] for s in scores})
    tests = await _supabase_get("/tests", {
        "id": f"in.({','.join(test_ids)})",
        "select": "id,title,total_questions",
    })
    test_map = {t["id"]: t for t in tests}

    wrong_summary = []
    for s in scores:
        t = test_map.get(s["test_id"], {})
        wrong_summary.append(
            f"시험: {t.get('title', '?')}, 문항 {s['question_no']}/{t.get('total_questions', '?')}"
        )

    result = await _ask_llm(PATTERN_PROMPT.format(wrong_data="\n".join(wrong_summary)))
    return {"success": True, "data": result}


# ── 2. 성적 궤적 예측 ────────────────────────────────────

TRAJECTORY_PROMPT = """\
당신은 교육 데이터 과학자입니다.

아래는 한 학생의 시험 이력(최신순)입니다:
{history_data}

이 데이터를 바탕으로 향후 3주간 성적 변화를 예측하세요.
아래 JSON 형식으로 응답하세요:
```json
{{
  "current_trend": "상승" | "하락" | "정체",
  "predicted_scores": [
    {{"week": "1주 후", "score": 75}},
    {{"week": "2주 후", "score": 78}},
    {{"week": "3주 후", "score": 80}}
  ],
  "risk_level": "높음" | "보통" | "낮음",
  "message": "교사에게 전달할 종합 메시지"
}}
```
"""


@router.post("/analysis/trajectory/{student_id}")
async def analyze_trajectory(student_id: str):
    history = await _supabase_rpc("get_student_history", {"p_student_id": student_id})
    if not history:
        return {"success": True, "data": {
            "current_trend": "데이터 없음",
            "predicted_scores": [],
            "risk_level": "알 수 없음",
            "message": "시험 이력이 없습니다. 데이터를 먼저 입력해주세요.",
        }}

    history_lines = [
        f"시험: {h['test_title']}, 날짜: {h.get('test_date', '미정')}, "
        f"정답: {h['correct']}/{h['total']}, 정답률: {h['accuracy']}%"
        for h in history
    ]

    result = await _ask_llm(TRAJECTORY_PROMPT.format(history_data="\n".join(history_lines)))
    return {"success": True, "data": result}


# ── 3. AI 코칭 어시스턴트 ────────────────────────────────

COACH_PROMPT = """\
당신은 교사를 돕는 AI 코칭 어시스턴트입니다.

아래는 해당 반의 학생별 시험 성적 데이터입니다:
{class_data}

교사의 질문: {question}

위 데이터를 근거로 구체적이고 실용적인 답변을 해주세요.
아래 JSON 형식으로 응답하세요:
```json
{{
  "answer": "교사 질문에 대한 상세한 답변",
  "data_used": "답변 근거로 사용한 데이터 요약"
}}
```
"""


class CoachRequest(BaseModel):
    question: str
    class_id: str


@router.post("/analysis/coach")
async def ai_coach(body: CoachRequest):
    # 반 학생 조회
    students = await _supabase_get("/students", {
        "class_id": f"eq.{body.class_id}",
        "select": "id,name",
    })
    if not students:
        raise HTTPException(status_code=404, detail="해당 반에 학생이 없습니다.")

    # 반 시험 조회
    tests = await _supabase_get("/tests", {
        "class_id": f"eq.{body.class_id}",
        "select": "id,title,total_questions,test_date",
        "order": "test_date.desc",
    })

    # 학생별 시험 성적 집계
    student_ids = [s["id"] for s in students]
    scores = await _supabase_get("/scores", {
        "student_id": f"in.({','.join(student_ids)})",
        "select": "student_id,test_id,question_no,is_correct",
    })

    student_map = {s["id"]: s["name"] for s in students}
    test_map = {t["id"]: t for t in tests}

    # 학생×시험별 정답률 계산
    from collections import defaultdict
    agg = defaultdict(lambda: {"correct": 0, "total": 0})
    for sc in scores:
        key = (sc["student_id"], sc["test_id"])
        agg[key]["total"] += 1
        if sc["is_correct"]:
            agg[key]["correct"] += 1

    lines = []
    for (sid, tid), v in sorted(agg.items()):
        name = student_map.get(sid, "?")
        t = test_map.get(tid, {})
        pct = round(v["correct"] / v["total"] * 100, 1) if v["total"] else 0
        lines.append(
            f"{name} | {t.get('title', '?')} ({t.get('test_date', '미정')}) | "
            f"{v['correct']}/{v['total']} ({pct}%)"
        )

    class_data = "\n".join(lines) if lines else "성적 데이터가 없습니다."
    result = await _ask_llm(COACH_PROMPT.format(class_data=class_data, question=body.question))
    return {"success": True, "data": result}
