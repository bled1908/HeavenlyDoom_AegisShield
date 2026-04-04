"""
Risk scoring and weekly premium prediction endpoint.
Uses heuristic model in Phase 1; upgrade path to scikit-learn/PyTorch is preserved.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter()

# ─── Request / Response models ────────────────────────────────────────────────

class RiskScoreRequest(BaseModel):
    workerId: str
    city: str
    zones: list[str]
    weeklyBaseEarning: float = Field(..., gt=0)
    avgHoursPerDay: float = Field(..., gt=0, le=24)
    workingDaysPerWeek: int = Field(..., ge=1, le=7)
    platform: str
    historicalClaims: int = Field(default=0, ge=0)
    seasonality: Literal["MONSOON", "NORMAL", "SUMMER", "WINTER"] = "NORMAL"


class RiskScoreResponse(BaseModel):
    riskScore: float = Field(..., description="0..100 composite risk score")
    recommendedTier: Literal["BASIC", "PLUS", "MAX"]
    weeklyPremiumEstimate: float
    riskFactors: list[str]


# ─── City base risk lookup ────────────────────────────────────────────────────
CITY_BASE_RISK: dict[str, float] = {
    "mumbai": 72, "chennai": 68, "kolkata": 65,
    "hyderabad": 55, "bangalore": 50, "delhi": 60,
    "pune": 48, "ahmedabad": 45,
}

PLATFORM_RISK: dict[str, float] = {
    "ZOMATO": 1.0, "SWIGGY": 1.0, "ZEPTO": 1.1,
    "AMAZON": 0.9, "FLIPKART": 0.9, "DUNZO": 1.05, "OTHER": 1.0,
}


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/risk-score", response_model=RiskScoreResponse)
async def compute_risk_score(req: RiskScoreRequest) -> RiskScoreResponse:
    """
    Compute composite risk score for a delivery worker.
    
    Algorithm:
    - Base city risk (0–80)
    - Seasonal adjustment (+15 for monsoon)
    - Hours worked adjustment (+5 for >10h/day)
    - Historical claims penalty (+5 per claim, capped at 20)
    - Platform factor multiplier
    
    Upgrade path: Replace body with model.predict(feature_vector) from a trained
    scikit-learn GradientBoostingRegressor or PyTorch neural net.
    """
    city_key = req.city.lower().strip()
    base_risk = CITY_BASE_RISK.get(city_key, 50.0)

    # Feature engineering
    seasonal_bonus = 15.0 if req.seasonality == "MONSOON" else 5.0 if req.seasonality == "SUMMER" else 0.0
    hours_bonus = 5.0 if req.avgHoursPerDay > 10 else 0.0
    claims_penalty = min(req.historicalClaims * 5.0, 20.0)
    platform_mult = PLATFORM_RISK.get(req.platform, 1.0)

    raw_score = (base_risk + seasonal_bonus + hours_bonus + claims_penalty) * platform_mult
    risk_score = round(min(max(raw_score, 0), 100), 2)

    # Premium estimate (simple linear model)
    premium_base_pct = 0.04 + (risk_score / 1000)  # 4–14% of weekly earnings
    premium_estimate = round(req.weeklyBaseEarning * premium_base_pct, 0)

    # Tier recommendation
    if risk_score < 40:
        tier = "BASIC"
    elif risk_score < 65:
        tier = "PLUS"
    else:
        tier = "MAX"

    # Risk factor explanations
    factors: list[str] = []
    if base_risk > 60:
        factors.append(f"{req.city} is a high flood-risk city")
    if req.seasonality == "MONSOON":
        factors.append("Active monsoon season increases disruption probability")
    if req.avgHoursPerDay > 10:
        factors.append("Extended working hours increase exposure")
    if req.historicalClaims > 2:
        factors.append(f"{req.historicalClaims} historical claims detected")
    if platform_mult > 1.0:
        factors.append(f"{req.platform} platform has elevated risk profile")

    return RiskScoreResponse(
        riskScore=risk_score,
        recommendedTier=tier,
        weeklyPremiumEstimate=premium_estimate,
        riskFactors=factors,
    )
