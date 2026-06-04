import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@modules/app/domain/constants/env";

type EventName =
  | "ticket.created"
  | "ticket.statusChanged"
  | "ticket.assigned"
  | "comment.created";

type Listener = (data: Record<string, unknown>) => void;

export default function useWebSocket(
  workspaceSlug: string | undefined,
  listeners: Partial<Record<EventName, Listener>>,
) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  const EVENT_NAMES: EventName[] = [
    "ticket.created",
    "ticket.statusChanged",
    "ticket.assigned",
    "comment.created",
  ];

  const connect = useCallback(() => {
    if (!workspaceSlug) return;

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      socket.emit("join", workspaceSlug);
    });

    for (const event of EVENT_NAMES) {
      socket.on(event, (data: Record<string, unknown>) => {
        listenersRef.current[event]?.(data);
      });
    }

    socketRef.current = socket;

    return () => {
      socket.emit("leave", workspaceSlug);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceSlug]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}
