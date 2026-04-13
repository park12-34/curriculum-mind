## 완료 (Day 1~7, 04/13 새벽 기준)

### 백엔드
- FastAPI + Supabase (httpx REST 직접 호출, Python 3.14 호환)
- CRUD API: classes, students, tests, scores
- AI 분석 API: 오답 패턴, 궤적 예측, 코치, 시험 간 비교 (/api/analysis/*)
- Gap Analysis: /api/analyze (PDF + class_id + test_id)
- /api/scores/batch — upsert 지원 (재실행 시 덮어쓰기)

### 프론트엔드 (8페이지)
- Login, Landing, Dashboard, Analyze, Students, StudentDetail, Tests, Analysis
- 학생 등록/편집 6필드 (birth_date, school_name, enrolled_at, is_attending, subjects)
- 반 편집, 학생 반 이동 (기존 시험 데이터 유지)
- 시험 편집/삭제 (scores cascade)
- CSV 성적 일괄 업로드 (CsvImportModal, 순수 JS 파서, 의존성 0)
- 반별 대시보드: 통계 카드, 오답률 히트맵, 위험학생 3단계 배지, 성적 추이
- PDF 리포트 출력 (window.print + @media print)
- Supabase Auth 로그인 (LoginPage, ProtectedRoute, JWT 인터셉터)
- 시험 간 비교 분석 (BarChart, 반복 오답, 취약 개념)
- 모바일 O/X 그리드 개선 (터치 44px, sticky 학생명, 페이지네이션 3문항)
- Luxury Minimal 디자인 (딥 네이비 #0F172A + 골드 #C9A84C)

### 배포
- FE: curriculum-mind.vercel.app
- BE: curriculum-mind-production.up.railway.app
- GitHub: https://github.com/park12-34/curriculum-mind (Day 7 오전 public 전환 예정)

### 04/13 오전 완료 — 데모반 구축 (C안)
- 반: "의대 준비반" (ID: 1a45a16b-6400-47db-9646-e95cdab04f64)
- 학생 10명: 강시우, 한도윤, 임채원, 서율하, 김민재, 이서연, 박현우, 최지안, 윤하준, 정유나
- 시험 2개:
  - 3월 수학 단원평가 (08e7ec27-64e6-4d61-aea1-10d4bf8145d6) 2026-03-15
  - 4월 수학 단원평가 (8f3e86f5-f269-4014-be7d-8b84740f2595) 2026-04-05
- 성적 400개 배치 업로드 (학생 10 × 시험 2 × 문항 20)
- 영구 스크립트: backend/seed_demo_class.py (재실행 가능, upsert)

### 심어놓은 학습 갭 패턴 (시연 시나리오)
- 강시우: 17/20 → 9/20 (급락 위험군 — 궤적 예측 AI 경고 시연용)
- 한도윤: 기초 O, 응용 X 패턴 (Gap Analysis 시연용)
- 임채원: 11~15번 함수 단원 집중 오답 (오답 패턴 분석 시연용)
- 서율하: 찍기 의심 패턴 (AI 코치 시연용)
- 김민재: 상위권 안정 (비교군)
- 박현우: 급상승 트렌드 (긍정 케이스)
- 나머지 4명 (이서연, 최지안, 윤하준, 정유나): 중위~하위권 배경 데이터

### 04/13 새벽 추가 완료

#### 1. DB 정리 (중복 제거)
- 삭제: 중복 의대 준비반(e06e25e0), TestClass(2a581fb2), CSV테스트_삭제예정 시험
- 삭제 총계: classes 2, tests 5, students 14, scores 541
- 보존: 의대 준비반(1a45a16b, 데모반), 고3수능반, SKY반
- 데모반 무결성 검증 완료 (학생 10/10, 시험 2/2, scores 400/400)

#### 2. API 키 보안 검사 완료
- .gitignore 정상, 커밋 히스토리 노출 0건
- 코드 하드코딩 없음, frontend dist는 anon key (Vite 설계상 정상)
- GitHub public 전환 안전 상태
- RLS 처리 방향: 옵션 4 채택 (RLS 미적용 유지, AI 리포트 v1.1 로드맵에 명시, 사고 시 seed 스크립트로 1분 복구)

#### 3. 옵션A — 학습 궤적 예측 프롬프트 개선 ✅
- 파일: backend/app/api/routes/analysis.py
- 변경: TRAJECTORY_PROMPT 재작성 + analyze_trajectory 함수 + _trend_hint_from_delta 헬퍼 추가
- 핵심: compare 패턴 이식 (백엔드 사전 계산 + GPT 서술만)
- 추가: 1회 이력 fallback, sanity check 2단 (점수 ±15%p 보정 + trend 백엔드 값으로 강제)
- 검증:
  - 강시우 (85→45, Δ-40%p): 급락/높음/[43,40,37] ✅
  - 박현우 (45→75, Δ+30%p): 급상승/낮음/[82,85,88] ✅
  - 한도윤 (60→60, Δ0%p): 정체/보통/[58,60,59] ✅
- 이전 문제(모두 75-75-75 평평) 해결됨

#### 4. 매스홀릭 디자인 패턴 레벨 B 적용 ✅
- 파일: frontend/src/pages/TestsPage.jsx
- 변경:
  - O/X 토글 → ⭕❌ 두 버튼 나란히 (setCell 헬퍼 추가, 기존 toggleCell 보존)
  - 오답 행 핑크 배경 (bg-red-50/60) + 학생명 sticky 셀 동조 (bg-red-50)
  - MOBILE_PAGE_SIZE 4 → 3 (두 버튼 수용 위해)
  - th min-w 40 → 80(mobile)/68(desktop)
- 모바일 호환: 3문항 페이지네이션, sticky, 정답 열 hidden 모두 보존
- aria-label 추가 (접근성 보너스)
- 알려진 잠재 이슈: iPhone 12 Pro에서 3번째 문항 X 버튼 살짝 잘림 (가로 스크롤 가능)
- 데스크탑 검증 완료, 콘솔 에러 0

## 진행률 (9개 기능 중)
- ✅ ① 반별 대시보드 (히트맵 + 위험군)
- ✅ ② 위험 학생 배지 (이미 구현됨, 추가 작업 0)
- ✅ ③ 결과 PDF 출력
- ✅ ④ 인증 시스템 (Supabase Auth)
- ✅ ⑤ 시험 간 비교 분석
- ✅ ⑥ 모바일 O/X 그리드 개선 (Day 6 + Day 7 매스홀릭 패턴 강화)
- ✅ ⑦ CSV 성적 import
- ❌ ⑨ 과목/단원 구조화 (A안 — 공모전 전 포기 확정)
- ❌ ⑪ 숙제 관리 (D-day 아침 진행 예정)

**+ 추가 완료:** AI 4종, Gap Analysis, 데모반, DB 정리, 보안 검사, 옵션A, 매스홀릭 패턴

**실제 진행률: 7/9 + 보너스 다수. 실질 완성도 매우 높음.**

## 과목 확장 판단 (A안 확정)
- 공모전 전 전 과목 기능 포기
- 확장 경로 파악 완료: 레벨 1 (1.5h) / 레벨 2 (3~4h) / 레벨 3 (8h+)
- 리스크 5개 인지: subject nullable, 문항 메타데이터, students.subjects 활용, AI 프롬프트 과목 중립, 라우팅 구조
- 코드 전면 리팩토링 불필요. 기능 추가만으로 확장 가능한 구조
- AI 리포트에 v1.1 / v1.2 로드맵으로 서술 예정

## D-day (04/13) 남은 작업

### 오전
1. ⑪ 숙제 관리 MVP (약 2.5h)
2. GitHub public 전환 + 협업문서 커밋 (약 0.5h)
   - CLAUDE.md, MEMORY.md, project_curriculummind.md 등 포함
   - 메일 권장사항 충족 → 가산점

### 오후
3. 무결점 QA 풀스캔 (약 1.5h) — 모든 페이지 + 빈 데이터 케이스 + 모바일/데스크탑
4. AI 리포트 작성 + 도식 4개 + PDF 변환 (약 4h)
   - 톤: 하이브리드 (기획=스토리, AI 활용=실무)
   - 도식 4개: 솔루션 다이어그램, AI 에이전트 구성도, 유저 저니, 시스템 아키텍처
   - GitHub 협업문서 링크 삽입 (메일 권장사항)
   - "v1.1 로드맵"에 매스홀릭 영감, RLS 적용, 과목 구조화, 숙제관리 AI 통합 포함

### 저녁
5. 동의서·각서 서명 PDF
6. 메일 작성 + 4종 첨부 + 송부

**목표 제출 시각: 21:00 (마감 23:59까지 3시간 여유)**

## 매스홀릭 영감 (AI 리포트 v1.1/v1.2 로드맵 예약)

매스홀릭 화면 분석에서 발견한 향후 강화 후보 (D-day 작업 아님):
- 시험 목록 카드 그리드 (KPI 4개 한눈에)
- 시험 상세 페이지 분리 (좌 학생 사이드바 + 중 채점 + 우 정보)
- 시험 유형 카테고리 (주간/월간/단원/기출)
- 학생별 제출 상태 추적
- 정답 + 자동 채점 (현재 O/X만 → 정답 입력 후 자동 비교)
- 시험지 PDF 통합 (채점 시 옆 표시)
- 강의모드 (채점 결과 강의 자료화)
- 답안 입력 이력

AI 리포트 v1.1/v1.2 로드맵에 구체 시간 견적과 함께 서술 예정.

## 정리 대기
- test_case1.csv, test_case2.csv (프로젝트 루트 — 깃헙 public 전환 시 함께 정리)

## 환경 / 기술 메모
- Python 3.14 환경 (supabase SDK 빌드 실패 → httpx로 REST 직접 호출)
- Python 3.14에서 한글 print 시 CP949 에러 발생 → `PYTHONIOENCODING=utf-8` 설정 필수
- Backend 수동 기동: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` (--reload 없음, 코드 수정 시 재기동 필요)
- Frontend dev: `npm run dev` (frontend 폴더)
- lru_cache 영향으로 .env 변경 시 서버 완전 재시작 필요
- 환경변수: 백엔드 core/config.py, 프론트 .env VITE_ 접두사 + dev server 재시작 필요
- 개발 중 LLM_MODEL=gpt-4o-mini, 데모 시 gpt-4o
- seed_demo_class.py는 /api/scores/batch가 upsert라 재실행 시 중복 없이 덮어쓰기 — 시연 중 데이터 복구 카드로 활용 가능

## 마감
2026-04-13 23:59 (목표 21:00 제출)
