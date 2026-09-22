"use client";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildCsvExport,
  buildExportEvidencePayload,
  buildJsonExport,
  getExportFilename,
} from "@/lib/export";
import { LOCAL_LOOKUP } from "@/lib/local-client";
import { summarizeLookup } from "@/lib/lookup-summary";
import { API_URL } from "@/lib/utils";
import type { DisplayLine, ExportIntegrity, FilterTab } from "@/types";

interface Props {
  results: DisplayLine[];
  curp: string;
  loading: boolean;
  scannedCount: number;
  queryTime: Date | null;
  onNuevaConsulta: () => void;
  onReport: (operadora: string) => void;
}

export function LookupResults({
  results,
  curp,
  loading,
  scannedCount,
  queryTime,
  onNuevaConsulta,
  onReport,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const confirmedLines = results.filter(
    (l) => !l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable,
  );
  const possibleLines = results.filter(
    (l) => l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable,
  );
  const failedLines = results.filter((l) => l.isError || l.isUnavailable);
  const summary = summarizeLookup(results);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: results.length },
    { key: "confirmed", label: "Confirmados", count: confirmedLines.length },
    { key: "possible", label: "Posibles", count: possibleLines.length },
    { key: "errors", label: "Sin verificar", count: failedLines.length },
  ];

  const getActiveResults = (): DisplayLine[] => {
    let base: DisplayLine[];
    switch (activeFilter) {
      case "confirmed":
        base = confirmedLines;
        break;
      case "possible":
        base = possibleLines;
        break;
      case "errors":
        base = failedLines;
        break;
      default:
        base = results;
    }
    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (l) =>
        l.operadora.toLowerCase().includes(q) ||
        l.numero.toLowerCase().includes(q),
    );
  };

  const activeResults = getActiveResults();
  const exportEnabled = !loading && !!queryTime;

  const downloadFile = (
    filename: string,
    content: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getIntegrity = async (
    payload: ReturnType<typeof buildExportEvidencePayload>,
  ): Promise<ExportIntegrity> => {
    const response = await fetch(
      `${LOCAL_LOOKUP ? "" : API_URL}/api/export-signature`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error("No se pudo generar la firma del documento.");
    }

    const integrity = (await response.json()) as ExportIntegrity;
    return integrity;
  };

  const handleExport = async (format: "csv" | "json") => {
    if (!queryTime || exporting) return;

    setExporting(true);
    setExportMessage(null);

    try {
      const payload = buildExportEvidencePayload({
        curp,
        queryTime,
        scannedCount,
        results,
      });
      const integrity = await getIntegrity(payload);
      const content =
        format === "csv"
          ? buildCsvExport(payload, integrity)
          : buildJsonExport(payload, integrity);

      downloadFile(
        getExportFilename(curp, format),
        content,
        format === "csv" ? "text/csv;charset=utf-8" : "application/json",
      );

      if (!integrity.signed) {
        setExportMessage(
          "El archivo se descargó, pero sin firma criptográfica: por ahora no sirve como comprobante verificable ante una operadora, solo como referencia personal.",
        );
      }
    } catch (error) {
      setExportMessage(
        error instanceof Error
          ? error.message
          : "No se pudo exportar el archivo.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card
      className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
      aria-label="Resultados de la consulta"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          {loading ? "Consultando operadoras" : "Resultados"}
        </CardTitle>
        <CardDescription aria-live="polite">
          {loading ? "Recibiendo respuestas…" : "Consulta finalizada"}
          {queryTime
            ? ` · ${queryTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Operadoras y grupos reportados
          </p>
          <dl
            className="grid grid-cols-2 gap-3 rounded-lg border border-border p-4"
            aria-live="polite"
          >
            <div>
              <dt className="text-xs text-muted-foreground">Con respuesta</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {summary.answered}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Sin poder verificar
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {summary.unverified}
              </dd>
            </div>
          </dl>
        </div>
        {!loading && summary.unverified > 0 && (
          <Alert>
            <AlertDescription>
              Algunas consultas fallaron o no estuvieron disponibles. Revisa
              “Sin verificar” para ver cuáles. Esto no significa que no tengas
              líneas en esas operadoras.
            </AlertDescription>
          </Alert>
        )}
        {exportMessage && (
          <Alert>
            <AlertDescription>{exportMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="result-search">Buscar en resultados</Label>
          <Input
            id="result-search"
            placeholder="Operadora o número"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 text-base md:text-base"
          />
        </div>
        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as FilterTab)}
        >
          <TabsList className="grid h-auto! w-full grid-cols-2 gap-1 p-1">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="min-h-10 text-xs"
              >
                {tab.label}
                <span className="text-muted-foreground">{tab.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {filterTabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-3">
              <div className="divide-y divide-border">
                {activeResults.map((line) => (
                  <div key={line.id} className="space-y-2 py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 break-words font-medium">
                        {line.operadora}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {line.isError
                          ? "Error"
                          : line.isUnavailable
                            ? "No disponible"
                            : line.isNotFound
                              ? "Sin registro"
                              : line.isPossible
                                ? "Posible"
                                : "Registro encontrado"}
                      </Badge>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">
                      {line.numero}
                    </p>
                    {line.disclaimer && (
                      <p className="break-words text-xs leading-relaxed text-muted-foreground">
                        {line.disclaimer}
                      </p>
                    )}
                    {!line.isError &&
                      !line.isUnavailable &&
                      !line.isNotFound && (
                        <Button
                          variant="outline"
                          className="min-h-10 text-xs"
                          onClick={() => onReport(line.operadora)}
                        >
                          No reconozco esta línea
                        </Button>
                      )}
                  </div>
                ))}
              </div>
              {loading && (
                <output
                  aria-label="Esperando respuestas"
                  className="block space-y-3 pt-3"
                >
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </output>
              )}
              {!loading && !activeResults.length && (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  No hay resultados en esta selección.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => handleExport("csv")}
            disabled={!exportEnabled || exporting}
          >
            Descargar CSV
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => handleExport("json")}
            disabled={!exportEnabled || exporting}
          >
            JSON
          </Button>
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={onNuevaConsulta}
            disabled={loading}
          >
            Nueva consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
