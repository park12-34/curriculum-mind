---
name: CurriculumMind Project Context
description: AI-powered curriculum gap analysis platform for a competition due 2026-04-13. Day 7 새벽 — DB 정리·보안검사·trajectory 프롬프트 개선·매스홀릭 UX 완료. D-day 오전 숙제관리 + GitHub public, 오후 AI 리포트 + QA, 저녁 제출.
type: project
originSessionId: f334a3b2-ab5c-4401-9594-5fe3cde2d404
---
CurriculumMind — 공모전 출품작 (마감: 2026-04-13 23:59, 목표 21:00 제출)

**Why:** 교강사 대상, "가르친 것과 배운 것 사이의 간격을 AI가 찾는다"

**Core Features (Day 7 — 04/13 새벽 기준):**
1. Learning Gap Analysis — 시험지 PDF + O/X 데이터 → 학생별 취약점 진단
2. 학생 관리 — 반/학생 CRUD, 학생 상세(레이더차트+성적추이+AI분석), 편집(6필드), 반 이동
3. 시험 관리 — 시험 생성/편집/삭제, O/X 그리드 입력(매스홀릭 패턴 - 두 버튼 + 오답행 핑크), CSV 성적 일괄 업로드
4. AI 분석 — 오답 패턴, 학습 궤적 예측(백엔드 델타 계산 + GPT 서술, sanity check 2단), AI 코칭, 시험 간 비교
5. 반별 대시보드 — 통계 카드, 문항별 오답률 히트맵, 위험학생 3단계 알림, 성적 추이
6. Supabase Auth 로그인 — LoginPage, ProtectedRoute, JWT 인증
7. PDF 리포트 출력 — window.print() + @media print CSS
8. 모바일 O/X 그리드 — 터치 히트박스(36px 두 버튼), sticky 학생명, 페이지네이션(3문항씩)

**Stack:** FastAPI (Python 3.14 + httpx) / React + Recharts + TailwindCSS / GPT-4o + LangChain + RAG / Supabase (pgvector + Auth) / Vercel + Railway

**Design:** Luxury Minimal — 딥 네이비(#0F172A) + 골드(#C9A84C), DM Serif Display + DM Sans

**배포:**
- FE: curriculum-mind.vercel.app
- BE: curriculum-mind-production.up.railway.app
- GitHub: https://github.com/park12-34/curriculum-mind (Day 7 오전 public 전환 예정)

## 04/13 새벽 완료 (Day 7)

**1. DB 정리**
- 삭제: 중복 의대반(e06e25e0), TestClass(2a581fb2), CSV테스트_삭제예정 — classes 2 / tests 5 / students 14 / scores 541
- 보존: 의대 준비반(1a45a16b, 데모반), 고3수능반, SKY반
- 데모반 무결성: 학생 10/10, 시험 2/2, scores 400/400 ✓

**2. API 키 보안 검사**
- .gitignore 정상, 커밋 히스토리 노출 0, 코드 하드코딩 없음
- dist에 VITE_SUPABASE_KEY 박힘은 Vite 설계상 정상(anon key + RLS 보호용)
- GitHub public 전환 안전. RLS는 v1.1 로드맵에 명시(옵션 4 채택 — seed 스크립트 1분 복구 카드)

**3. 옵션A — 학습 궤적 예측 프롬프트 개선 (backend/app/api/routes/analysis.py)**
- TRAJECTORY_PROMPT 재작성: 예시값 75/78/80 제거(앵커 방지) → `<숫자>` placeholder
- analyze_trajectory에 백엔드 전처리: 최신순 정렬, latest_accuracy, delta, trend_hint
- 1회 이력 fallback, sanity check 2단 (점수 ±15%p 보정 + current_trend 백엔드 값으로 강제)
- 검증: 강시우 급락/[43,40,37], 박현우 급상승/[82,85,88], 한도윤 정체/[58,60,59]
- 이전 75-75-75 평평 문제 해결

**4. 매스홀릭 디자인 레벨 B (frontend/src/pages/TestsPage.jsx)**
- O/X 토글 → ⭕❌ 두 버튼 나란히 (setCell 추가, toggleCell 보존)
- 오답 행 bg-red-50/60, sticky 셀 bg-red-50 동조
- MOBILE_PAGE_SIZE 4→3 (두 버튼 폭 수용)
- th min-w 80(mobile)/68(desktop), aria-label 추가

## 기존 완료 (Day 1~6)
- 백엔드 API 전체 (classes, students, tests, scores, analysis CRUD + AI + compare)
- 프론트엔드 8페이지
- 학생 등록/편집 6필드, 반 편집, 학생 반 이동
- 시험 편집/삭제 (scores cascade), CSV 성적 일괄 업로드
- 반별 대시보드, PDF 리포트, Supabase Auth, 시험 간 비교
- Vercel + Railway 배포, Supabase Auth 계정
- 데모반 구축 (의대 준비반, 학생 10, 시험 2, scores 400, seed_demo_class.py)

**심어놓은 학습 갭 패턴:**
- 강시우(급락), 한도윤(기초O응용X), 임채원(함수단원), 서율하(찍기), 김민재(상위안정), 박현우(급상승), 이서연/최지안/윤하준/정유나(배경)

## 진행률 (9개 기능 중)
- ✅ ①~⑦ 전부 완료
- ❌ ⑨ 과목/단원 구조화 (A안 포기 확정 — v1.1 로드맵)
- ❌ ⑪ 숙제 관리 (D-day 오전 진행)

**+ 보너스:** AI 4종, Gap Analysis, 데모반, DB 정리, 보안 검사, 옵션A, 매스홀릭 패턴

## D-day (04/13) 남은 작업
- 오전: ⑪ 숙제 관리 MVP(2.5h), GitHub public 전환 + 협업문서(0.5h)
- 오후: QA 풀스캔(1.5h), AI 리포트 + 도식 4개 + PDF(4h)
- 저녁: 동의서·각서 서명 PDF, 메일 작성 + 4종 첨부 + 송부
- 목표 제출: 21:00

## 매스홀릭 영감 (v1.1/v1.2 로드맵 예약)
시험 카드 그리드, 상세 페이지 분리(좌사이드바+중채점+우정보), 시험 유형 카테고리, 제출 상태 추적, 정답+자동채점, PDF 통합, 강의모드, 답안 이력 — AI 리포트에 시간 견적과 함께 서술

## 과목 확장 (A안 확정)
- 레벨 1(1.5h) / 레벨 2(3~4h) / 레벨 3(8h+)
- 리스크 5개: subject nullable, 문항 메타데이터, students.subjects 활용, AI 프롬프트 과목 중립, 라우팅
- 리팩토링 불필요, 기능 추가만으로 확장 가능

## 정리 대기
- test_case1.csv, test_case2.csv (깃헙 public 전환 시 함께 정리)

**How to apply:**
- 환경변수: 백엔드 core/config.py, 프론트 .env VITE_ 접두사 + dev server 재시작 필요
- 개발 중 LLM_MODEL=gpt-4o-mini, 데모 시 gpt-4o
- Supabase students 컬럼: id, name, class_id, birth_date, school_name, enrolled_at, is_attending, subjects
- 인증: VITE_SUPABASE_URL, VITE_SUPABASE_KEY → Supabase Auth REST API (anon key만 프론트 노출)
- Backend 수동 기동: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` — --reload 없음, 코드 수정 후 수동 재기동 필요 (PID kill → 재실행)
- Python 3.14에서 한글 print 시 CP949 에러 → `PYTHONIOENCODING=utf-8` 설정 필수
- seed_demo_class.py는 /api/scores/batch가 upsert라 재실행 시 중복 없이 덮어쓰기 — 시연 중 데이터 복구 카드로 활용 가능
- trajectory API는 history 2회 미만이면 GPT 호출 스킵하고 fallback 반환 (1주후=2주후=3주후=latest)
