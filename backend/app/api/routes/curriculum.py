from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models.schemas import ApiResponse, PredictRequest, OptimizeRequest
from app.services.pdf_parser import parse_pdf
from app.services.gap_analysis_service import analyze_gap
from app.services.struggle_predictor_service import predict_struggles
from app.services.curriculum_optimizer_service import optimize_curriculum

router = APIRouter(tags=["curriculum"])


@router.post("/analyze", response_model=ApiResponse)
async def analyze_curriculum(
    curriculum_file: UploadFile = File(..., description="커리큘럼 PDF"),
    assessment_file: UploadFile = File(..., description="평가 데이터 PDF 또는 CSV"),
):
    """커리큘럼과 평가 데이터를 비교하여 학습 갭을 분석한다."""
    try:
        # PDF 파싱
        curriculum_text = await parse_pdf(curriculum_file)
        if not curriculum_text:
            raise HTTPException(status_code=400, detail="커리큘럼 PDF에서 텍스트를 추출할 수 없습니다.")

        # CSV vs PDF 분기
        if assessment_file.filename and assessment_file.filename.endswith(".csv"):
            assessment_content = await assessment_file.read()
            assessment_text = assessment_content.decode("utf-8")
        else:
            assessment_text = await parse_pdf(assessment_file)

        if not assessment_text:
            raise HTTPException(status_code=400, detail="평가 파일에서 텍스트를 추출할 수 없습니다.")

        result = await analyze_gap(curriculum_text, assessment_text)

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
