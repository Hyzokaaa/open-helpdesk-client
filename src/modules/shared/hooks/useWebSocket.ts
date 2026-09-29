import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@modules/app/domain/constants/env";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import { ACCESS_TOKEN_CHANGED_EVENT } from "@modules/app/domain/core/session";
import { renewSession } from "@modules/app/modules/http/domain/http";

type EventName =
  | "ticket.created"
  | "ticket.statusChanged"
  | "ticket.assigned"
  | "comment.created";

/** Events carry ids only: fetch what changed through the API, which applies the user's permissions. */
export interface RealtimeEvent {
  ticketId: string;
  workspaceSlug: string;
}

type Listener = (data: RealtimeEvent) => void;

// Consecutive server-side drops tolerated before giving up until the page reloads
const MAX_REAUTH_ATTEMPTS = 3;

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
      // Read on every (re)connection, so it always carries the latest access token
      auth: (cb) => cb({ token: LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN) }),
    });

    let reauthAttempts = 0;

    socket.on("connect", () => {
      reauthAttempts = 0;
      socket.emit("join", workspaceSlug);
    });

    // The server drops a socket whose token lapsed or was refused, and socket.io does not retry
    // those on its own: renew the session, then reconnect with the new token.
    socket.on("disconnect", async (reason) => {
      if (reason !== "io server disconnect" || reauthAttempts >= MAX_REAUTH_ATTEMPTS) return;
      reauthAttempts += 1;
      if (await renewSession()) socket.connect();
    });

    for (const event of EVENT_NAMES) {
      socket.on(event, (data: RealtimeEvent) => {
        listenersRef.current[event]?.(data);
      });
    }

    // Hand the renewed token to the open socket so it is not dropped when the old one expires.
    // This tab announces its own renewals; other tabs' show up as storage changes.
    const sendToken = () => {
      const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
      if (token && socket.connected) socket.emit("auth", token);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY.ACCESS_TOKEN) sendToken();
    };
    window.addEventListener(ACCESS_TOKEN_CHANGED_EVENT, sendToken);
    window.addEventListener("storage", onStorage);

    socketRef.current = socket;

    return () => {
      window.removeEventListener(ACCESS_TOKEN_CHANGED_EVENT, sendToken);
      window.removeEventListener("storage", onStorage);
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
