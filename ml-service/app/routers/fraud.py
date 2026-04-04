"""
Fraud detection endpoint.
Multi-signal fusion: location trust, behavioral anomaly, device integrity, network patterns.
"""

import math
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter()


class LocationLog(BaseModel):
    lat: float
    lng: float
    ts: int  # Unix timestamp milliseconds
    source: Literal["GPS", "NETWORK", "PLATFORM"]


class FraudScoreRequest(BaseModel):
    workerId: str
    claimId: str
    zone: str
    disruptionType: str
    expectedEarning: float
    actualEarning: float
    locationLogs: list[LocationLog] = Field(default_factory=list)


class FraudScoreResponse(BaseModel):
    totalScore: float = Field(..., description="0=clean, 100=highly suspicious")
    locationTrust: float = Field(..., description="0..100 location trust score")
    behavioralFlags: list[str]
    networkFlags: list[str]


# Max realistic speed for a 2-wheeler in a city: 60 km/h
MAX_REALISTIC_SPEED_KMH = 60.0


@router.post("/fraud-score", response_model=FraudScoreResponse)
async def compute_fraud_score(req: FraudScoreRequest) -> FraudScoreResponse:
    """
    Compute multi-signal fraud risk score.
    
    Signals used:
    1. Location trust (GPS plausibility, movement speed, source consistency)
    2. Behavioral (loss ratio extremity, claim pattern)
    3. Network flags (placeholder for device/IP graph analysis)
    
    Upgrade path: Replace with graph neural network or isolation forest
    trained on historical fraud labels.
    """
    behavioral_flags: list[str] = []
    network_flags: list[str] = []

    # ── Signal 1: Loss ratio ─────────────────────────────────────────────────
    loss_ratio = 0.0
    if req.expectedEarning > 0:
        loss_ratio = (req.expectedEarning - req.actualEarning) / req.expectedEarning
    
    if loss_ratio >= 1.0:
        behavioral_flags.append("Complete (100%) income loss claimed")
    elif loss_ratio > 0.9:
        behavioral_flags.append("Extreme loss ratio >90%")

    # ── Signal 2: Location trust ──────────────────────────────────────────────
    location_trust = 100.0
    if req.locationLogs:
        location_trust = _compute_location_trust(req.locationLogs)
        if location_trust < 50:
            behavioral_flags.append("Suspicious location patterns detected")
        if location_trust < 30:
            behavioral_flags.append("Possible GPS spoofing – zero GPS noise detected")

    # ── Signal 3: Behavioral score from loss ratio ────────────────────────────
    behavioral_score = 0.0
    if loss_ratio > 0.9:
        behavioral_score += 30
    elif loss_ratio > 0.7:
        behavioral_score += 15

    # ── Aggregate total risk score ─────────────────────────────────────────────
    location_penalty = max(0, (100 - location_trust) * 0.4)
    network_penalty = len(network_flags) * 15
    total_score = min(100, behavioral_score + location_penalty + network_penalty)
    total_score = round(total_score, 2)

    return FraudScoreResponse(
        totalScore=total_score,
        locationTrust=round(location_trust, 2),
        behavioralFlags=behavioral_flags,
        networkFlags=network_flags,
    )


def _compute_location_trust(logs: list[LocationLog]) -> float:
    """
    Compute location trust from GPS logs.
    - Penalises teleporting (speed > 60 km/h between consecutive points)
    - Penalises GPS source = NETWORK only (no GPS)
    - Penalises zero-noise perfect GPS (unnaturally round coordinates)
    """
    if len(logs) < 2:
        # Not enough data to assess; neutral score
        return 75.0

    trust = 100.0
    gps_sources = sum(1 for l in logs if l.source == "GPS")

    # Penalise lack of GPS source
    gps_ratio = gps_sources / len(logs)
    if gps_ratio < 0.5:
        trust -= 20

    # Speed plausibility check
    teleports = 0
    for i in range(1, len(logs)):
        a, b = logs[i - 1], logs[i]
        dt_hours = max((b.ts - a.ts) / 3_600_000, 1e-9)
        dist_km = _haversine(a.lat, a.lng, b.lat, b.lng)
        speed_kmh = dist_km / dt_hours
        if speed_kmh > MAX_REALISTIC_SPEED_KMH:
            teleports += 1

    teleport_ratio = teleports / (len(logs) - 1)
    trust -= teleport_ratio * 50

    # Zero-noise detection (lat/lng with too many trailing zeros = emulator)
    perfect_coords = sum(1 for l in logs if _is_suspiciously_round(l.lat, l.lng))
    if perfect_coords / len(logs) > 0.8:
        trust -= 30

    return max(0.0, trust)


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _is_suspiciously_round(lat: float, lng: float) -> bool:
    # Real GPS has ≥4 decimal places; emulators often output 2 or less
    return (round(lat, 2) == lat) and (round(lng, 2) == lng)
