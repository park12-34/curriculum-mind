---
name: Python 3.14 호환성 제약
description: Python 3.14 환경에서 supabase SDK 빌드 실패 → httpx 직접 호출로 대체. 버전 핀 대신 >= 사용.
type: feedback
---

Python 3.14 환경에서 프리빌트 휠이 없는 패키지가 많아 빌드 실패함.

**Why:** supabase SDK가 pyiceberg 등 무거운 의존성을 끌어오고, pydantic-core 등이 Rust 빌드를 시도하다 실패.

**How to apply:**
- requirements.txt에서 `==` 핀 대신 `>=` 최소 버전 제약 사용
- supabase SDK 대신 httpx로 Supabase REST API 직접 호출 (rag_service.py)
- langchain.text_splitter → langchain_text_splitters 모듈로 import
- Pydantic V1 경고는 langchain 내부 이슈로 무시 가능
