"""
Disruption prediction endpoint.
Predicts probability of income-impacting disruption in a zone for the next N weeks.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()


class DisruptionPredictRequest(BaseModel):
    zone: str
    weekAhead: int = Field(default=1, ge=1, le=8, description="How many weeks ahead to predict")


class DisruptionPredictResponse(BaseModel):
    zone: str
    weekAhead: int
    disruptionProbability: float
    predictedSeverity: str
    confidence: float
    signals: list[str]


# Simple seasonal disruption model (Phase 1 heuristic)
# In Phase 2+: replace with LSTM or XGBoost trained on historical weather + incident data
ZONE_BASE_PROBABILITY: dict[str, float] = {
    "mumbai": 0.65, "chennai": 0.55, "kolkata": 0.50,
    "hyderabad": 0.35, "bangalore": 0.30, "delhi": 0.40,
    "pune": 0.30, "ahmedabad": 0.25,
}


@router.post("/disruption-predict", response_model=DisruptionPredictResponse)
async def predict_disruption(req: DisruptionPredictRequest) -> DisruptionPredictResponse:
    """
    Predict disruption probability for a zone.
    
    Factors:
    - Zone historical disruption base rate
    - Current season (monsoon = +0.25)
    - Week-ahead decay (uncertainty increases further out)
    
    Upgrade path: Replace with time-series model (LSTM, Prophet, or XGBoost with
    lag features from historical weather + disruption incident data).
    """
    zone_key = req.zone.lower().strip()
    base_prob = ZONE_BASE_PROBABILITY.get(zone_key, 0.3)

    # Seasonal factor
    month = datetime.utcnow().month
    if 6 <= month <= 9:  # Monsoon
        seasonal_factor = 1.4
        seasonal_signal = "Active monsoon season"
    elif month in (3, 4, 5):  # Summer
        seasonal_factor = 1.1
        seasonal_signal = "Summer heat wave risk"
    else:
        seasonal_factor = 0.85
        seasonal_signal = "Historically lower disruption period"

    # Week-ahead decay (further out = lower confidence + shifted probability)
    decay = 0.95 ** (req.weekAhead - 1)
    prediction = min(base_prob * seasonal_factor * decay, 0.99)
    confidence = max(0.90 - (req.weekAhead - 1) * 0.08, 0.40)

    # Severity estimation
    if prediction > 0.6:
        severity = "HIGH"
    elif prediction > 0.35:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    signals = [seasonal_signal]
    if base_prob > 0.5:
        signals.append(f"{req.zone} has historically high disruption frequency")
    if req.weekAhead > 3:
        signals.append("Long-range prediction – confidence is lower")

    return DisruptionPredictResponse(
        zone=req.zone,
        weekAhead=req.weekAhead,
        disruptionProbability=round(prediction, 3),
        predictedSeverity=severity,
        confidence=round(confidence, 3),
        signals=signals,
    )
