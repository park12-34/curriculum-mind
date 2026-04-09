## 완료 (Day 1~3)
- 폴더 구조 생성
- CLAUDE.md 작성
- Supabase pgvector DB 초기화
- FastAPI 백엔드 세팅
- /api/analyze, /api/predict, /api/optimize 3개 엔드포인트
- parse_llm_json 유틸 (마크다운 블록 파싱 문제 해결)
- mock 데이터 4개 파일 생성
- OpenAI API 연동 확인 (gpt-4o-mini)
- React 프론트엔드 3개 페이지 동작 확인
  - Struggle Predictor: 차트 + 테이블 정상
  - Curriculum Optimizer: UI 정상
  - Gap Analysis: UI 완성 (실제 파일 E2E 테스트 미완)

## 미완료 (Day 4~)
- Gap Analysis 실제 PDF + CSV E2E 테스트
- 데모 임팩트용 UI 개선 (히트맵, 색상, 레이아웃)
- Vercel + Railway 배포
- AI 리포트 작성
- GitHub public 설정 + README 작성
- 제출 서류 (동의서, 각서)

## 환경
- 터미널 3개 운영:
  1. Claude Code (개발 작업)
  2. python -m uvicorn app.main:app --reload --port 8000 (백엔드)
  3. npm run dev (프론트엔드, frontend 폴더)
- Python 3.14 환경
- lru_cache로 인해 .env 변경 시 서버 완전 재시작 필요

## 마감
2026-04-13
