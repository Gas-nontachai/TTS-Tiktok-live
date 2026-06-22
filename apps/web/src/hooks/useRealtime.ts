import { useEffect } from "react";
import { wsUrl } from "../services/api";
import { useAppStore } from "../stores/appStore";
import type { WsEvent } from "../types";

export function useRealtime() {
  const addOverlayEvent = useAppStore((state) => state.addOverlayEvent);
  const addChatMessage = useAppStore((state) => state.addChatMessage);
  const addLog = useAppStore((state) => state.addLog);
  const clearChat = useAppStore((state) => state.clearChat);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setConfig = useAppStore((state) => state.setConfig);
  const setStatus = useAppStore((state) => state.setStatus);
  const setStats = useAppStore((state) => state.setStats);
  const setError = useAppStore((state) => state.setError);
  const setWsConnected = useAppStore((state) => state.setWsConnected);
  const setChatPaused = useAppStore((state) => state.setChatPaused);

  useEffect(() => {
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let closedByEffect = false;

    const connect = () => {
      socket = new WebSocket(wsUrl());

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as WsEvent;

        if (message.type === "config_updated") {
          setConfig(message.payload);
        }

        if (message.type === "overlay_event") {
          addOverlayEvent(message.payload);
        }

        if (message.type === "chat_message") {
          addChatMessage(message.payload);
        }

        if (message.type === "chat_control") {
          if (message.payload.action === "clear") {
            clearChat();
          }
          if (message.payload.action === "pause") {
            setChatPaused(true);
          }
          if (message.payload.action === "resume") {
            setChatPaused(false);
          }
        }

        if (message.type === "chat_config_updated") {
          patchConfig({ chat: message.payload });
        }

        if (message.type === "chat_stats_updated") {
          const current = useAppStore.getState().stats;
          setStats({ ...current, ...message.payload });
        }

        if (message.type === "status") {
          setStatus(message.payload);
        }

        if (message.type === "stats") {
          setStats(message.payload);
        }

        if (message.type === "log") {
          addLog(message.payload);
        }

        if (message.type === "error") {
          setError(message.payload.message);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);

        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [
    addChatMessage,
    addLog,
    addOverlayEvent,
    clearChat,
    patchConfig,
    setConfig,
    setChatPaused,
    setError,
    setStats,
    setStatus,
    setWsConnected
  ]);
}
