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
import { Turnstile, type TurnstileStatus } from "@/components/home/Turnstile";
import { getCurpValidationError } from "@/lib/curp";
import { cn } from "@/lib/utils";
import styles from "./CurpForm.module.css";

interface CurpFormProps {
  variant?: "default" | "pill";
  curp: string;
  setCurp: (v: string) => void;
  loading: boolean;
  error: string | null;
  timedOut: boolean;
  history: string[];
  onSubmit: (e: React.FormEvent, turnstileToken: string) => void;
  onRetry: () => void;
  onSelectHistory: (v: string) => void;
  onClearHistory?: () => void;
}

export function CurpForm({
  variant = "default",
  curp,
  setCurp,
  loading,
  error,
  timedOut,
  history,
  onSubmit,
  onRetry,
  onSelectHistory,
  onClearHistory,
}: CurpFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("loading");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const curpValidationError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpValidationError;
  const curpCountState = curpIsValid
    ? styles.countValid
    : curp.length === 18
      ? styles.countInvalid
      : "";

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

  const curpField = (
    <div className={styles.field}>
      <input
        type="text"
        id="curp-input"
        name="curp"
        autoComplete="off"
        autoCapitalize="characters"
        placeholder={
          variant === "pill" ? "XXXX000000XXXXXX00" : "Ej. XXXX000000XXXXXX00"
        }
        className={cn(
          styles.input,
          variant === "pill" ? styles.pillInput : "",
          curpValidationError ? styles.inputInvalid : "",
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
        inputMode="text"
        enterKeyHint="search"
        disabled={loading}
        aria-invalid={curpValidationError ? true : undefined}
        aria-describedby={curpValidationError ? "curp-error" : undefined}
      />
      <div className={styles.inputTools}>
        <output
          className={cn(styles.count, curpCountState)}
          aria-label={`${curp.length} de 18 caracteres`}
        >
          {curp.length}/18
        </output>
        {curp.length > 0 && !loading && (
          <button
            type="button"
            onClick={() => setCurp("")}
            className={styles.inputAction}
            aria-label="Limpiar CURP"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handlePasteCurp}
          className={styles.inputAction}
          title="Pegar desde el portapapeles"
          aria-label="Pegar CURP desde portapapeles"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const verificationPending =
    !turnstileToken &&
    (turnstileStatus === "loading" || turnstileStatus === "verifying");
  const verificationExpired = !turnstileToken && turnstileStatus === "expired";

  const submitButton = (
    <button
      type="submit"
      disabled={loading || !curpIsValid || !turnstileToken}
      aria-disabled={loading || !curpIsValid || !turnstileToken}
      className={cn(styles.submit, variant === "pill" ? styles.pillSubmit : "")}
    >
      {loading ? (
        <>
          <Loader2 className={styles.spinner} />
          <span>Validando...</span>
        </>
      ) : verificationPending ? (
        <>
          <Loader2 className={styles.spinner} />
          <span>Preparando verificación...</span>
        </>
      ) : verificationExpired ? (
        <span>Verificación expirada, reintenta</span>
      ) : (
        <>
          <span>{variant === "pill" ? "Consultar" : "Realizar Consulta"}</span>
          <ArrowRight className={styles.submitIcon} />
        </>
      )}
    </button>
  );

  const historySection = history.length > 0 && (
    <div className={styles.history}>
      <div className={styles.historyHeader}>
        {variant !== "pill" && (
          <p className={styles.historyLabel}>Búsquedas recientes:</p>
        )}
        {variant === "pill" ? (
          <div className={styles.historyMeta}>
            {onClearHistory && (
              <button
                type="button"
                className={styles.clearHistory}
                onClick={onClearHistory}
                disabled={loading}
                aria-label="Borrar historial de CURP"
              >
                Borrar historial
              </button>
            )}
          </div>
        ) : (
          <span className={styles.historyStorage}>
            Guardadas solo en tu navegador
          </span>
        )}
      </div>
      <div className={styles.historyList}>
        {history.map((h) => (
          <button
            key={h}
            type="button"
            disabled={loading}
            onClick={() => onSelectHistory(h)}
            className={styles.historyItem}
            aria-label={
              variant === "pill"
                ? `Usar CURP que empieza con ${h.slice(0, 4)} y termina en ${h.slice(-2)}`
                : undefined
            }
          >
            {variant === "pill"
              ? `${h.slice(0, 4)}${"•".repeat(Math.max(h.length - 6, 0))}${h.slice(-2)}`
              : h}
          </button>
        ))}
      </div>
    </div>
  );

  const curpHelpLink = (
    <div className={styles.curpHelpLink}>
      <p>
        ¿No recuerdas tu CURP?{" "}
        <a
          href="https://www.gob.mx/curp"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalLink}
        >
          Consúltala en gob.mx
        </a>
      </p>
    </div>
  );

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (loading || !curpIsValid || !turnstileToken) return;
          const token = turnstileToken;
          setTurnstileToken("");
          setTurnstileStatus("loading");
          setVerificationAttempt((value) => value + 1);
          onSubmit(event, token);
        }}
        className={cn(styles.form, variant === "pill" ? styles.pillForm : "")}
      >
        <div className={styles.formBody}>
          {variant === "pill" ? (
            <div className={styles.pillFormHeader}>
              <label htmlFor="curp-input" className={styles.title}>
                Ingresa tu CURP
              </label>
              {curpHelpLink}
            </div>
          ) : (
            <label htmlFor="curp-input" className={styles.title}>
              Ingresa tu CURP para consultar tus líneas
            </label>
          )}
          {variant === "pill" ? (
            <div
              className={cn(
                styles.searchPill,
                curpValidationError ? styles.searchPillInvalid : "",
              )}
            >
              {curpField}
              {submitButton}
            </div>
          ) : (
            curpField
          )}
          {curpValidationError && (
            <p id="curp-error" className={styles.validationError} role="alert">
              {curpValidationError}
            </p>
          )}
          {variant !== "pill" && (
            <div className={styles.privacyNotice}>
              <ShieldCheck className={styles.privacyIcon} />
              <p className={styles.privacyCopy}>
                Tu CURP se utiliza para realizar esta consulta en tiempo real.
                No necesitas crear una cuenta y el historial visible se conserva
                únicamente en tu navegador.
              </p>
            </div>
          )}
          {variant !== "pill" && (
            <p className={styles.poweredBy}>
              Powered by{" "}
              <a
                href="https://velartechnologies.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Velar Technologies
              </a>
            </p>
          )}
          {variant !== "pill" && curpHelpLink}
        </div>

        {historySection}

        {!loading && (
          <div className={styles.verification}>
            <Turnstile
              key={verificationAttempt}
              onToken={setTurnstileToken}
              onStatusChange={setTurnstileStatus}
            />
            {verificationExpired && (
              <output className={styles.verificationHint}>
                La verificación de seguridad expiró, espera a que se complete de
                nuevo.
              </output>
            )}
          </div>
        )}

        {variant === "default" && submitButton}
      </form>

      {(error || timedOut) && (
        <div className={styles.error} role="alert" aria-live="polite">
          <AlertCircle className={styles.errorIcon} />
          <div>
            <p>
              {timedOut
                ? "La consulta excedió el tiempo límite. Intenta de nuevo."
                : error}
            </p>
            <button type="button" onClick={onRetry} className={styles.retry}>
              Reintentar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
