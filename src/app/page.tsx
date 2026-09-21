"use client";

import { AlertTriangle, ArrowUpRight, PartyPopper } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type React from "react";
import { useState } from "react";
import { AccordionItem } from "@/components/home/AccordionItem";
import { ArcoSection } from "@/components/home/ArcoSection";
import { CurpForm } from "@/components/home/CurpForm";
import { EmptyState } from "@/components/home/EmptyState";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Navbar } from "@/components/home/Navbar";
import { Notices } from "@/components/home/Notices";
import { OperatorsSection } from "@/components/home/OperatorsSection";
import { ResultsPanel } from "@/components/home/ResultsPanel";
import { SecuritySection } from "@/components/home/SecuritySection";
import { SponsorSection } from "@/components/home/SponsorSection";
import { WhySection } from "@/components/home/WhySection";
import { ReportDialog } from "@/components/ui/ReportDialog";
import { getCurpValidationError } from "@/lib/curp";
import { useCurpHistory } from "@/lib/hooks/useCurpHistory";
import { useLookup } from "@/lib/hooks/useLookup";

export default function MisLineas() {
  const [curp, setCurp] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const { history, saveToHistory } = useCurpHistory();
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

  const handleConsultar = (e: React.FormEvent, turnstileToken: string) => {
    e.preventDefault();
    if (!curpIsValid) return;
    consultar(curp, turnstileToken);
  };

  const handleNuevaConsulta = () => {
    reset();
    setCurp("");
  };

  const handleSelectHistory = (h: string) => {
    reset();
    setCurp(h);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_42%,#ffffff_100%)] font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-950">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2.5">
          <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 self-start text-emerald-600 sm:mt-0 sm:self-auto" />
          <p className="text-center leading-snug">
            <strong>¡Estamos de vuelta!</strong> Pausamos el servicio por
            seguridad y costos tras un mal uso de la plataforma. Ahora Velar
            Technologies es nuestro patrocinador y cubre todos los gastos.{" "}
            <a
              href="/donar"
              className="inline-flex items-center gap-1 font-semibold underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700"
            >
              Conocer más <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>
      </div>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="line-clamp-2 text-center sm:line-clamp-1">
            <strong>Aviso Telcel:</strong> algunas líneas pueden no aparecer
            aunque ya estén registradas.{" "}
            <a
              href="https://registro.telcel.com/vinculatulinea/#/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-700"
            >
              Revisar vinculación <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <AnimatePresence>
        {reportTarget && (
          <ReportDialog
            operadora={reportTarget}
            onClose={() => setReportTarget(null)}
          />
        )}
      </AnimatePresence>

      <Navbar />

      <main
        id="contenido"
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12"
      >
        <section className="mx-auto max-w-3xl space-y-6">
          <Hero />
          <CurpForm
            curp={curp}
            setCurp={setCurp}
            loading={loading}
            error={error}
            timedOut={timedOut}
            history={history}
            onSubmit={handleConsultar}
            onRetry={retry}
            onSelectHistory={handleSelectHistory}
          />
          <Notices />
        </section>

        <section className="mt-10" aria-label="Resultados de la consulta">
          <AnimatePresence mode="wait">
            {!results && !loading && !timedOut ? (
              <EmptyState />
            ) : results !== null ? (
              <ResultsPanel
                results={results}
                curp={curp}
                loading={loading}
                scannedCount={scannedCount}
                queryTime={queryTime}
                onNuevaConsulta={handleNuevaConsulta}
                onReport={setReportTarget}
              />
            ) : null}
          </AnimatePresence>
        </section>

        <div className="mt-16 space-y-12 md:mt-20">
          <OperatorsSection />

          <div className="mx-auto max-w-4xl space-y-4">
            <h2 className="mb-6 px-2 text-center text-xl font-bold text-zinc-900 md:text-left">
              Centro de Información
            </h2>
            <AccordionItem title="¿Por qué usar MisLíneas y cómo funciona?">
              <WhySection />
            </AccordionItem>
            <AccordionItem id="seguridad" title="Seguridad y Privacidad">
              <SecuritySection />
            </AccordionItem>
            <AccordionItem id="arco" title="Derechos ARCO y Denuncias">
              <ArcoSection />
            </AccordionItem>
            <AccordionItem id="velar" title="¿Quiénes son Velar Technologies?">
              <SponsorSection />
            </AccordionItem>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
