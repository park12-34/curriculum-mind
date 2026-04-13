# AI 협업 문서

본 디렉토리는 CurriculumMind 개발 과정에서 Claude(Anthropic)와 협업하며
생성된 컨텍스트·기획·결정 문서들을 포함합니다.

## 파일 구성

- **PROJECT_OVERVIEW.md** — 프로젝트 전반 개요, 핵심 기능, 진행 상태, 일정 관리
- **MEMORY.md** — AI 협업 메모리 인덱스 (타 문서로 링크)
- **feedback_python314.md** — Python 3.14 환경에서 발생한 패키지 호환성 이슈와 해결
- **feedback_write_tool_encoding.md** — AI 도구의 한글 CSV 인코딩 이슈와 우회 방법

## 협업 방식

본 프로젝트는 Claude Code(Anthropic의 CLI 에이전트)를 페어 프로그래밍 파트너로
활용하여 기획 · 설계 · 구현 · QA · 리팩토링 전 과정을 협업으로 진행했습니다.

AI는 다음 영역에 기여했습니다:

- FastAPI + Supabase REST 백엔드 구조 설계 (Python 3.14 호환성 대응 포함)
- React + TailwindCSS 프론트엔드 8개 페이지 구현
- GPT-4o 기반 AI 분석 파이프라인 4종 (오답 패턴 · 궤적 예측 · 코칭 · 시험 간 비교)
- 학습 궤적 예측 프롬프트 개선 (백엔드 델타 계산 + sanity check 2단)
- 디자인 시스템 (Luxury Minimal, 딥 네이비 + 골드)
- 데모반 시드 데이터 구축 및 DB 무결성 검증

## 심사 안내

심사 위원께서는 이 문서들을 통해 본 프로젝트가 AI와 어떻게 협업하여
빌딩되었는지, 그리고 개발 과정에서 발견된 제약과 의사결정이 어떻게
문서화되었는지 확인하실 수 있습니다.
