import { useState, useEffect, useRef } from "react";

// Configuration
const WS_URL = (import.meta.env.VITE_WS_URL?.trim())
  ? import.meta.env.VITE_WS_URL.trim()
  : (() => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.host}/api/ws/livetelemetry`;
    })();

const RECONNECT_INTERVAL = 3000;

let autoReconnect = true;

/**
 * Custom hook for managing WebSocket connection to live telemetry stream
 * @param {Function} onMessage - Callback function when telemetry message is received
 * @returns {Object} WebSocket connection state and control functions
 */
export function useWebSocketTelemetry(onMessage) {
  const [connected, setConnected] = useState(false);
  const [senderConnected, setSenderConnected] = useState(false);
  const [database_enabled, setDatabaseEnabled] = useState(true);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    try {
      console.log("Connecting to WebSocket:", WS_URL);
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("WebSocket Connected!");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "connection") {
            const source = String(data.source || "").toLowerCase();
            const message = String(data.message || "").toLowerCase();
            const isSenderEvent = source === "sender" || message.includes("sender");
            if (isSenderEvent) {
              setSenderConnected(data.status === "connected");
            }
            console.log("Connection confirmed:", data.message);
          } else if (data.type === "telemetry") {
            setSenderConnected(true);
            if (onMessage) {
              onMessage(data);
            }
          } else if (data.type === "database") {
            setDatabaseEnabled(data.database_enabled);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        setSenderConnected(false);
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
      autoReconnect = true;
    } catch (err) {
      console.error("Error creating WebSocket:", err);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnected(false);
    setSenderConnected(false);
    autoReconnect = false;
  };

  const togglePersist = async () => {
    const next = !database_enabled;
    await fetch(`/api/livetelemetry/db?enabled=${next}`, { method: "POST" });
    setDatabaseEnabled(next);
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial state of database persistence
  useEffect(() => {
    fetch("/api/livetelemetry/db", { method: "GET" })
      .then((res) => res.json())
      .then((data) => setDatabaseEnabled(data.database_enabled));
  }, []);

  return {
    connected,
    senderConnected,
    database_enabled,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    togglePersist,
  };
}