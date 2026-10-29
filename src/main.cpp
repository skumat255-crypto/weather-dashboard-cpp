#include <curl/curl.h>
#include <nlohmann/json.hpp>

#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

using json = nlohmann::json;

namespace {

size_t receive_data(char* contents, size_t size, size_t count, void* output) {
    const size_t bytes = size * count;
    static_cast<std::string*>(output)->append(contents, bytes);
    return bytes;
}

std::string get(const std::string& url) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        throw std::runtime_error("Could not start the network request.");
    }

    std::string response;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, receive_data);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "weather-dashboard-cpp/1.0");
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);

    const CURLcode result = curl_easy_perform(curl);
    long status = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
    curl_easy_cleanup(curl);

    if (result != CURLE_OK) {
        throw std::runtime_error(std::string("Network error: ") + curl_easy_strerror(result));
    }
    if (status < 200 || status >= 300) {
        throw std::runtime_error("The weather service returned HTTP " + std::to_string(status) + ".");
    }
    return response;
}

std::string describe_weather(int code) {
    if (code == 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code == 45 || code == 48) return "Foggy";
    if (code == 51 || code == 53 || code == 55) return "Drizzle";
    if (code == 56 || code == 57) return "Freezing drizzle";
    if (code == 61 || code == 63 || code == 65) return "Rain";
    if (code == 66 || code == 67) return "Freezing rain";
    if (code == 71 || code == 73 || code == 75 || code == 77) return "Snow";
    if (code == 80 || code == 81 || code == 82) return "Rain showers";
    if (code == 85 || code == 86) return "Snow showers";
    if (code == 95 || code == 96 || code == 99) return "Thunderstorm";
    return "Unknown conditions";
}

}  // namespace

int main() {
    std::cout << "==============================\n"
              << "       WEATHER DASHBOARD      \n"
              << "==============================\n"
              << "Enter a city (or q to quit): ";

    std::string city;
    std::getline(std::cin, city);
    if (city.empty() || city == "q" || city == "Q") {
        std::cout << "Goodbye!\n";
        return 0;
    }

    CURL* encoder = curl_easy_init();
    if (!encoder) {
        std::cerr << "Could not initialize the URL encoder.\n";
        return 1;
    }
    char* escaped_city = curl_easy_escape(encoder, city.c_str(), static_cast<int>(city.size()));
    if (!escaped_city) {
        curl_easy_cleanup(encoder);
        std::cerr << "Could not encode that city name.\n";
        return 1;
    }
    const std::string query(escaped_city);
    curl_free(escaped_city);
    curl_easy_cleanup(encoder);

    try {
        const json locations = json::parse(get(
            "https://geocoding-api.open-meteo.com/v1/search?name=" + query + "&count=1&language=en&format=json"));
        if (!locations.contains("results") || locations["results"].empty()) {
            std::cout << "No matching city found. Try adding a country, like: Paris, France\n";
            return 0;
        }

        const json location = locations["results"][0];
        const double latitude = location.at("latitude").get<double>();
        const double longitude = location.at("longitude").get<double>();
        const std::string place = location.at("name").get<std::string>();
        const std::string country = location.value("country", "");

        const std::string weather_url =
            "https://api.open-meteo.com/v1/forecast?latitude=" + std::to_string(latitude) +
            "&longitude=" + std::to_string(longitude) +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
            "&timezone=auto";
        const json forecast = json::parse(get(weather_url));
        const json current = forecast.at("current");
        const json units = forecast.at("current_units");

        std::cout << "\nWeather for " << place;
        if (!country.empty()) std::cout << ", " << country;
        std::cout << "\n" << std::string(30, '-') << "\n"
                  << "Conditions:       " << describe_weather(current.at("weather_code").get<int>()) << "\n"
                  << "Temperature:      " << current.at("temperature_2m") << " " << units.at("temperature_2m") << "\n"
                  << "Feels like:       " << current.at("apparent_temperature") << " " << units.at("apparent_temperature") << "\n"
                  << "Humidity:         " << current.at("relative_humidity_2m") << " " << units.at("relative_humidity_2m") << "\n"
                  << "Wind speed:       " << current.at("wind_speed_10m") << " " << units.at("wind_speed_10m") << "\n"
                  << "Precipitation:    " << current.at("precipitation") << " " << units.at("precipitation") << "\n"
                  << "Updated:          " << current.at("time") << "\n";
    } catch (const std::exception& error) {
        std::cerr << "\nSorry, I could not get the weather. " << error.what() << "\n";
        return 1;
    }

    return 0;
}
