# Weather Dashboard: C++ and Web

This project includes two ways to check the weather:

- A beginner-friendly C++ terminal app.
- A responsive browser dashboard in `docs/`, ready to publish with GitHub Pages.

Both versions search for a city and use the free Open-Meteo geocoding and forecast APIs. No API key is needed for this learning project.

## Web dashboard

The web version has city search, current conditions, humidity, wind, precipitation, a scrollable 24-hour forecast, a five-day forecast, and Celsius/Fahrenheit switching.

To preview it locally, start a small web server from the project folder:

```sh
python3 -m http.server 8000 --directory docs
```

Then open <http://localhost:8000> in your browser. Press Control+C in Terminal to stop the server.

### Publish with GitHub Pages

1. Push the project to the `main` branch.
2. On GitHub, open the repository and go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**, then click **Save**.
5. GitHub will show the published website link on the Pages settings screen after deployment.

The project page is `https://skumat255-crypto.github.io/weather-dashboard-cpp/` once Pages is enabled.

## What it shows

- Weather conditions
- Temperature and feels-like temperature
- Humidity
- Wind speed
- Precipitation
- Observation time

## Requirements

- A C++17 compiler
- CMake 3.20 or newer
- libcurl development files
- Internet access on the first build (CMake downloads the JSON library) and when running the app

## Build and run

From this folder:

```sh
cmake -S . -B build
cmake --build build
./build/weather_dashboard
```

On Windows, run `build\\Debug\\weather_dashboard.exe` (or `build\\weather_dashboard.exe`, depending on your generator).

Enter a city when prompted. Add the country if a city name is ambiguous, for example `Paris, France`.

## Data and attribution

Weather data comes from [Open-Meteo](https://open-meteo.com/). Location search uses its geocoding service, based on GeoNames. The web dashboard links to Open-Meteo for attribution. Check Open-Meteo's terms and attribution requirements before using this project commercially.
