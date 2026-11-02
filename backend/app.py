"""HTTP API and static web app for the Skyline weather dashboard."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OPEN_METEO_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search"
OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"
CURRENT_FIELDS = "temperature_2m,weather_code"
FORECAST_CURRENT_FIELDS = (
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
    "weather_code,wind_speed_10m"
)
DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
HOURLY_FIELDS = "temperature_2m,precipitation_probability,weather_code"

app = FastAPI(
    title="Skyline Weather API",
    description="City search and weather forecasts powered by Open-Meteo.",
    version="1.0.0",
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5500,http://127.0.0.1:5500",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def open_meteo_json(endpoint: str, parameters: dict[str, str]) -> dict:
    """Fetch JSON from Open-Meteo and return a stable API error on failure."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0)) as client:
            response = await client.get(endpoint, params=parameters)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="The weather provider is unavailable. Please try again shortly.",
        ) from error


@app.get("/api/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/locations", tags=["weather"])
async def find_locations(
    city: str = Query(min_length=1, max_length=100),
    region: str = Query(min_length=1, max_length=100),
) -> dict:
    city = city.strip()
    region = region.strip()
    if not city or not region:
        raise HTTPException(status_code=422, detail="City and region are required.")

    return await open_meteo_json(
        OPEN_METEO_GEOCODING,
        {"name": f"{city}, {region}", "count": "5", "language": "en", "format": "json"},
    )


@app.get("/api/current", tags=["weather"])
async def current_weather(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    unit: Literal["celsius", "fahrenheit"] = "celsius",
) -> dict:
    return await open_meteo_json(
        OPEN_METEO_FORECAST,
        {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "current": CURRENT_FIELDS,
            "temperature_unit": unit,
            "timezone": "auto",
        },
    )


@app.get("/api/forecast", tags=["weather"])
async def forecast(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    unit: Literal["celsius", "fahrenheit"] = "celsius",
) -> dict:
    return await open_meteo_json(
        OPEN_METEO_FORECAST,
        {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "current": FORECAST_CURRENT_FIELDS,
            "daily": DAILY_FIELDS,
            "hourly": HOURLY_FIELDS,
            "temperature_unit": unit,
            "timezone": "auto",
            "forecast_days": "5",
        },
    )


# Serve the static dashboard after registering API routes so /api remains available.
app.mount("/", StaticFiles(directory=DOCS_DIR, html=True), name="dashboard")
