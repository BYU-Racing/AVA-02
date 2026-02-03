#include <ixwebsocket/IXWebSocket.h>
#include <ixwebsocket/IXNetSystem.h>

#include <iostream>
#include <cstdint>
#include <cstring>
#include <string>

/*
{
    timestamp: int,
    id: int,
    length: int, // up to 8
    bytes: List[int], // length: up to 8
}
*/
struct pi_to_server {
    uint32_t timestamp;
    uint8_t id;
    uint8_t length;
    uint8_t bytes[8];
} __attribute__((packed));

static_assert(sizeof(pi_to_server) == 14, "pi_to_server must be 14 bytes");

ix::WebSocket webSocket;
std::string url = "ws://ava-02.us-east-2.elasticbeanstalk.com/api/ws/send";

void setupWebSocket() {
    ix::initNetSystem();

    webSocket.setUrl(url);

    webSocket.disableAutomaticReconnection(); // start simple

    
}

int main() {
    setupWebSocket();

    webSocket.send("hello world");

    // The message can be sent in BINARY mode (useful if you send MsgPack data for example)
    webSocket.sendBinary("some serialized binary data");
    

    // Build a test packet
    pi_to_server pkt{};
    pkt.timestamp = 123456;
    pkt.id = 1;
    pkt.length = 8;
    for (int i = 0; i < 8; i++) pkt.bytes[i] = static_cast<uint8_t>(1);

    std::string payload(sizeof(pkt), '\0');
    std::memcpy(payload.data(), &pkt, sizeof(pkt));

    webSocket.setOnMessageCallback([&](const ix::WebSocketMessagePtr& msg) {
        using Type = ix::WebSocketMessageType;

        if (msg->type == Type::Open) {
            std::cout << "Connected, sending " << payload.size() << " bytes\n";
            webSocket.sendBinary(payload);
        } else if (msg->type == Type::Message) {
            std::cout << "Received text msg: " << msg->str << "\n";
        } else if (msg->type == Type::Close) {
            std::cout << "Closed\n";
        } else if (msg->type == Type::Error) {
            std::cerr << "Error: " << msg->errorInfo.reason << "\n";
        }
    });

    webSocket.start();

    std::cout << "Press Ctrl+C to quit\n";
    while (true) { std::this_thread::sleep_for(std::chrono::seconds(1)); }
    

    webSocket.stop();

    ix::uninitNetSystem();

    return 0;
}