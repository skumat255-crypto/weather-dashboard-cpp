# C++ Weather Dashboard

A beginner-friendly terminal app that searches for a city and displays its current weather. It uses the free Open-Meteo geocoding and forecast APIs, so no API key is needed for this learning project.

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

Weather data comes from [Open-Meteo](https://open-meteo.com/). Location search uses its geocoding service, based on GeoNames. Check Open-Meteo's terms and attribution requirements before publishing or using this app commercially.
