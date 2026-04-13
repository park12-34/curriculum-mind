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

학생의 시험 이력(최신순):
{history_data}

【핵심 지표 — 이 값을 반드시 존중할 것】
- 최근 정답률(출발점): {latest_accuracy}%
- 직전 시험 대비 변화: {delta_text}
- 추세 판정(백엔드 계산): {trend_hint}

위 데이터를 바탕으로 향후 3주간 성적 변화를 예측하세요.

【필수 규칙】
1. predicted_scores의 "1주 후" 점수는 반드시 출발점 {latest_accuracy}% 근처(±5%p)에서 시작할 것.
2. "2주 후", "3주 후"는 추세({trend_hint})를 반영해 자연스럽게 변화시킬 것.
   - 급상승/상승: 점진적으로 올라감
   - 정체: 출발점 근처 유지
   - 하락/급락: 점진적으로 내려감
3. current_trend는 반드시 추세 판정({trend_hint})과 일치시킬 것.
4. risk_level 판단 기준:
   - "급락" 이거나 최근 정답률이 50% 미만 → "높음"
   - "하락" 또는 "정체" 이면서 60% 미만 → "보통"
   - "상승"/"급상승" 이거나 최근 정답률이 70% 이상 → "낮음"
5. message는 이 학생의 실제 수치(출발점·델타·추세)를 언급하며 구체적 조치를 제안할 것. 일반론 금지.

아래 JSON 형식으로만 응답하세요(숫자는 0~100 정수):
```json
{{
  "current_trend": "급상승" | "상승" | "정체" | "하락" | "급락",
  "predicted_scores": [
    {{"week": "1주 후", "score": <숫자>}},
    {{"week": "2주 후", "score": <숫자>}},
    {{"week": "3주 후", "score": <숫자>}}
  ],
  "risk_level": "높음" | "보통" | "낮음",
  "message": "<구체적 메시지>"
}}
```
"""


def _trend_hint_from_delta(delta: float) -> str:
    if delta >= 15:
        return "급상승"
    if delta >= 5:
        return "상승"
    if delta > -5:
        return "정체"
    if delta > -15:
        return "하락"
    return "급락"


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

    # 최신순 정렬 보장 (test_date 내림차순; None/미정은 뒤로)
    history = sorted(
        history,
        key=lambda h: h.get("test_date") or "",
        reverse=True,
    )

    latest_accuracy = int(round(float(history[0]["accuracy"])))

    # 이력이 1개뿐이면 GPT 호출 없이 안전한 기본값 반환
    if len(history) < 2:
        if latest_accuracy < 50:
            fallback_risk = "높음"
        elif latest_accuracy < 70:
            fallback_risk = "보통"
        else:
            fallback_risk = "낮음"
        return {"success": True, "data": {
            "current_trend": "정체",
            "predicted_scores": [
                {"week": "1주 후", "score": latest_accuracy},
                {"week": "2주 후", "score": latest_accuracy},
                {"week": "3주 후", "score": latest_accuracy},
            ],
            "risk_level": fallback_risk,
            "message": (
                f"시험 이력이 1회뿐이라 추세를 추정할 수 없습니다(현재 정답률 {latest_accuracy}%). "
                "정확한 궤적 예측을 위해 추가 시험 데이터 입력이 필요합니다."
            ),
        }}

    previous_accuracy = int(round(float(history[1]["accuracy"])))
    delta = latest_accuracy - previous_accuracy
    trend_hint = _trend_hint_from_delta(delta)
    delta_text = f"{'+' if delta > 0 else ''}{delta}%p"

    history_lines = [
        f"시험: {h['test_title']}, 날짜: {h.get('test_date', '미정')}, "
        f"정답: {h['correct']}/{h['total']}, 정답률: {h['accuracy']}%"
        for h in history
    ]

    result = await _ask_llm(TRAJECTORY_PROMPT.format(
        history_data="\n".join(history_lines),
        latest_accuracy=latest_accuracy,
        delta_text=delta_text,
        trend_hint=trend_hint,
    ))

    # sanity check: 1주 후 점수가 출발점 ±15%p 벗어나면 전체 예측값을 보정
    scores = result.get("predicted_scores") if isinstance(result, dict) else None
    if isinstance(scores, list) and scores and isinstance(scores[0], dict):
        first = scores[0].get("score")
        if isinstance(first, (int, float)) and abs(first - latest_accuracy) > 15:
            shift = first - latest_accuracy
            for s in scores:
                sc = s.get("score")
                if isinstance(sc, (int, float)):
                    s["score"] = max(0, min(100, int(round(sc - shift))))

    # current_trend가 백엔드 판정과 어긋나면 백엔드 값으로 정정
    if isinstance(result, dict) and result.get("current_trend") != trend_hint:
        result["current_trend"] = trend_hint

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


class CompareRequest(BaseModel):
    student_id: str
    test_ids: list[str]


COMPARE_PROMPT = """\
당신은 교육 데이터 분석 전문가입니다.

아래는 한 학생의 여러 시험에 걸친 성적 데이터입니다:
{summary}

반복 오답 문항(2회 이상 틀린 문항): {repeated}

이 데이터를 바탕으로 시험 간 비교 분석을 수행하세요.
아래 JSON 형식으로 응답하세요:
```json
{{
  "improvement": "시험 간 개선 여부에 대한 상세 분석 (점수 변화, 개선된 영역, 여전히 약한 영역)",
  "concepts": ["여전히 취약한 개념1", "여전히 취약한 개념2", ...]
}}
```
"""


@router.post("/analysis/compare")
async def analyze_compare(body: CompareRequest):
    if len(body.test_ids) < 2:
        raise HTTPException(status_code=400, detail="시험을 2개 이상 선택하세요.")

    # 선택된 시험 정보 조회
    tests = await _supabase_get("/tests", {
        "id": f"in.({','.join(body.test_ids)})",
        "select": "id,title,total_questions,test_date",
        "order": "test_date.asc",
    })
    test_map = {t["id"]: t for t in tests}

    # 해당 학생의 scores 조회
    scores = await _supabase_get("/scores", {
        "student_id": f"eq.{body.student_id}",
        "test_id": f"in.({','.join(body.test_ids)})",
        "select": "test_id,question_no,is_correct",
    })

    # 시험별 정답률 계산
    from collections import defaultdict
    by_test: dict[str, dict] = defaultdict(lambda: {"correct": 0, "total": 0, "wrong_questions": []})
    for sc in scores:
        entry = by_test[sc["test_id"]]
        entry["total"] += 1
        if sc["is_correct"]:
            entry["correct"] += 1
        else:
            entry["wrong_questions"].append(sc["question_no"])

    tests_summary = []
    for t in tests:
        tid = t["id"]
        entry = by_test.get(tid, {"correct": 0, "total": 0})
        total = entry["total"]
        accuracy = round(entry["correct"] / total * 100, 1) if total else 0
        tests_summary.append({
            "title": t["title"],
            "accuracy": accuracy,
            "date": t.get("test_date"),
        })

    # 반복 오답 문항 추출 (2회 이상 틀린 문항번호)
    wrong_count: dict[int, int] = defaultdict(int)
    for entry in by_test.values():
        for qno in entry["wrong_questions"]:
            wrong_count[qno] += 1
    repeated_wrong = sorted([f"{qno}번 문항 ({cnt}회 오답)" for qno, cnt in wrong_count.items() if cnt >= 2])

    # GPT 분석
    summary_lines = []
    for ts in tests_summary:
        summary_lines.append(f"시험: {ts['title']}, 날짜: {ts.get('date', '미정')}, 정답률: {ts['accuracy']}%")

    llm_result = await _ask_llm(COMPARE_PROMPT.format(
        summary="\n".join(summary_lines),
        repeated=", ".join(repeated_wrong) if repeated_wrong else "없음",
    ))

    return {"success": True, "data": {
        "tests_summary": tests_summary,
        "repeated_wrong": repeated_wrong,
        "improvement": llm_result.get("improvement", ""),
        "concepts": llm_result.get("concepts", []),
    }}


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
