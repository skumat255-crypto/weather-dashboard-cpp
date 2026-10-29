const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const regionInput = document.querySelector("#region-input");
const statusMessage = document.querySelector("#status");
const weatherContent = document.querySelector("#weather-content");
const locationChoices = document.querySelector("#location-choices");
const locationList = document.querySelector("#location-list");
const forecastList = document.querySelector("#forecast-list");
const hourlyList = document.querySelector("#hourly-list");
const unitButtons = [...document.querySelectorAll("[data-unit]")];

let temperatureUnit = "celsius";
let activeLocation = null;

const weatherTypes = {
  0: ["Clear sky", "☀️"],
  1: ["Mostly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "🌧️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️"],
};

function weatherFor(code) {
  return weatherTypes[code] ?? ["Variable conditions", "🌤️"];
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function formatNumber(value) {
  return Math.round(Number(value));
}

function temperatureSymbol(units) {
  return units.temperature_2m ?? (temperatureUnit === "celsius" ? "°C" : "°F");
}

async function findCities(cityName, regionName) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({ name: `${cityName}, ${regionName}`, count: "5", language: "en", format: "json" });
  const response = await fetch(url);
  if (!response.ok) throw new Error("City search is unavailable right now.");
  const data = await response.json();
  if (!data.results?.length) throw new Error("We couldn’t find that city and region. Check the spelling or try the country name.");
  return data.results;
}

async function getForecast(location) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    temperature_unit: temperatureUnit,
    timezone: "auto",
    forecast_days: "5",
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error("The forecast service is unavailable right now.");
  return response.json();
}

function dayName(date, index) {
  if (index === 0) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

function renderForecast(daily, units) {
  forecastList.replaceChildren();
  daily.time.forEach((date, index) => {
    const [description, icon] = weatherFor(daily.weather_code[index]);
    const card = document.createElement("article");
    card.className = `forecast-day${index === 0 ? " today" : ""}`;
    card.setAttribute("aria-label", `${dayName(date, index)}: ${description}, high ${formatNumber(daily.temperature_2m_max[index])}, low ${formatNumber(daily.temperature_2m_min[index])}`);

    const name = document.createElement("p");
    name.className = "day-name";
    name.textContent = dayName(date, index);
    const symbol = document.createElement("span");
    symbol.className = "day-icon";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = icon;
    const condition = document.createElement("p");
    condition.className = "day-condition";
    condition.textContent = description;
    const temperatures = document.createElement("div");
    temperatures.className = "day-temps";
    const high = document.createElement("span");
    high.className = "day-high";
    high.textContent = `${formatNumber(daily.temperature_2m_max[index])}°`;
    const low = document.createElement("span");
    low.className = "day-low";
    low.textContent = `${formatNumber(daily.temperature_2m_min[index])}°`;
    temperatures.append(high, low);

    const rain = document.createElement("p");
    rain.className = "rain-chance";
    const chance = daily.precipitation_probability_max?.[index];
    rain.textContent = chance == null ? " " : `Rain ${formatNumber(chance)}%`;
    card.append(name, symbol, condition, temperatures, rain);
    forecastList.append(card);
  });

  document.querySelector("#high-low").textContent =
    `H: ${formatNumber(daily.temperature_2m_max[0])}${units.temperature_2m}   L: ${formatNumber(daily.temperature_2m_min[0])}${units.temperature_2m}`;
}

function clockLabel(dateTime) {
  const [hourPart, minute = "00"] = dateTime.split("T")[1].split(":");
  const hour = Number(hourPart);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function renderHourly(hourly, currentTime, units) {
  hourlyList.replaceChildren();
  const firstIndex = hourly.time.findIndex((time) => time >= currentTime);
  const start = firstIndex < 0 ? 0 : firstIndex;
  const hours = hourly.time.slice(start, start + 24);

  hours.forEach((time, offset) => {
    const index = start + offset;
    const [description, icon] = weatherFor(hourly.weather_code[index]);
    const item = document.createElement("article");
    item.className = "hourly-item";
    item.setAttribute("aria-label", `${clockLabel(time)}: ${description}, ${formatNumber(hourly.temperature_2m[index])}${units.temperature_2m}, rain chance ${hourly.precipitation_probability[index] ?? 0}%`);

    const timeLabel = document.createElement("p");
    timeLabel.className = "hourly-time";
    timeLabel.textContent = offset === 0 ? "Now" : clockLabel(time);
    const symbol = document.createElement("span");
    symbol.className = "hourly-icon";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = icon;
    const temperature = document.createElement("p");
    temperature.className = "hourly-temperature";
    temperature.textContent = `${formatNumber(hourly.temperature_2m[index])}${units.temperature_2m}`;
    const rain = document.createElement("p");
    rain.className = "hourly-rain";
    const chance = hourly.precipitation_probability[index];
    rain.textContent = chance == null ? "Rain —" : `Rain ${formatNumber(chance)}%`;
    item.append(timeLabel, symbol, temperature, rain);
    hourlyList.append(item);
  });
}

function renderLocationChoices(locations) {
  locationList.replaceChildren();
  locations.forEach((location) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-option";
    const text = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = location.name;
    const details = document.createElement("small");
    details.textContent = [location.admin1, location.country].filter(Boolean).join(", ") || "Location match";
    text.append(title, details);
    const arrow = document.createElement("span");
    arrow.className = "location-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    button.append(text, arrow);
    button.addEventListener("click", () => selectLocation(location));
    locationList.append(button);
  });
  locationChoices.hidden = false;
}

async function selectLocation(location) {
  locationChoices.hidden = true;
  setStatus(`Getting weather for ${location.name}…`);
  try {
    const forecast = await getForecast(location);
    activeLocation = location;
    renderWeather(location, forecast);
  } catch (error) {
    setStatus(error instanceof TypeError ? "Couldn’t connect. Check your internet and try again." : error.message, true);
  }
}

function renderWeather(location, forecast) {
  const current = forecast.current;
  const units = forecast.current_units;
  const [description, icon] = weatherFor(current.weather_code);
  const place = [location.name, location.admin1, location.country]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");

  document.querySelector("#place").textContent = place;
  document.querySelector("#local-time").textContent = `Local time ${current.time.replace("T", " · ")}`;
  document.querySelector("#temperature").textContent = `${formatNumber(current.temperature_2m)}°`;
  document.querySelector("#condition").textContent = description;
  document.querySelector("#weather-symbol").textContent = icon;
  document.querySelector("#feels-like").textContent = `Feels like ${formatNumber(current.apparent_temperature)}${temperatureSymbol(units)}`;
  document.querySelector("#humidity").textContent = `${formatNumber(current.relative_humidity_2m)}${units.relative_humidity_2m}`;
  document.querySelector("#wind").textContent = `${formatNumber(current.wind_speed_10m)} ${units.wind_speed_10m}`;
  document.querySelector("#precipitation").textContent = `${Number(current.precipitation).toFixed(1)} ${units.precipitation}`;

  renderForecast(forecast.daily, units);
  renderHourly(forecast.hourly, current.time, forecast.hourly_units);
  weatherContent.hidden = false;
  setStatus(`Showing live conditions for ${location.name}.`);
}

async function loadCity(cityName, regionName) {
  setStatus(`Looking up ${cityName.trim()}, ${regionName.trim()}…`);
  weatherContent.hidden = true;
  locationChoices.hidden = true;
  try {
    const locations = await findCities(cityName.trim(), regionName.trim());
    renderLocationChoices(locations);
    setStatus("Choose the matching location to see its weather.");
  } catch (error) {
    setStatus(error instanceof TypeError ? "Couldn’t connect. Check your internet and try again." : error.message, true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  const region = regionInput.value.trim();
  if (city && region) loadCity(city, region);
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextUnit = button.dataset.unit;
    if (nextUnit === temperatureUnit) return;
    temperatureUnit = nextUnit;
    unitButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    if (activeLocation) {
      getForecast(activeLocation)
        .then((forecast) => renderWeather(activeLocation, forecast))
        .catch(() => setStatus("Couldn’t update units. Try again in a moment.", true));
    }
  });
});

