# Skyline Weather Dashboard

A two-part weather project with a responsive web interface and a Python API backend. A C++ command-line client is included as an additional way to check current conditions.

## Project structure

```text
backend/   FastAPI service, Open-Meteo proxy, and static frontend hosting
docs/      Responsive browser dashboard (HTML, CSS, JavaScript)
src/       C++17 command-line weather client
```

The web frontend talks to the backend for city search and weather data. The backend validates coordinates and units, calls Open-Meteo, and returns a consistent JSON response. If the hosted proxy is unavailable or rate-limited, the browser falls back to Open-Meteo directly. The C++ client remains a standalone terminal app and calls Open-Meteo directly.

## Web app and backend

### Requirements

- Python 3.10 or newer
- Internet access for Open-Meteo requests

### Run locally

From the repository root:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

On Windows, activate the environment with `.venv\\Scripts\\activate` instead. Then open <http://127.0.0.1:8000>. The API health check is at <http://127.0.0.1:8000/api/health>, and interactive API documentation is at <http://127.0.0.1:8000/docs>.

### API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check that the service is running |
| `GET` | `/api/locations?city=...&region=...` | Find matching cities |
| `GET` | `/api/current?latitude=...&longitude=...&unit=celsius` | Current conditions for saved-city cards |
| `GET` | `/api/forecast?latitude=...&longitude=...&unit=celsius` | Current, hourly, and five-day forecast |

Temperature `unit` accepts `celsius` or `fahrenheit`. Latitude and longitude are range-checked by the API. Upstream errors return HTTP 502 with a user-safe message.

### Deployment

The backend serves the contents of `docs/`, so a single Python web service can host both the frontend and API. Set the service start command to:

```sh
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

If you host `docs/` separately (for example with GitHub Pages), edit `docs/config.js` and set `window.WEATHER_API_BASE_URL` to the public backend origin. Set the backend's `FRONTEND_ORIGINS` environment variable to the frontend's origin, such as `https://skumat255-crypto.github.io`, to allow browser requests from that site.

## Browser dashboard

The dashboard asks for a city and state, region, or country, then lets the user confirm a matching location. It displays current conditions, feels-like temperature, humidity, wind, precipitation, a scrollable 24-hour forecast, a five-day forecast, Celsius/Fahrenheit switching, and up to six saved cities stored in the browser.

## C++ terminal client

### Requirements

- A C++17 compiler
- CMake 3.20 or newer
- libcurl development files
- Internet access on the first build (CMake downloads the JSON library) and when running the app

### Build and run

From the repository root:

```sh
cmake -S . -B build
cmake --build build
./build/weather_dashboard
```

On Windows, run `build\\Debug\\weather_dashboard.exe` (or `build\\weather_dashboard.exe`, depending on your generator). Enter a city when prompted. Add the country if a city name is ambiguous, for example `Paris, France`.

## Data and attribution

Weather data is provided by [Open-Meteo](https://open-meteo.com/). Location search uses its geocoding service, based on GeoNames. This learning project does not require an API key. Review Open-Meteo's terms and attribution requirements before using the project commercially.
