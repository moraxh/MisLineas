"use client";

import { AnimatePresence } from "motion/react";
import type React from "react";
import { useState } from "react";
import { CurpForm } from "@/components/home/CurpForm";
import { ResultsPanel } from "@/components/home/ResultsPanel";
import { ServiceAlerts } from "@/components/home/ServiceAlerts";
import { ReportDialog } from "@/components/ui/ReportDialog";
import { getCurpValidationError } from "@/lib/curp";
import { useCurpHistory } from "@/lib/hooks/useCurpHistory";
import { useLookup } from "@/lib/hooks/useLookup";
import styles from "./Lookup.module.css";

export function Lookup() {
  const [curp, setCurp] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const { history, saveToHistory, clearHistory } = useCurpHistory();
  const {
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
  } = useLookup(saveToHistory);

  const curpValidationError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpValidationError;

  const handleConsultar = (event: React.FormEvent, turnstileToken: string) => {
    event.preventDefault();
    if (!curpIsValid) return;
    consultar(curp, turnstileToken);
  };

  const handleNuevaConsulta = () => {
    reset();
    setCurp("");
  };

  const handleSelectHistory = (value: string) => {
    reset();
    setCurp(value);
  };

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      <div className={styles.lookup}>
        <ServiceAlerts kind="telcel" placement="lookup" />
        <CurpForm
          variant="pill"
          curp={curp}
          setCurp={setCurp}
          loading={loading}
          error={error}
          timedOut={timedOut}
          history={history}
          onSubmit={handleConsultar}
          onRetry={retry}
          onSelectHistory={handleSelectHistory}
          onClearHistory={clearHistory}
        />
      </div>
      {(results !== null || loading || timedOut) && (
        <section
          className={styles.results}
          aria-label="Resultados de la consulta"
        >
          <AnimatePresence mode="wait">
            {results !== null && (
              <ResultsPanel
                results={results}
                curp={curp}
                loading={loading}
                scannedCount={scannedCount}
                queryTime={queryTime}
                onNuevaConsulta={handleNuevaConsulta}
                onReport={setReportTarget}
              />
            )}
          </AnimatePresence>
        </section>
      )}
      <AnimatePresence>
        {reportTarget && (
          <ReportDialog
            operadora={reportTarget}
            onClose={() => setReportTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
