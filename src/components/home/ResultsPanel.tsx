"use client";

import { MessageSquareWarning, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { FilterTabs } from "@/components/home/FilterTabs";
import { ResultsHeader } from "@/components/home/ResultsHeader";
import { ResultsList } from "@/components/home/ResultsList";
import {
  buildCsvExport,
  buildExportEvidencePayload,
  buildJsonExport,
  getExportFilename,
} from "@/lib/export";
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

export function ResultsPanel({
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
  const errorLines = results.filter((l) => l.isError);
  const unavailableLines = results.filter((l) => l.isUnavailable);
  const notFoundLines = results.filter((l) => l.isNotFound);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: results.length },
    { key: "confirmed", label: "Confirmados", count: confirmedLines.length },
    { key: "possible", label: "Posibles", count: possibleLines.length },
    { key: "errors", label: "Errores", count: errorLines.length },
  ];

  const getActiveResults = (): DisplayLine[] => {
    let base: DisplayLine[];
    switch (activeFilter) {
      case "confirmed":
        base = [...confirmedLines, ...notFoundLines];
        break;
      case "possible":
        base = possibleLines;
        break;
      case "errors":
        base = errorLines;
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
  const visibleResults =
    activeFilter === "all"
      ? activeResults.filter((l) => !l.isNotFound)
      : activeResults;
  const collapsedNotFound =
    activeFilter === "all"
      ? searchQuery
        ? notFoundLines.filter((l) =>
            l.operadora.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : notFoundLines
      : [];

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
    const response = await fetch(`${API_URL}/api/export-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <ResultsHeader
        results={results}
        curp={curp}
        loading={loading}
        scannedCount={scannedCount}
        queryTime={queryTime}
        onNuevaConsulta={onNuevaConsulta}
        onExportCsv={() => handleExport("csv")}
        onExportJson={() => handleExport("json")}
        exportEnabled={exportEnabled}
        exporting={exporting}
      />

      {exportMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          {exportMessage}
        </div>
      )}

      {!loading &&
        (errorLines.length > 0 ||
          unavailableLines.length > 0 ||
          notFoundLines.length > 0) && (
          <div className="bg-blue-50 text-blue-900 text-sm p-4 rounded-2xl border border-blue-100 flex gap-3 text-left shadow-sm">
            <MessageSquareWarning className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>
                ¿Una línea no aparece o una operadora estuvo temporalmente no
                disponible?
              </strong>{" "}
              Al ser un proyecto independiente dependemos del feedback de la
              comunidad.{" "}
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdI1KnQDXHA6lnAD29JZLokvf5NRCeLb_wPuTiDQ1bs8os6_A/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-blue-700"
              >
                Repórtanos el problema aquí
              </a>{" "}
              para investigar y buscar una solución.
            </p>
          </div>
        )}

      <FilterTabs
        tabs={filterTabs}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar operadora o número..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 px-10 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black shadow-sm"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
          {visibleResults.length + collapsedNotFound.length} resultados
        </span>
      </div>

      <ResultsList
        loading={loading}
        visibleResults={visibleResults}
        collapsedNotFound={collapsedNotFound}
        activeFilter={activeFilter}
        activeResultsCount={visibleResults.length + collapsedNotFound.length}
        searchQuery={searchQuery}
        onReport={onReport}
      />

      {!loading && (
        <p className="text-center text-xs text-zinc-400">
          Herramienta gratuita y sin anuncios. Con el apoyo de{" "}
          <a
            href="https://velartech.com.mx/"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-600 transition-colors"
          >
            Velar Technologies
          </a>
        </p>
      )}
    </motion.div>
  );
}
