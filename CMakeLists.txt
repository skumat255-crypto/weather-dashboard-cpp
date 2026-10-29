cmake_minimum_required(VERSION 3.20)
project(weather_dashboard LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)
find_package(CURL REQUIRED)

FetchContent_Declare(json
    URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_MakeAvailable(json)

add_executable(weather_dashboard src/main.cpp)
target_link_libraries(weather_dashboard PRIVATE CURL::libcurl nlohmann_json::nlohmann_json)
