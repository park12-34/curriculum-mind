# CurriculumMind — CLAUDE.md

## 프로젝트 컨텍스트
- 공모전 마감: 2026-04-13
- 핵심 슬로건: "가르친 것과 배운 것 사이의 간격을 AI가 찾는다"
- 타겟: 교강사

## 핵심 기능 (우선순위 순)
1. Learning Gap Report — PDF + CSV → 학습 갭 분석
2. Struggle Predictor   — 퀴즈 패턴 → 낙오 위험 학생 예측
3. Curriculum Optimizer — 갭 리포트 → 다음 수업 재구성

## 기술 스택
- Backend : FastAPI (Python 3.11)
- Frontend: React + Recharts + TailwindCSS
- AI      : GPT-4o + LangChain + RAG
- DB      : Supabase (pgvector + PostgreSQL)
- 배포    : Vercel (FE) + Railway (BE)

## 폴더 구조
backend/app/
├── api/routes/   # FastAPI 라우터
├── core/         # config, 설정
├── services/     # 비즈니스 로직 (AI 파이프라인)
├── models/        # Pydantic 모델
└── utils/        # 공통 유틸

## 코딩 규칙
- 환경변수는 반드시 core/config.py 를 통해서만 접근
- 개발 중: LLM_MODEL=gpt-4o-mini
- 데모 시: LLM_MODEL=gpt-4o
- API 응답 형식: { "success": bool, "data": {} }
- 모든 에러는 HTTPException으로 처리

## 개발 일정
- Day 1 (04/08): FastAPI 세팅 + PDF 파싱 + RAG 파이프라인
- Day 2 (04/09): Gap Analysis API + Struggle Predictor API
- Day 3 (04/10): React UI 기본 구조 + API 연동
- Day 4 (04/11): UI 완성 + E2E 테스트
- Day 5 (04/12): Vercel + Railway 배포
- Day 6 (04/13): AI 리포트 + 제출

## 우선순위 원칙
1. Feature 1 완성 후 Feature 2, Feature 3 순서로
2. 기능 추가보다 완성도 우선
3. 04/11까지 모든 기능 로컬 완성 필수

## Session Status (Day 4 — 04/09 진행)

### Day 1~3 완료
- [x] backend/ 초기 세팅 + PDF 파싱 + RAG 파이프라인
- [x] Gap Analysis API + Struggle Predictor API + Curriculum Optimizer API
- [x] React UI 기본 구조 (AnalyzePage, PredictPage, OptimizePage) + API 연동 + Recharts

### Day 4 완료
- [x] 랜딩 페이지 (LandingPage.jsx) — hero.png 활용, 슬로건, 3개 기능 카드, CTA 버튼
- [x] Spinner 공통 컴포넌트 — 로딩 상태 표시 (3개 페이지 적용)
- [x] Footer 공통 컴포넌트 — 프로젝트 정보
- [x] Layout 개선 — sticky 헤더, 모바일 햄버거 메뉴, 홈 로고 링크
- [x] AnalyzePage 개선 — 드래그앤드롭 파일 업로드 UI
- [x] OptimizePage 개선 — 커버리지/시간 입력 폼 추가
- [x] 반응형 디자인 — 모바일 grid, 네비게이션
- [x] Playwright E2E 테스트 설정 + 18개 테스트 전체 통과

### 참고 사항
- Python 3.14 환경 → supabase SDK 대신 httpx로 REST API 직접 호출
- Vite 빌드 경고: recharts 번들 657KB (코드 스플리팅 권장하나 데모용 무시)
- Playwright chromium 브라우저로 E2E 테스트 실행

### 다음 할 일
- [ ] Day 5 (04/12): Vercel (FE) + Railway (BE) 배포
- [ ] Day 6 (04/13): AI 리포트 + 최종 제출