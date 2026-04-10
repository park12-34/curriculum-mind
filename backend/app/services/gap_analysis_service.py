import json

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.utils.json_utils import parse_llm_json
from app.services.rag_service import get_rag_service

TOPIC_EXTRACTION_PROMPT = """다음 평가/시험 텍스트에서 핵심 학습 토픽을 JSON 배열로 추출하세요.
각 토픽은 간결한 문자열이어야 합니다.

평가 텍스트:
{assessment_text}

JSON 배열만 반환하세요. 예: ["토픽1", "토픽2", ...]"""

GAP_ANALYSIS_PROMPT = """당신은 교육과정 분석 전문가입니다.

아래 정보를 바탕으로 학습 갭 분석을 수행하세요:

**토픽**: {topic}
**커리큘럼에서 관련 내용**:
{curriculum_context}

**평가에서의 요구 수준**: 해당 토픽이 평가에 포함됨

다음 JSON 형식으로 분석 결과를 반환하세요:
{{
  "taught_level": "커리큘럼에서 다뤄진 수준 (상/중/하/없음)",
  "assessed_level": "평가에서 요구하는 수준 (상/중/하)",
  "gap_description": "갭에 대한 구체적 설명 (한국어)"
}}

JSON만 반환하세요."""

RECOMMENDATIONS_PROMPT = """다음 학습 갭 분석 결과를 바탕으로, 교강사에게 실행 가능한 개선 권고사항 3~5개를 JSON 배열로 제시하세요.

갭 분석:
{gaps_json}

각 권고사항은 구체적이고 실행 가능한 한국어 문장이어야 합니다.
JSON 배열만 반환하세요. 예: ["권고1", "권고2", ...]"""


STUDENT_ANALYSIS_PROMPT = """당신은 교육과정 분석 전문가입니다.

아래는 시험지 내용과 한 학생의 문항별 O/X 데이터입니다.

**시험지 내용** (문항 포함):
{pdf_text}

**학생**: {student_name}
**시험**: {test_title} ({total_questions}문항)
**O/X 결과** (문항번호: O/X):
{ox_data}
**정답률**: {accuracy}%

이 학생의 오답 문항을 시험지 내용과 교차 분석하여 아래 JSON 형식으로 응답하세요:
```json
{{
  "weak_concepts": ["취약 개념1", "취약 개념2"],
  "exam_strategy": "기말고사 대비 맞춤 전략 (구체적으로)"
}}
```"""


async def analyze_gap_with_scores(
    pdf_text: str,
    test_info: dict,
    students: list[dict],
    scores: list[dict],
) -> dict:
    """시험지 PDF + O/X 데이터를 교차 분석하여 학생별 취약점을 진단한다."""
    settings = get_settings()
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0,
    )

    # 학생별 O/X 집계
    from collections import defaultdict
    student_scores = defaultdict(dict)
    for sc in scores:
        student_scores[sc["student_id"]][sc["question_no"]] = sc["is_correct"]

    student_map = {s["id"]: s["name"] for s in students}
    total_q = test_info["total_questions"]

    results = []
    for sid, name in student_map.items():
        ox = student_scores.get(sid, {})
        if not ox:
            results.append({
                "student_id": sid,
                "student_name": name,
                "accuracy": 0,
                "weak_concepts": [],
                "exam_strategy": "데이터 없음",
            })
            continue

        correct = sum(1 for v in ox.values() if v)
        accuracy = round(correct / max(len(ox), 1) * 100, 1)
        ox_lines = ", ".join(
            f"{q}:{'O' if ox.get(q, False) else 'X'}" for q in range(1, total_q + 1)
        )

        response = await llm.ainvoke(
            STUDENT_ANALYSIS_PROMPT.format(
                pdf_text=pdf_text[:4000],
                student_name=name,
                test_title=test_info["title"],
                total_questions=total_q,
                ox_data=ox_lines,
                accuracy=accuracy,
            )
        )
        analysis = parse_llm_json(response.content)
        results.append({
            "student_id": sid,
            "student_name": name,
            "accuracy": accuracy,
            "weak_concepts": analysis.get("weak_concepts", []),
            "exam_strategy": analysis.get("exam_strategy", ""),
        })

    # 반 평균
    accuracies = [r["accuracy"] for r in results if r["accuracy"] > 0]
    class_avg = round(sum(accuracies) / max(len(accuracies), 1), 1)

    return {
        "test_title": test_info["title"],
        "class_average": class_avg,
        "students": results,
    }


async def analyze_gap(curriculum_text: str, assessment_text: str) -> dict:
    """커리큘럼과 평가 데이터 사이의 학습 갭을 분석한다."""
    settings = get_settings()
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0,
    )
    rag = get_rag_service()

    # 1) 커리큘럼 텍스트를 RAG에 저장
    await rag.store_document(curriculum_text, metadata={"type": "curriculum"})

    # 2) 평가 텍스트에서 토픽 추출
    topics_response = await llm.ainvoke(
        TOPIC_EXTRACTION_PROMPT.format(assessment_text=assessment_text[:3000])
    )
    topics = parse_llm_json(topics_response.content)

    # 3) 토픽별 갭 분석
    gaps = []
    for topic in topics:
        context_docs = await rag.search(topic, top_k=3)
        context = "\n".join(doc["content"] for doc in context_docs)

        gap_response = await llm.ainvoke(
            GAP_ANALYSIS_PROMPT.format(topic=topic, curriculum_context=context or "관련 내용 없음")
        )
        gap_data = parse_llm_json(gap_response.content)
        gaps.append({"topic": topic, **gap_data})

    # 4) 커버리지 점수 계산
    covered = sum(1 for g in gaps if g["taught_level"] in ("상", "중"))
    coverage_score = round(covered / max(len(gaps), 1) * 100, 1)

    # 5) 권고사항 생성
    recs_response = await llm.ainvoke(
        RECOMMENDATIONS_PROMPT.format(gaps_json=json.dumps(gaps, ensure_ascii=False))
    )
    recommendations = parse_llm_json(recs_response.content)

    return {
        "gaps": gaps,
        "coverage_score": coverage_score,
        "recommendations": recommendations,
    }
