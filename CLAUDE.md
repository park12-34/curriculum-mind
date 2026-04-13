# CurriculumMind — CLAUDE.md

## 프로젝트 컨텍스트
- 공모전 마감: 2026-04-13
- 핵심 슬로건: "가르친 것과 배운 것 사이의 간격을 AI가 찾는다"
- 타겟: 교강사

## 핵심 기능
1. Learning Gap Analysis — 시험지 PDF + O/X 데이터 → 학생별 취약점 진단
2. 학생 관리 — 반/학생 CRUD, 학생 상세 프로필, 레이더차트, 성적 추이
3. 시험 관리 — 시험 생성, 학생별 문항 O/X 그리드 입력
4. AI 분석 — 오답 패턴 분석, 학습 궤적 예측, AI 코칭 어시스턴트, 시험 간 비교 분석
5. 반별 대시보드 — 통계 카드, 문항별 오답률 히트맵, 위험학생 3단계 알림(즉시개입/주의관찰/우수), 성적 추이
6. Supabase Auth 로그인 — LoginPage, ProtectedRoute, JWT 인증

## 기술 스택
- Backend : FastAPI (Python 3.11)
- Frontend: React + Recharts + TailwindCSS
- AI      : GPT-4o + LangChain + RAG
- DB      : Supabase (pgvector + PostgreSQL)
- 배포    : Vercel (FE) + Railway (BE)
- 디자인  : Luxury Minimal (딥 네이비 #0F172A + 골드 #C9A84C, DM Serif Display + DM Sans)

## 폴더 구조
backend/app/
├── api/routes/   # FastAPI 라우터 (curriculum, students, analysis)
├── core/         # config, 설정
├── services/     # 비즈니스 로직 (AI 파이프라인)
├── models/       # Pydantic 모델
└── utils/        # 공통 유틸

frontend/src/
├── api/          # axios 클라이언트 (JWT 인터셉터 포함)
├── components/   # Layout, Footer, Spinner, CsvImportModal
├── pages/        # LoginPage, LandingPage, DashboardPage, AnalyzePage, StudentsPage, StudentDetailPage, TestsPage, AnalysisPage
└── assets/       # hero.png

## API 엔드포인트
### Classes
- GET /api/classes
- POST /api/classes
- PUT /api/classes/{class_id}
- GET /api/classes/{class_id}/students
- GET /api/classes/{class_id}/tests

### Students
- GET /api/students/{student_id}
- POST /api/students
- PUT /api/students/{student_id} — 반 이동(class_id 변경) 포함
- DELETE /api/students/{student_id}
- GET /api/students/{student_id}/history

### Tests & Scores
- POST /api/tests
- GET /api/tests/{test_id}
- PUT /api/tests/{test_id} — 제목/날짜/문항수 수정
- DELETE /api/tests/{test_id} — scores cascade 삭제 포함
- GET /api/tests/{test_id}/scores
- POST /api/scores/batch

### Analysis (AI)
- POST /api/analysis/pattern/{student_id}
- POST /api/analysis/trajectory/{student_id}
- POST /api/analysis/coach
- POST /api/analysis/compare — 시험 간 비교 분석 (BarChart + 반복오답 + 취약개념)
- POST /api/analyze (Gap Analysis — PDF + class_id + test_id)

## Supabase 테이블 스키마
### students
- id, name, class_id, birth_date, school_name, enrolled_at, is_attending (bool), subjects (text[])

## 코딩 규칙
- 환경변수는 반드시 core/config.py 를 통해서만 접근
- 개발 중: LLM_MODEL=gpt-4o-mini
- 데모 시: LLM_MODEL=gpt-4o
- API 응답 형식: { "success": bool, "data": {} }
- 모든 에러는 HTTPException으로 처리

## 네비게이션 (5개)
대시보드 → Gap Analysis → 학생 관리 → 시험 관리 → AI 분석

## 인증
- Supabase Auth (email/password)
- 프론트: VITE_SUPABASE_URL, VITE_SUPABASE_KEY (.env)
- LoginPage → ProtectedRoute → 앱 라우트
- axios 인터셉터: localStorage access_token → Authorization 헤더

## 개발 일정
- Day 1 (04/08): FastAPI 세팅 + PDF 파싱 + RAG 파이프라인
- Day 2 (04/09): Gap Analysis API + Struggle Predictor API
- Day 3 (04/10): React UI 기본 구조 + API 연동
- Day 4 (04/11): UI 완성 + E2E 테스트
- Day 5 (04/12): Vercel + Railway 배포
- Day 6 (04/13): AI 리포트 + 제출

## Session Status (Day 5 — 04/12 기준)

### 전체 완료
- [x] backend/ 초기 세팅 + PDF 파싱 + RAG 파이프라인
- [x] Gap Analysis API + AI 분석 API (오답 패턴, 궤적 예측, AI 코치)
- [x] React UI 전체 구현 (8개 페이지)
- [x] 학생 관리 — 등록(6필드), 편집, 삭제, 반 이동
- [x] 학생 상세 페이지 — 프로필 카드, RadarChart, LineChart, AI 취약 개념 분석
- [x] 학생 편집 모달 — birth_date, school_name, enrolled_at, is_attending, subjects
- [x] 반 편집 기능 (PUT /api/classes/{id})
- [x] 학생 반 이동 — PUT /api/students/{id} class_id 변경, 기존 시험 데이터 유지
- [x] 네비게이션 정리 (5개: 대시보드, Gap Analysis, 학생 관리, 시험 관리, AI 분석)
- [x] 전체 디자인 리뉴얼 — Luxury Minimal (딥 네이비 + 골드)
- [x] Supabase students 컬럼 추가 — birth_date, school_name, enrolled_at, is_attending, subjects
- [x] 시험 편집 기능 — PUT /api/tests/{id} (제목/날짜/문항수 수정 모달)
- [x] 시험 삭제 기능 — DELETE /api/tests/{id} (scores cascade 삭제)
- [x] 반별 대시보드 (DashboardPage) — 통계 카드, 문항별 오답률 히트맵, 성적 추이 차트
- [x] 위험학생 3단계 알림 배지 — 즉시 개입 필요(<60%), 주의 관찰(60~75%), 우수(≥90%)
- [x] PDF 리포트 출력 — DashboardPage, AnalyzePage에 window.print() + @media print CSS
- [x] Supabase Auth 로그인 시스템 — LoginPage, ProtectedRoute, JWT 인터셉터
- [x] 시험 간 비교 분석 — AI 분석 4번째 탭, BarChart, 반복 오답 하이라이트, 취약 개념 태그
- [x] Vercel + Railway 배포 완료
- [x] git push 완료 (da1d7d9)
- [x] AI 리포트 v2 작성 완료 (AI_리포트_박성경_v2.docx)
- [x] E2E 테스트 Step 1 완료 (학생 상세 페이지 정상 확인)
- [x] Supabase Auth 계정 생성 (soundger@gmail.com)
- [x] .env 설정: VITE_SUPABASE_URL, VITE_SUPABASE_KEY
- [x] 로그인 버그 해결 — env 캐시 + apikey 헤더
- [x] CSV 성적 일괄 업로드 — CsvImportModal.jsx (순수 JS 파서, /api/scores/batch 재사용)
- [x] 모바일 O/X 그리드 개선 — 터치 44px, sticky, 페이지네이션 4문항, 정답열 숨김

### 배포 URL
- FE (로컬): localhost:5173
- BE (로컬): localhost:8000
- FE (라이브): curriculum-mind.vercel.app
- BE (라이브): curriculum-mind-production.up.railway.app

### 참고 사항
- Python 3.14 환경 → supabase SDK 대신 httpx로 REST API 직접 호출
- Vite 빌드 경고: recharts 번들 ~750KB (데모용 무시)

### 남은 작업 (04/13 마감)
- [ ] 데모 반 구축 (시연 전용 학습 갭 패턴)
- [ ] 과목/단원 구조화 (컷 후보)
- [ ] 숙제 관리
- [ ] AI 리포트 v2 PDF 변환
- [ ] 동의서/각서 서명
- [ ] 메일 발송 (최종 제출)
