from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import httpx

from app.core.config import get_settings
from app.models.schemas import ApiResponse, PredictRequest, OptimizeRequest
from app.services.pdf_parser import parse_pdf
from app.services.gap_analysis_service import analyze_gap, analyze_gap_with_scores
from app.services.struggle_predictor_service import predict_struggles
from app.services.curriculum_optimizer_service import optimize_curriculum

router = APIRouter(tags=["curriculum"])

settings = get_settings()
_BASE = f"{settings.SUPABASE_URL}/rest/v1"
_HEADERS = {
    "apikey": settings.SUPABASE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
    "Content-Type": "application/json",
}


@router.post("/analyze", response_model=ApiResponse)
async def analyze_curriculum(
    pdf_file: UploadFile = File(..., description="시험지 PDF"),
    class_id: str = Form(...),
    test_id: str = Form(...),
):
    """시험지 PDF와 O/X 데이터를 교차 분석하여 학생별 취약점을 진단한다."""
    try:
        # 1) PDF 파싱
        pdf_text = await parse_pdf(pdf_file)
        if not pdf_text:
            raise HTTPException(status_code=400, detail="시험지 PDF에서 텍스트를 추출할 수 없습니다.")

        async with httpx.AsyncClient() as client:
            # 2) 시험 정보
            resp = await client.get(
                f"{_BASE}/tests",
                headers=_HEADERS,
                params={"id": f"eq.{test_id}", "select": "id,title,total_questions"},
            )
            resp.raise_for_status()
            tests = resp.json()
            if not tests:
                raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다.")
            test_info = tests[0]

            # 3) 학생 목록
            resp = await client.get(
                f"{_BASE}/students",
                headers=_HEADERS,
                params={"class_id": f"eq.{class_id}", "select": "id,name", "order": "name.asc"},
            )
            resp.raise_for_status()
            students = resp.json()
            if not students:
                raise HTTPException(status_code=404, detail="해당 반에 학생이 없습니다.")

            # 4) 해당 시험 O/X 데이터
            student_ids = [s["id"] for s in students]
            resp = await client.get(
                f"{_BASE}/scores",
                headers=_HEADERS,
                params={
                    "test_id": f"eq.{test_id}",
                    "student_id": f"in.({','.join(student_ids)})",
                    "select": "student_id,question_no,is_correct",
                    "order": "student_id.asc,question_no.asc",
                },
            )
            resp.raise_for_status()
            scores = resp.json()

        if not scores:
            raise HTTPException(status_code=400, detail="O/X 데이터가 없습니다. 시험 관리에서 먼저 입력하세요.")

        result = await analyze_gap_with_scores(
            pdf_text=pdf_text,
            test_info=test_info,
            students=students,
            scores=scores,
        )

        return ApiResponse(success=True, data=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict", response_model=ApiResponse)
async def predict_at_risk_students(request: PredictRequest):
    """퀴즈 패턴을 분석하여 낙오 위험 학생을 예측한다."""
    try:
        if not request.quiz_records:
            raise HTTPException(status_code=400, detail="퀴즈 데이터가 비어 있습니다.")

        result = await predict_struggles(request)
        return ApiResponse(success=True, data=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize", response_model=ApiResponse)
async def optimize_curriculum_plan(request: OptimizeRequest):
    """갭 분석 결과를 바탕으로 최적화된 커리큘럼을 생성한다."""
    try:
        if not request.gaps:
            raise HTTPException(status_code=400, detail="갭 분석 데이터가 비어 있습니다.")

        result = await optimize_curriculum(request)
        return ApiResponse(success=True, data=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
