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
