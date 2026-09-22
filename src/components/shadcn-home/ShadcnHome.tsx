"use client";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProviderWebsite } from "@/lib/data/providerWebsites";
import { useLookup } from "@/lib/hooks/useLookup";
import { Footer, Header } from "./Branding";
import { Coverage } from "./Coverage";
import { LookupForm } from "./LookupForm";
import { LookupResults } from "./LookupResults";

export function ShadcnHome() {
  const [curp, setCurp] = useState("");
  const [queriedCurp, setQueriedCurp] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const lookup = useLookup();
  const website = reportTarget ? getProviderWebsite(reportTarget) : null;
  return (
    <div className="shadcn-home min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[560px] px-5 pt-8 sm:pt-14">
        <div className="mb-8 space-y-3">
          <h1 className="text-[34px] leading-[1.12] font-semibold tracking-[-.045em] sm:text-[44px]">
            Consulta tus líneas.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Revisa qué líneas están vinculadas a tu CURP.
          </p>
        </div>
        <div className="space-y-6">
          <LookupForm
            curp={curp}
            onChange={setCurp}
            loading={lookup.loading}
            onSubmit={(token) => {
              setQueriedCurp(curp);
              void lookup.consultar(curp, token);
            }}
          />
          {(lookup.error || lookup.timedOut) && (
            <Alert variant="destructive">
              <AlertDescription>
                {lookup.timedOut
                  ? "La consulta tardó demasiado. Intenta de nuevo."
                  : lookup.error}
              </AlertDescription>
            </Alert>
          )}
          {lookup.results !== null && (
            <LookupResults
              results={lookup.results}
              curp={queriedCurp}
              loading={lookup.loading}
              scannedCount={lookup.scannedCount}
              queryTime={lookup.queryTime}
              onReport={setReportTarget}
              onNuevaConsulta={() => {
                lookup.reset();
                setCurp("");
                setQueriedCurp("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
        <Coverage />
        <Footer />
      </main>
      <Dialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
      >
        <DialogContent className="shadcn-home">
          <DialogHeader>
            <DialogTitle>¿No reconoces una línea?</DialogTitle>
            <DialogDescription>
              Contacta a {reportTarget} para aclarar el registro o solicitar la
              desvinculación.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Puedes solicitar acceso, rectificación o cancelación de tus datos a
            la operadora.
          </p>
          {website && (
            <Button asChild className="min-h-11">
              <a href={website} target="_blank" rel="noopener noreferrer">
                Ir a la operadora
              </a>
            </Button>
          )}
          <Button variant="outline" asChild className="min-h-11">
            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reportar una falla en la plataforma
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
