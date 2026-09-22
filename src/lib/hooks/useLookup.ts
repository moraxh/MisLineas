"use client";

import { useRef, useState } from "react";
import { QUERY_TIMEOUT_MS } from "@/lib/data/content";
import { LOCAL_LOOKUP } from "@/lib/local-client";
import { transformApiResponse } from "@/lib/lookup";
import { API_URL } from "@/lib/utils";
import type { DisplayLine, ProviderResponse } from "@/types";

export function useLookup(onConsult?: (curp: string) => void) {
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DisplayLine[] | null>(null);
  const [queryTime, setQueryTime] = useState<Date | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const consultar = async (curp: string, turnstileToken: string) => {
    abortRef.current?.abort();

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError(null);
    setResults([]);
    setTimedOut(false);
    setLoading(true);
    setQueryTime(null);
    setScannedCount(0);
    setLiveMessage("Iniciando consulta...");

    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
      if (requestIdRef.current !== requestId) {
        return;
      }

      setTimedOut(true);
      setLoading(false);
    }, QUERY_TIMEOUT_MS * 2);

    try {
      onConsult?.(curp);
      const response = await fetch(
        `${LOCAL_LOOKUP ? "" : API_URL}/api/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ curp: curp.toUpperCase(), turnstileToken }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) throw new Error("No body in response");

      if (requestIdRef.current !== requestId) {
        clearTimeout(timeoutId);
        return;
      }

      setQueryTime(new Date());

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const accumulated: ProviderResponse[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (requestIdRef.current !== requestId) {
          clearTimeout(timeoutId);
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const line of parts) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as ProviderResponse;
            accumulated.push(parsed);
          } catch (e) {
            console.error("Error parsing NDJSON chunk", line, e);
          }
        }

        setScannedCount(accumulated.length);
        setLiveMessage(`Escaneando proveedor ${accumulated.length}...`);
        setResults(transformApiResponse([...accumulated]));
      }

      if (requestIdRef.current !== requestId) {
        clearTimeout(timeoutId);
        return;
      }

      setLiveMessage("Consulta completada.");
      clearTimeout(timeoutId);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if ((err as Error)?.name === "AbortError") return;

      if (requestIdRef.current !== requestId) {
        return;
      }

      const msg =
        err instanceof Error
          ? err.message
          : "Error de conexión. Verifica tu red.";
      setError(msg);
      setLiveMessage(`Error: ${msg}`);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const retry = () => {
    abortRef.current?.abort();
    setTimedOut(false);
    setError(null);
  };

  const reset = () => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    setResults(null);
    setQueryTime(null);
    setError(null);
    setTimedOut(false);
    setScannedCount(0);
    setLiveMessage("");
    setLoading(false);
  };

  return {
    loading,
    timedOut,
    error,
    results,
    queryTime,
    scannedCount,
    liveMessage,
    consultar,
    retry,
    reset,
  };
}

export type UseLookupReturn = ReturnType<typeof useLookup>;
