import json

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.utils.json_utils import parse_llm_json
from app.models.schemas import OptimizeRequest

OPTIMIZER_PROMPT = """당신은 교육과정 설계 전문가입니다.

아래 학습 갭 분석 결과를 바탕으로, 최적화된 수업 계획을 설계하세요.

**학습 갭**:
{gaps_json}

**현재 커버리지 점수**: {coverage_score}%
**총 수업 시간**: {total_hours}시간
{priorities_section}

다음 JSON 형식으로 반환하세요:
{{
  "sessions": [
    {{
      "session_number": 1,
      "topic": "수업 주제",
      "objectives": ["학습목표1", "학습목표2"],
      "hours": 2.0,
      "teaching_method": "강의/실습/토론/프로젝트 중 선택"
    }}
  ],
  "focus_areas": ["중점 보강 영역1", "중점 보강 영역2"],
  "estimated_improvement": 85.0
}}

설계 원칙:
1. 갭이 큰 토픽(taught_level이 '하' 또는 '없음')에 더 많은 시간 배분
2. 총 시간이 {total_hours}시간을 초과하지 않도록
3. 실습과 이론의 균형 (최소 30% 실습)
4. estimated_improvement는 최적화 후 예상 커버리지 점수

JSON만 반환하세요."""


async def optimize_curriculum(request: OptimizeRequest) -> dict:
    """갭 분석 결과를 바탕으로 최적화된 커리큘럼을 생성한다."""
    settings = get_settings()
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0.3,
    )

    gaps_data = [g.model_dump() for g in request.gaps]

    priorities_section = ""
    if request.priorities:
        priorities_section = f"**우선순위 토픽**: {', '.join(request.priorities)}"

    response = await llm.ainvoke(
        OPTIMIZER_PROMPT.format(
            gaps_json=json.dumps(gaps_data, ensure_ascii=False, indent=2),
            coverage_score=request.coverage_score,
            total_hours=request.total_hours,
            priorities_section=priorities_section,
        )
    )

    return parse_llm_json(response.content)
