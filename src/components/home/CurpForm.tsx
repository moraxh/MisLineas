"use client";

import {
  AlertCircle,
  ArrowRight,
  ClipboardPaste,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Turnstile } from "@/components/home/Turnstile";
import { getCurpValidationError } from "@/lib/curp";
import { cn } from "@/lib/utils";

interface CurpFormProps {
  curp: string;
  setCurp: (v: string) => void;
  loading: boolean;
  error: string | null;
  timedOut: boolean;
  history: string[];
  onSubmit: (e: React.FormEvent, turnstileToken: string) => void;
  onRetry: () => void;
  onSelectHistory: (v: string) => void;
}

export function CurpForm({
  curp,
  setCurp,
  loading,
  error,
  timedOut,
  history,
  onSubmit,
  onRetry,
  onSelectHistory,
}: CurpFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const curpValidationError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpValidationError;
  const curpCountColor =
    curp.length === 18 && !curpValidationError
      ? "text-emerald-500"
      : curp.length === 18
        ? "text-red-500"
        : "text-zinc-400";

  const handlePasteCurp = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const sanitized = text
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 18);
      if (sanitized) setCurp(sanitized);
    } catch {}
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-950/5 sm:p-7">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (loading || !curpIsValid || !turnstileToken) return;
          const token = turnstileToken;
          setTurnstileToken("");
          setVerificationAttempt((value) => value + 1);
          onSubmit(event, token);
        }}
        className="space-y-5"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Consulta en tiempo real
            </p>
            <label
              htmlFor="curp-input"
              className="block text-lg font-semibold tracking-tight text-zinc-950"
            >
              Ingresa tu CURP para consultar tus líneas
            </label>
            <p className="pt-1 text-sm leading-6 text-zinc-500">
              Escribe los 18 caracteres de tu CURP.
            </p>
          </div>
          <label htmlFor="curp-input" className="sr-only">
            Ingresa tu CURP
          </label>
          <div className="relative">
            <input
              type="text"
              id="curp-input"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Ej. XXXX000000XXXXXX00"
              className={cn(
                "min-h-14 w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-4 pr-28 text-base outline-none transition-all placeholder:text-zinc-400",
                "focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5",
                "font-mono uppercase",
                curpValidationError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                  : "",
              )}
              value={curp}
              onChange={(e) =>
                setCurp(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 18),
                )
              }
              maxLength={18}
              minLength={18}
              required
              spellCheck={false}
              enterKeyHint="search"
              disabled={loading}
              aria-describedby={curpValidationError ? "curp-error" : undefined}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <output
                className={cn(
                  "text-xs font-mono font-medium tabular-nums transition-colors",
                  curpCountColor,
                )}
                aria-label={`${curp.length} de 18 caracteres`}
              >
                {curp.length}/18
              </output>
              {curp.length > 0 && !loading && (
                <button
                  type="button"
                  onClick={() => setCurp("")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  aria-label="Limpiar CURP"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteCurp}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                title="Pegar desde el portapapeles"
                aria-label="Pegar CURP desde portapapeles"
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>
          </div>
          {curpValidationError && (
            <p
              id="curp-error"
              className="text-xs text-red-600 font-medium"
              role="alert"
            >
              {curpValidationError}
            </p>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3.5 text-sm leading-5 text-emerald-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>
              Tu CURP se utiliza para realizar esta consulta en tiempo real. No
              necesitas crear una cuenta y el historial visible se conserva
              únicamente en tu navegador.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <p className="text-zinc-500">
              ¿No recuerdas tu CURP?{" "}
              <a
                href="https://www.gob.mx/curp"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-900 transition-colors"
              >
                Consúltala en gob.mx
              </a>
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">
                Búsquedas recientes:
              </p>
              <span className="text-[10px] text-zinc-400">
                Guardadas solo en tu navegador
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={loading}
                  onClick={() => onSelectHistory(h)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectHistory(h);
                    }
                  }}
                  className="text-xs font-mono px-2.5 py-1 bg-zinc-100/80 text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100/80 disabled:hover:text-zinc-600"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <Turnstile key={verificationAttempt} onToken={setTurnstileToken} />
        )}

        <button
          type="submit"
          disabled={loading || !curpIsValid || !turnstileToken}
          aria-disabled={loading || !curpIsValid || !turnstileToken}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validando...</span>
            </>
          ) : (
            <>
              <span>Realizar Consulta</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {(error || timedOut) && (
        <div
          className="mt-4 flex gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p>
              {timedOut
                ? "La consulta excedió el tiempo límite. Intenta de nuevo."
                : error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 font-medium underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
