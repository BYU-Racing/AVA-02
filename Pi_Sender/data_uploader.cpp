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

    webSocket.setOnMessageCallback([&](const ix::WebSocketMessagePtr& msg) {
        using Type = ix::WebSocketMessageType;

        if (msg->type == Type::Open) {
            std::cout << "Connected" << "\n";
        } else if (msg->type == Type::Message) {
            std::cout << "Received text msg: " << msg->str << "\n";
        } else if (msg->type == Type::Close) {
            std::cout << "Closed\n";
        } else if (msg->type == Type::Error) {
            std::cerr << "Error: " << msg->errorInfo.reason << "\n";
        }
    });
}

void fill(pi_to_server* pkt, uint32_t timestamp, uint8_t id, uint8_t length) { // Fill packets
    pkt->timestamp = timestamp;
    pkt->id = id;
    pkt->length = length;
}

int main() {
    setupWebSocket();
    
    pi_to_server thr1_pkt{};
    fill(&thr1_pkt, 123456, 1, 8);
    thr1_pkt.bytes[0] = static_cast<uint8_t>(42);
    std::string thr1_payload(sizeof(thr1_pkt), '\0');

    pi_to_server brk_pkt{};
    fill(&brk_pkt, 123456, 3, 8);
    brk_pkt.bytes[0] = static_cast<uint8_t>(30);
    std::string brk_payload(sizeof(brk_pkt), '\0');

    pi_to_server rpm_pkt{};
    fill(&rpm_pkt, 123456, 5, 8);
    rpm_pkt.bytes[0] = static_cast<uint8_t>(0xE8);
    rpm_pkt.bytes[1] = static_cast<uint8_t>(0x3);
    std::string rpm_payload(sizeof(rpm_pkt), '\0');
    

    webSocket.start();

    while(webSocket.getReadyState() != ix::ReadyState::Open) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    

    std::cout << "Press Ctrl+C to quit\n";
    while (true) { 
        std::this_thread::sleep_for(std::chrono::milliseconds(100)); 

        // Flip-flop between 42 and 43 for throttle 1
        thr1_pkt.bytes[0] = thr1_pkt.bytes[0] == 42 ? static_cast<uint8_t>(43) : static_cast<uint8_t>(42);

        // Flip-flop between 30 and 35 for brake
        brk_pkt.bytes[0] = brk_pkt.bytes[0] == 30 ? static_cast<uint8_t>(35) : static_cast<uint8_t>(30);

        // Increases rpm by 1
        if(rpm_pkt.bytes[0] == 255) {
            rpm_pkt.bytes[0] = 0;
            rpm_pkt.bytes[1] += 1;
        }
        rpm_pkt.bytes[0] += 1;

        std::memcpy(thr1_payload.data(), &thr1_pkt, sizeof(thr1_pkt));
        std::memcpy(brk_payload.data(), &brk_pkt, sizeof(brk_pkt));
        std::memcpy(rpm_payload.data(), &rpm_pkt, sizeof(rpm_pkt));
        webSocket.sendBinary(thr1_payload);
        webSocket.sendBinary(brk_payload);
        webSocket.sendBinary(rpm_payload);
    }
    

    webSocket.stop();

    ix::uninitNetSystem();

    return 0;
}