cmake_minimum_required(VERSION 3.16)
project(ava_sender LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
  IXWebSocket
  GIT_REPOSITORY https://github.com/machinezone/IXWebSocket.git
  GIT_TAG master
)
FetchContent_MakeAvailable(IXWebSocket)

add_executable(ava_sender data_uploader.cpp)

# Enable TLS in IX (uses OpenSSL on Linux by default when enabled)
# (IX's CMake options are documented in their build docs.) 
# We'll just link to the target; the FetchContent build will honor defaults/options.
target_link_libraries(ava_sender PRIVATE ixwebsocket)

# If you want to force TLS ON explicitly:
# set(USE_TLS ON CACHE BOOL "" FORCE)
