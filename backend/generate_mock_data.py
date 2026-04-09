"""CurriculumMind mock 데이터 생성 스크립트.

사용법:
    cd backend
    python generate_mock_data.py

생성 파일:
    mock_data/quiz_records.json   — /api/predict 테스트용
    mock_data/gap_analysis.json   — /api/optimize 테스트용
    mock_data/curriculum.txt      — /api/analyze 테스트용 (텍스트)
    mock_data/assessment.txt      — /api/analyze 테스트용 (텍스트)
"""

import json
import os
import random

random.seed(42)

MOCK_DIR = os.path.join(os.path.dirname(__file__), "mock_data")


def generate_quiz_records() -> dict:
    """30명 학생의 5회 퀴즈 성적 데이터."""
    students = [
        ("S001", "김민수"), ("S002", "이서연"), ("S003", "박지훈"),
        ("S004", "최유진"), ("S005", "정하윤"), ("S006", "강도현"),
        ("S007", "윤서준"), ("S008", "임나은"), ("S009", "한지민"),
        ("S010", "오승우"), ("S011", "서예린"), ("S012", "송민재"),
        ("S013", "장수빈"), ("S014", "권태현"), ("S015", "배소율"),
        ("S016", "조은서"), ("S017", "류가온"), ("S018", "홍시우"),
        ("S019", "문채원"), ("S020", "신준호"), ("S021", "고하랑"),
        ("S022", "남도윤"), ("S023", "전서영"), ("S024", "양현우"),
        ("S025", "황지아"), ("S026", "안태민"), ("S027", "유서현"),
        ("S028", "노건우"), ("S029", "하윤아"), ("S030", "백승현"),
    ]

    records = []
    for sid, name in students:
        # 다양한 패턴 생성
        if sid in ("S003", "S010", "S018"):
            # 하락 추세 (위험군)
            base = random.randint(60, 75)
            scores = [base - i * random.randint(3, 8) for i in range(5)]
        elif sid in ("S006", "S014", "S028"):
            # 지속 저조 (위험군)
            scores = [random.randint(30, 55) for _ in range(5)]
        elif sid in ("S008", "S021"):
            # 상승 추세
            base = random.randint(45, 55)
            scores = [base + i * random.randint(3, 7) for i in range(5)]
        else:
            # 일반 (70~95 범위)
            scores = [random.randint(65, 98) for _ in range(5)]

        scores = [max(0, min(100, s)) for s in scores]

        attendance = round(random.uniform(0.7, 1.0), 2)
        if sid in ("S006", "S014"):
            attendance = round(random.uniform(0.5, 0.7), 2)

        records.append({
            "student_id": sid,
            "student_name": name,
            "scores": scores,
            "attendance_rate": attendance,
        })

    return {
        "quiz_records": records,
        "threshold": 60.0,
    }


def generate_gap_analysis() -> dict:
    """Gap Analysis 결과 mock 데이터 (/api/optimize 입력용)."""
    return {
        "gaps": [
            {
                "topic": "데이터 전처리",
                "taught_level": "중",
                "assessed_level": "상",
                "gap_description": "커리큘럼에서 기초 수준만 다뤘으나 평가에서는 고급 전처리 기법을 요구함",
            },
            {
                "topic": "모델 평가 지표",
                "taught_level": "하",
                "assessed_level": "상",
                "gap_description": "정밀도, 재현율, F1 등 평가 지표를 거의 다루지 않았으나 평가에서 심층 이해를 요구함",
            },
            {
                "topic": "신경망 기초",
                "taught_level": "없음",
                "assessed_level": "중",
                "gap_description": "커리큘럼에 신경망 관련 내용이 전혀 없으나 평가에서 기본 개념을 다룸",
            },
            {
                "topic": "회귀분석",
                "taught_level": "상",
                "assessed_level": "상",
                "gap_description": "커리큘럼과 평가 수준이 일치하여 갭 없음",
            },
            {
                "topic": "분류 알고리즘",
                "taught_level": "중",
                "assessed_level": "중",
                "gap_description": "기본적인 분류 알고리즘은 다뤘으나 앙상블 기법에 대한 보충이 필요",
            },
            {
                "topic": "특성 공학",
                "taught_level": "하",
                "assessed_level": "중",
                "gap_description": "특성 선택 및 추출 기법에 대한 수업 내용이 부족함",
            },
        ],
        "coverage_score": 52.0,
        "total_hours": 16,
        "priorities": ["모델 평가 지표", "신경망 기초"],
    }


def generate_curriculum_text() -> str:
    """커리큘럼 텍스트 mock (/api/analyze 입력용)."""
    return """[머신러닝 기초 과정 커리큘럼]

1주차: 머신러닝 개요
- 머신러닝의 정의와 분류 (지도학습, 비지도학습, 강화학습)
- 학습 데이터와 테스트 데이터의 개념
- Python 환경 설정 및 기본 라이브러리 소개

2주차: 데이터 전처리 기초
- 결측치 처리 (삭제, 대체)
- 데이터 정규화와 표준화
- 범주형 데이터 인코딩

3주차: 회귀분석
- 단순 선형 회귀
- 다중 선형 회귀
- 규제 기법 (Ridge, Lasso)
- 실습: 주택 가격 예측

4주차: 분류 알고리즘
- 로지스틱 회귀
- 결정 트리
- K-최근접 이웃 (KNN)
- 실습: 붓꽃 분류

5주차: 비지도 학습
- K-평균 군집화
- 주성분 분석 (PCA)
- 실습: 고객 세그먼테이션

6주차: 모델 성능 개선
- 교차 검증
- 하이퍼파라미터 튜닝
- 과적합과 과소적합

7주차: 프로젝트
- 팀 프로젝트: 실제 데이터셋 활용
- 발표 및 피드백

8주차: 종합 평가
- 필기시험
- 실기시험 (코딩 테스트)
"""


def generate_assessment_text() -> str:
    """평가 텍스트 mock (/api/analyze 입력용)."""
    return """[머신러닝 기초 과정 기말 평가]

Part 1: 객관식 (각 2점, 총 40점)
1. 다중 선형 회귀에서 L1 규제를 적용한 모델은?
2. 결정 트리의 불순도 측정 지표가 아닌 것은?
3. Precision과 Recall의 조화평균인 지표는?
4. 과적합을 방지하기 위한 기법이 아닌 것은?
5. 신경망에서 활성화 함수의 역할은?
...

Part 2: 서술형 (각 10점, 총 30점)
1. 데이터 전처리에서 특성 스케일링이 필요한 이유를 설명하고,
   Min-Max 정규화와 Z-score 표준화의 차이를 비교하시오.
   또한 이상치가 있는 경우 어떤 방법이 더 적합한지 논하시오.

2. 정밀도(Precision)와 재현율(Recall)의 트레이드오프를 설명하고,
   의료 진단 시스템에서 어떤 지표를 우선해야 하는지 근거를 들어 논하시오.
   ROC 곡선과 AUC의 의미도 포함하여 설명하시오.

3. 앙상블 학습(Random Forest, Gradient Boosting)의 원리를 설명하고,
   단일 결정 트리 대비 장점을 논하시오.

Part 3: 실기 (30점)
- 주어진 데이터셋에 대해 전처리 → 특성 공학 → 모델 학습 → 평가 파이프라인 구축
- 최소 2개 이상의 모델을 비교하고 최적 모델 선택 근거 제시
- F1 Score, Confusion Matrix 시각화 포함
"""


def main():
    os.makedirs(MOCK_DIR, exist_ok=True)

    # 1) Quiz records
    quiz_data = generate_quiz_records()
    with open(os.path.join(MOCK_DIR, "quiz_records.json"), "w", encoding="utf-8") as f:
        json.dump(quiz_data, f, ensure_ascii=False, indent=2)

    # 2) Gap analysis
    gap_data = generate_gap_analysis()
    with open(os.path.join(MOCK_DIR, "gap_analysis.json"), "w", encoding="utf-8") as f:
        json.dump(gap_data, f, ensure_ascii=False, indent=2)

    # 3) Curriculum text
    with open(os.path.join(MOCK_DIR, "curriculum.txt"), "w", encoding="utf-8") as f:
        f.write(generate_curriculum_text())

    # 4) Assessment text
    with open(os.path.join(MOCK_DIR, "assessment.txt"), "w", encoding="utf-8") as f:
        f.write(generate_assessment_text())

    print(f"Mock 데이터 생성 완료: {MOCK_DIR}/")
    for fname in os.listdir(MOCK_DIR):
        fpath = os.path.join(MOCK_DIR, fname)
        size = os.path.getsize(fpath)
        print(f"  {fname} ({size:,} bytes)")


if __name__ == "__main__":
    main()
