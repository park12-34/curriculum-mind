import json
import re


def parse_llm_json(text: str):
    """LLM 응답에서 JSON을 추출하여 파싱한다.

    마크다운 코드블록(```json ... ```)으로 감싸진 경우도 처리.
    """
    stripped = text.strip()

    # ```json ... ``` 또는 ``` ... ``` 블록 제거
    match = re.search(r"```(?:json)?\s*\n?(.*?)```", stripped, re.DOTALL)
    if match:
        stripped = match.group(1).strip()

    return json.loads(stripped)
