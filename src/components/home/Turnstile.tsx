"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "light";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "timeout-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly recreates a failed widget.
  useEffect(() => {
    const api = window.turnstile;
    if (!ready || !sitekey || !container.current || !api) return;
    const invalidate = () => callback.current("");
    let id: string;
    try {
      id = api.render(container.current, {
        sitekey,
        action: "lookup",
        theme: "light",
        size: "flexible",
        callback: (token) => {
          setFailed(false);
          callback.current(token);
        },
        "expired-callback": invalidate,
        "timeout-callback": () => {
          invalidate();
          setFailed(true);
        },
        "error-callback": () => {
          invalidate();
          setFailed(true);
        },
      });
    } catch {
      invalidate();
      setFailed(true);
      return;
    }
    return () => {
      api.remove(id);
      invalidate();
    };
  }, [ready, sitekey, attempt]);

  if (!sitekey) {
    return (
      <p role="alert" className="text-sm text-red-600">
        La verificación de seguridad no está configurada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() => {
          callback.current("");
          setFailed(true);
        }}
      />
      <div ref={container} />
      {failed && (
        <p role="alert" className="text-sm text-red-600">
          No se pudo completar la verificación.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              if (!window.turnstile) {
                window.location.reload();
                return;
              }
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Reintentar verificación
          </button>
        </p>
      )}
    </div>
  );
}
