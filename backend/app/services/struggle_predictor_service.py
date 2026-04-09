import json
import logging

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.utils.json_utils import parse_llm_json
from app.models.schemas import PredictRequest, QuizRecord

logger = logging.getLogger(__name__)

STRUGGLE_ANALYSIS_PROMPT = """당신은 학습 분석 전문가입니다.

아래 학생들의 퀴즈 성적 데이터를 분석하여, 낙오 위험이 있는 학생을 식별하세요.

**학생 데이터**:
{students_json}

**기준 점수**: {threshold}점

각 학생에 대해 다음 JSON 배열로 반환하세요:
[
  {{
    "student_id": "학생 ID",
    "student_name": "학생 이름",
    "risk_level": "high/medium/low",
    "factors": ["위험 요인 1", "위험 요인 2"]
  }}
]

판단 기준:
- high: 평균 {threshold}점 미만 또는 점수 하락 추세가 뚜렷함
- medium: 평균이 기준 근처이거나 출석률 낮음
- low: 양호

JSON 배열만 반환하세요."""


def _compute_trend(scores: list[float]) -> str:
    if len(scores) < 2:
        return "stable"
    first_half = sum(scores[: len(scores) // 2]) / max(len(scores) // 2, 1)
    second_half = sum(scores[len(scores) // 2 :]) / max(len(scores) - len(scores) // 2, 1)
    diff = second_half - first_half
    if diff < -5:
        return "declining"
    if diff > 5:
        return "improving"
    return "stable"


def _compute_avg(scores: list[float]) -> float:
    return round(sum(scores) / max(len(scores), 1), 1)


def _build_student_summary(record: QuizRecord) -> dict:
    return {
        "student_id": record.student_id,
        "student_name": record.student_name,
        "scores": record.scores,
        "avg_score": _compute_avg(record.scores),
        "attendance_rate": record.attendance_rate,
        "trend": _compute_trend(record.scores),
    }


def _classify_risk(summary: dict, threshold: float) -> dict:
    """통계 기반 위험도 분류 (LLM fallback용)."""
    factors = []
    avg = summary["avg_score"]
    trend = summary["trend"]
    attendance = summary["attendance_rate"]

    if avg < threshold:
        factors.append(f"평균 점수 {avg}점으로 기준({threshold}점) 미만")
    if trend == "declining":
        factors.append("점수 하락 추세")
    if attendance < 0.7:
        factors.append(f"출석률 {attendance * 100:.0f}%로 저조")

    if avg < threshold or (trend == "declining" and avg < threshold + 10):
        risk_level = "high"
    elif avg < threshold + 10 or attendance < 0.75 or trend == "declining":
        risk_level = "medium"
    else:
        risk_level = "low"
        factors.append("양호")

    return {"risk_level": risk_level, "factors": factors}


async def predict_struggles(request: PredictRequest) -> dict:
    """퀴즈 패턴을 분석하여 낙오 위험 학생을 예측한다."""
    settings = get_settings()

    summaries = [_build_student_summary(r) for r in request.quiz_records]
    all_scores = [s for r in request.quiz_records for s in r.scores]
    class_avg = round(sum(all_scores) / max(len(all_scores), 1), 1)

    # LLM 호출 시도, 실패 시 통계 기반 fallback
    llm_results = None
    try:
        llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0,
        )
        response = await llm.ainvoke(
            STRUGGLE_ANALYSIS_PROMPT.format(
                students_json=json.dumps(summaries, ensure_ascii=False, indent=2),
                threshold=request.threshold,
            )
        )
        llm_results = parse_llm_json(response.content)
    except Exception as e:
        logger.warning("LLM 호출 실패, 통계 기반 분석으로 전환: %s", e)

    at_risk_students = []
    risk_counts = {"high": 0, "medium": 0, "low": 0}

    if llm_results:
        summary_map = {s["student_id"]: s for s in summaries}
        for item in llm_results:
            sid = item["student_id"]
            s = summary_map.get(sid, {})
            risk_level = item.get("risk_level", "low")
            risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
            at_risk_students.append({
                "student_id": sid,
                "student_name": item.get("student_name", s.get("student_name", "")),
                "risk_level": risk_level,
                "avg_score": s.get("avg_score", 0),
                "trend": s.get("trend", "stable"),
                "factors": item.get("factors", []),
            })
    else:
        for s in summaries:
            classification = _classify_risk(s, request.threshold)
            risk_level = classification["risk_level"]
            risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
            at_risk_students.append({
                "student_id": s["student_id"],
                "student_name": s["student_name"],
                "risk_level": risk_level,
                "avg_score": s["avg_score"],
                "trend": s["trend"],
                "factors": classification["factors"],
            })

    at_risk_students.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x["risk_level"], 3))

    return {
        "at_risk_students": at_risk_students,
        "class_avg": class_avg,
        "risk_summary": risk_counts,
    }
