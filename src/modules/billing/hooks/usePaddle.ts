import { useEffect, useRef, useCallback } from "react";
import useConfig from "@modules/app/hooks/useConfig";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string; eventCallback?: (event: { name: string; data?: unknown }) => void }) => void;
      Checkout: { open: (opts: { transactionId: string }) => void };
      Initialized?: boolean;
    };
    __paddleReady?: boolean;
  }
}

type PaddleEventHandler = (event: { name: string; data?: unknown }) => void;

export default function usePaddle(onEvent?: PaddleEventHandler) {
  const { paddleClientToken, paddleEnvironment, loading } = useConfig();
  const initialized = useRef(false);
  const eventHandler = useRef(onEvent);
  eventHandler.current = onEvent;

  useEffect(() => {
    if (loading || !paddleClientToken || initialized.current) return;
    if (window.__paddleReady) { initialized.current = true; return; }

    initialized.current = true;

    const script = document.createElement("script");
    script.src = paddleEnvironment === "sandbox"
      ? "https://sandbox-cdn.paddle.com/paddle/v2/paddle.js"
      : "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (!window.Paddle) return;
      if (paddleEnvironment !== "production") {
        window.Paddle.Environment.set(paddleEnvironment);
      }
      window.Paddle.Initialize({
        token: paddleClientToken,
        eventCallback: (event) => eventHandler.current?.(event),
      });
      window.__paddleReady = true;
    };
    document.head.appendChild(script);
  }, [loading, paddleClientToken, paddleEnvironment]);

  const openCheckout = useCallback((transactionId: string) => {
    const tryOpen = (attempts: number) => {
      if (window.__paddleReady && window.Paddle) {
        window.Paddle.Checkout.open({ transactionId });
      } else if (attempts > 0) {
        setTimeout(() => tryOpen(attempts - 1), 200);
      }
    };
    tryOpen(25);
  }, []);

  return { openCheckout, ready: initialized.current && !!window.__paddleReady };
}
