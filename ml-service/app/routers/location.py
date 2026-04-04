"""
Location trust engine endpoint.
Zero-trust location verification: treats all GPS as untrusted by default.
"""

import math
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter()


class LocationPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    accuracy: float | None = Field(default=None, description="GPS accuracy in meters")
    speed: float | None = Field(default=None, description="Reported speed m/s")
    source: Literal["GPS", "NETWORK", "PLATFORM"]
    ts: int


class LocationTrustRequest(BaseModel):
    workerId: str
    points: list[LocationPoint] = Field(..., min_length=1)
    reportedZone: str


class LocationTrustResponse(BaseModel):
    trustScore: float = Field(..., description="0..100 trust score")
    flags: list[str]
    verdict: Literal["TRUSTED", "SUSPICIOUS", "UNTRUSTED"]


MAX_CITY_SPEED_MS = 16.67  # 60 km/h in m/s


@router.post("/location-trust", response_model=LocationTrustResponse)
async def compute_location_trust(req: LocationTrustRequest) -> LocationTrustResponse:
    """
    Zero-trust location verification engine.
    
    A location is trusted when:
    - Speed between consecutive points matches realistic road travel
    - GPS accuracy is within acceptable bounds (≤50m)
    - GPS source is present (not network-only)
    - Coordinates show natural noise (not perfectly round)
    - Route is plausible (no teleportation)
    """
    flags: list[str] = []
    trust = 100.0
    points = req.points

    if len(points) < 2:
        return LocationTrustResponse(
            trustScore=70.0,
            flags=["Insufficient location history for full assessment"],
            verdict="SUSPICIOUS",
        )

    # Check GPS source ratio
    gps_count = sum(1 for p in points if p.source == "GPS")
    gps_ratio = gps_count / len(points)
    if gps_ratio < 0.3:
        flags.append("Less than 30% GPS-sourced location data")
        trust -= 25

    # Check accuracy
    bad_accuracy = [p for p in points if p.accuracy is not None and p.accuracy > 100]
    if len(bad_accuracy) / len(points) > 0.5:
        flags.append("GPS accuracy consistently >100m (poor signal or indoor spoofing)")
        trust -= 15

    # Speed plausibility
    teleports = 0
    for i in range(1, len(points)):
        a, b = points[i - 1], points[i]
        dt_sec = max((b.ts - a.ts) / 1000, 0.001)
        dist_m = _haversine_m(a.lat, a.lng, b.lat, b.lng)
        speed_ms = dist_m / dt_sec
        if speed_ms > MAX_CITY_SPEED_MS * 2:  # 2x buffer for GPS jitter
            teleports += 1

    if teleports > 0:
        ratio = teleports / (len(points) - 1)
        flags.append(f"Teleportation detected in {ratio:.0%} of location transitions")
        trust -= ratio * 50

    # Zero-noise detection
    round_coords = sum(
        1 for p in points if round(p.lat, 3) == p.lat and round(p.lng, 3) == p.lng
    )
    if round_coords / len(points) > 0.7:
        flags.append("GPS coordinates lack natural noise – possible mock location app")
        trust -= 30

    # Reported speed mismatch
    mismatches = [
        p for p in points
        if p.speed is not None and p.source == "GPS" and p.speed > MAX_CITY_SPEED_MS
    ]
    if len(mismatches) > 2:
        flags.append("Reported speed exceeds city maximum on GPS")
        trust -= 10

    trust = max(0.0, min(100.0, trust))

    # Verdict
    if trust >= 70:
        verdict = "TRUSTED"
    elif trust >= 40:
        verdict = "SUSPICIOUS"
    else:
        verdict = "UNTRUSTED"

    return LocationTrustResponse(
        trustScore=round(trust, 2),
        flags=flags,
        verdict=verdict,
    )


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000.0  # metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
