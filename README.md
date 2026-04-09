# CurriculumMind

> 가르친 것과 배운 것 사이의 간격을 AI가 찾는다

CurriculumMind는 교강사를 위한 AI 기반 교육 분석 플랫폼입니다. 커리큘럼과 평가 데이터를 분석하여 학습 갭을 발견하고, 위험 학생을 예측하며, 최적화된 수업 계획을 제안합니다.

## 핵심 기능

### 1. Learning Gap Report
커리큘럼 PDF와 평가 데이터(PDF/CSV)를 업로드하면 AI가 교육 내용과 평가 사이의 갭을 자동 분석합니다. 토픽별 교육 수준과 평가 수준을 비교하여 커버리지 점수와 개선 권고사항을 제공합니다.

### 2. Struggle Predictor
퀴즈 성적 패턴과 출석률을 AI로 분석하여 낙오 위험 학생을 사전에 예측합니다. 학생별 위험도(high/medium/low), 성적 추세, 위험 요인을 시각화하여 보여줍니다.

### 3. Curriculum Optimizer
갭 분석 결과를 바탕으로 최적화된 수업 계획을 AI가 생성합니다. 토픽별 시간 배분, 교수법 추천, 세션별 학습 목표를 포함한 구체적인 수업 계획을 제안합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI (Python 3.11) |
| Frontend | React + Recharts + TailwindCSS |
| AI | GPT-4o + LangChain + RAG |
| Database | Supabase (pgvector + PostgreSQL) |
| 배포 (FE) | Vercel |
| 배포 (BE) | Railway |

## 로컬 실행 방법

### 환경변수 설정

```bash
cp backend/.env.example backend/.env
```

`.env` 파일을 열어 아래 값을 입력합니다:

- `OPENAI_API_KEY` — OpenAI API 키
- `SUPABASE_URL` — Supabase 프로젝트 URL
- `SUPABASE_KEY` — Supabase anon/service 키

### 백엔드

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

### E2E 테스트

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```
