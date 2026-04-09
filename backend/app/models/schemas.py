from pydantic import BaseModel


class GapItem(BaseModel):
    topic: str
    taught_level: str
    assessed_level: str
    gap_description: str


class GapAnalysisResult(BaseModel):
    gaps: list[GapItem]
    coverage_score: float
    recommendations: list[str]


class QuizRecord(BaseModel):
    student_id: str
    student_name: str
    scores: list[float]
    attendance_rate: float = 1.0


class PredictRequest(BaseModel):
    quiz_records: list[QuizRecord]
    threshold: float = 60.0


class StudentRisk(BaseModel):
    student_id: str
    student_name: str
    risk_level: str  # "high" | "medium" | "low"
    avg_score: float
    trend: str  # "declining" | "stable" | "improving"
    factors: list[str]


class PredictResult(BaseModel):
    at_risk_students: list[StudentRisk]
    class_avg: float
    risk_summary: dict


class OptimizeRequest(BaseModel):
    gaps: list[GapItem]
    coverage_score: float
    total_hours: int = 16
    priorities: list[str] | None = None


class SessionPlan(BaseModel):
    session_number: int
    topic: str
    objectives: list[str]
    hours: float
    teaching_method: str


class OptimizeResult(BaseModel):
    sessions: list[SessionPlan]
    focus_areas: list[str]
    estimated_improvement: float


class ApiResponse(BaseModel):
    success: bool
    data: dict | None = None
    error: str | None = None
