import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import type { WsEvent } from "../types";
import { wsUrl } from "../services/api";

export function useRealtime() {
  const addComment = useAppStore((state) => state.addComment);
  const setStatus = useAppStore((state) => state.setStatus);
  const setError = useAppStore((state) => state.setError);
  const setWsConnected = useAppStore((state) => state.setWsConnected);

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

        if (message.event === "comment") {
          addComment(message.data);
        }

        if (message.event === "status") {
          setStatus(message.data);
        }

        if (message.event === "error") {
          setError(message.data.message);
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
  }, [addComment, setError, setStatus, setWsConnected]);
}

