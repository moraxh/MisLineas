"use client";

import {
  AlertCircle,
  ChevronDown,
  Download,
  FileDown,
  RefreshCcw,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useRef, useState } from "react";
import { LineCard } from "@/components/home/LineCard";
import { TOTAL_PROVIDERS } from "@/lib/data/content";
import { getOperatorDisplayStatus, OPERATORS } from "@/lib/data/operators";
import {
  buildCsvExport,
  buildExportEvidencePayload,
  buildJsonExport,
  getExportFilename,
} from "@/lib/export";
import { getRiskLevel } from "@/lib/lookup";
import { API_URL } from "@/lib/utils";
import type { DisplayLine, ExportIntegrity, FilterTab } from "@/types";
import styles from "./ResultsPanel.module.css";

interface Props {
  results: DisplayLine[];
  curp: string;
  loading: boolean;
  scannedCount: number;
  queryTime: Date | null;
  onNuevaConsulta: () => void;
  onReport: (operadora: string) => void;
}

const getExportMimeType = (format: "csv" | "json") =>
  format === "csv" ? "text/csv;charset=utf-8" : "application/json";

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
  const [notFoundExpanded, setNotFoundExpanded] = useState(false);
  const [unavailableExpanded, setUnavailableExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<FilterTab, HTMLButtonElement | null>>>(
    {},
  );

  const confirmedLines = results.filter(
    (line) =>
      !line.isPossible &&
      !line.isNotFound &&
      !line.isError &&
      !line.isUnavailable,
  );
  const possibleLines = results.filter(
    (line) =>
      line.isPossible &&
      !line.isNotFound &&
      !line.isError &&
      !line.isUnavailable,
  );
  const errorLines = results.filter((line) => line.isError);
  const unavailableLines = results.filter((line) => line.isUnavailable);
  const notFoundLines = results.filter((line) => line.isNotFound);
  const riskLevel = getRiskLevel(results);
  const detectedCount = confirmedLines.length + possibleLines.length;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: results.length },
    { key: "confirmed", label: "Confirmadas", count: confirmedLines.length },
    { key: "possible", label: "Posibles", count: possibleLines.length },
    {
      key: "errors",
      label: "Revisión",
      count: errorLines.length + unavailableLines.length,
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (line: DisplayLine) =>
    !normalizedQuery ||
    line.operadora.toLowerCase().includes(normalizedQuery) ||
    line.numero.toLowerCase().includes(normalizedQuery);

  let activeResults: DisplayLine[];
  switch (activeFilter) {
    case "confirmed":
      activeResults = confirmedLines;
      break;
    case "possible":
      activeResults = possibleLines;
      break;
    case "errors":
      activeResults = [...errorLines, ...unavailableLines];
      break;
    default:
      activeResults = results.filter((line) => !line.isNotFound);
  }

  const visibleResults = activeResults.filter(matchesSearch);
  const collapsedNotFound =
    activeFilter === "all" ? notFoundLines.filter(matchesSearch) : [];
  const totalVisible = visibleResults.length + collapsedNotFound.length;
  const visibleConfirmed = confirmedLines.filter(matchesSearch);
  const reviewLines = [...possibleLines, ...unavailableLines, ...errorLines];
  const visibleReview = reviewLines.filter(matchesSearch);
  const activeGroupTitle =
    activeFilter === "confirmed"
      ? "Líneas confirmadas"
      : activeFilter === "possible"
        ? "Coincidencias posibles"
        : "Requieren revisión";
  const unavailableOperators = OPERATORS.filter(
    (operator) => getOperatorDisplayStatus(operator) !== "supported",
  );
  const exportEnabled = !loading && Boolean(queryTime);

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentKey: FilterTab,
  ) => {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = filterTabs.findIndex((tab) => tab.key === currentKey);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? filterTabs.length - 1
          : (currentIndex +
              (event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : -1) +
              filterTabs.length) %
            filterTabs.length;
    const nextKey = filterTabs[nextIndex].key;

    setActiveFilter(nextKey);
    tabRefs.current[nextKey]?.focus();
  };

  const renderResultGroup = (
    title: string,
    groupResults: DisplayLine[],
    groupId: string,
  ) => {
    if (groupResults.length === 0) return null;

    return (
      <section className={styles.resultGroup} aria-labelledby={groupId}>
        <div className={styles.groupHeading}>
          <h3 id={groupId} className={styles.groupTitle}>
            {title}
          </h3>
          <span className={styles.groupCount}>{groupResults.length}</span>
        </div>
        <div className={styles.resultsList}>
          <AnimatePresence initial={false}>
            {groupResults.map((linea, idx) => (
              <LineCard
                key={linea.id}
                linea={linea}
                idx={idx}
                onReport={onReport}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>
    );
  };

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

    return (await response.json()) as ExportIntegrity;
  };

  const handleExport = async (format: "csv" | "json") => {
    if (!queryTime || exporting || !exportEnabled) return;

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
        getExportMimeType(format),
      );

      if (!integrity.signed) {
        setExportMessage(
          "El archivo se descargó, pero sin firma criptográfica. Por ahora sirve como referencia personal, no como comprobante verificable ante una operadora.",
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.panel}
    >
      <section className={styles.resultHeader} aria-labelledby="results-title">
        <div className={styles.resultHeaderTop}>
          <div>
            <h2 id="results-title" className={styles.title}>
              {detectedCount}{" "}
              {detectedCount === 1 ? "línea detectada" : "líneas detectadas"}
            </h2>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={onNuevaConsulta}
              className={styles.actionButton}
            >
              <RefreshCcw size={15} aria-hidden="true" />
              Nueva consulta
            </button>
            <button
              type="button"
              onClick={() => handleExport("csv")}
              disabled={!exportEnabled || exporting}
              className={styles.exportButton}
            >
              <FileDown size={15} aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("json")}
              disabled={!exportEnabled || exporting}
              className={styles.exportButton}
            >
              <Download size={15} aria-hidden="true" />
              JSON
            </button>
          </div>
        </div>

        {loading && (
          <div className={styles.progressRow}>
            <div className={styles.progressLabel}>
              <span>Escaneando operadoras...</span>
              <span>
                {scannedCount}/{TOTAL_PROVIDERS}
              </span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL_PROVIDERS}
              aria-valuenow={scannedCount}
              aria-label={`${scannedCount} de ${TOTAL_PROVIDERS} operadoras revisadas`}
            >
              <motion.div
                className={styles.progressValue}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((scannedCount / TOTAL_PROVIDERS) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className={styles.summaryGrid}>
          <div className={styles.riskSummary}>
            <span className={styles.summaryLabel}>Lectura general</span>
            <span className={styles.summaryValue}>{riskLevel.label}</span>
            <span className={styles.riskState}>
              <span className={styles.riskDot} aria-hidden="true" />
              {riskLevel.description}
            </span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Confirmadas</span>
            <span className={styles.summaryValue}>{confirmedLines.length}</span>
            <span className={styles.summaryHint}>
              Con número visible o registro validado
            </span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Posibles</span>
            <span className={styles.summaryValue}>{possibleLines.length}</span>
            <span className={styles.summaryHint}>
              Requieren una revisión adicional
            </span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Operadoras</span>
            <span className={styles.summaryValue}>
              {scannedCount || TOTAL_PROVIDERS}
            </span>
            <span className={styles.summaryHint}>
              {loading ? "revisadas hasta ahora" : "consultadas en total"}
            </span>
          </div>
        </div>
      </section>

      {exportMessage && (
        <output className={styles.exportMessage}>{exportMessage}</output>
      )}

      {!loading &&
        (errorLines.length > 0 ||
          unavailableLines.length > 0 ||
          notFoundLines.length > 0) && (
          <div className={styles.contextNotice} role="note">
            <AlertCircle size={18} aria-hidden="true" />
            <p>
              Algunas operadoras no entregaron una confirmación completa. Si
              reconoces una inconsistencia, puedes
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdI1KnQDXHA6lnAD29JZLokvf5NRCeLb_wPuTiDQ1bs8os6_A/viewform"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                reportarla para que la revisemos
              </a>
              .
            </p>
          </div>
        )}

      <section className={styles.controls} aria-label="Filtrar resultados">
        <div className={styles.controlsTop}>
          <span className={styles.controlsTitle}>Detalle por operadora</span>
          <span className={styles.controlsCount}>
            {totalVisible} resultado{totalVisible === 1 ? "" : "s"}
          </span>
        </div>
        <div className={styles.controlsBody}>
          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Filtrar resultados"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`filter-tab-${tab.key}`}
                aria-selected={activeFilter === tab.key}
                aria-controls="results-panel"
                tabIndex={activeFilter === tab.key ? 0 : -1}
                ref={(element) => {
                  tabRefs.current[tab.key] = element;
                }}
                onClick={() => setActiveFilter(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
                className={`${styles.tab} ${activeFilter === tab.key ? styles.activeTab : ""}`}
              >
                {tab.label}
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>
          <label className={styles.searchBox}>
            <Search
              size={16}
              className={styles.searchIcon}
              aria-hidden="true"
            />
            <span className="sr-only">Buscar operadora o número</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar operadora o número"
              className={styles.searchInput}
            />
            <span className={styles.searchCount}>{totalVisible}</span>
          </label>
        </div>
      </section>

      <div
        id="results-panel"
        role="tabpanel"
        tabIndex={-1}
        aria-labelledby={`filter-tab-${activeFilter}`}
      >
        {loading && visibleResults.length === 0 ? (
          <div className={styles.resultsList}>
            <span className="sr-only">Cargando resultados</span>
            {[0, 1, 2].map((item) => (
              <div
                className={`${styles.resultCard} ${styles.resultCardSkeleton}`}
                key={item}
                aria-hidden="true"
              >
                <div className={styles.cardMain}>
                  <span
                    className={`${styles.operatorMark} ${styles.skeletonBlock}`}
                  />
                  <div className={styles.cardContent}>
                    <span
                      className={`${styles.skeletonBlock} ${styles.skeletonName}`}
                    />
                    <div className={styles.numberBlock}>
                      <span
                        className={`${styles.skeletonBlock} ${styles.skeletonNumber}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && totalVisible === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Search size={18} />
            </span>
            <strong>Sin coincidencias</strong>
            <p>
              {searchQuery
                ? `No hay resultados para “${searchQuery}”.`
                : "No hay resultados en esta categoría."}
            </p>
          </div>
        ) : (
          <div className={styles.resultContent}>
            {activeFilter === "all" ? (
              <>
                {renderResultGroup(
                  "Líneas confirmadas",
                  visibleConfirmed,
                  "confirmed-results",
                )}
                {renderResultGroup(
                  "Requieren revisión",
                  visibleReview,
                  "review-results",
                )}
              </>
            ) : (
              renderResultGroup(
                activeGroupTitle,
                visibleResults,
                "filtered-results",
              )
            )}

            {activeFilter === "all" && collapsedNotFound.length > 0 && (
              <div className={styles.collapsedGroup}>
                <button
                  type="button"
                  className={styles.collapsedButton}
                  onClick={() => setNotFoundExpanded((value) => !value)}
                  aria-expanded={notFoundExpanded}
                >
                  <span>
                    {collapsedNotFound.length} operadora
                    {collapsedNotFound.length === 1 ? "" : "s"} sin registro
                  </span>
                  <ChevronDown
                    className={`${styles.chevron} ${notFoundExpanded ? styles.chevronOpen : ""}`}
                    size={17}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {notFoundExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={styles.collapsedContent}
                    >
                      {collapsedNotFound.map((linea) => (
                        <div className={styles.collapsedItem} key={linea.id}>
                          <span>{linea.operadora}</span>
                          <span>Sin registro</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeFilter === "all" &&
              !normalizedQuery &&
              unavailableOperators.length > 0 && (
                <div className={styles.unavailableGroup}>
                  <button
                    type="button"
                    className={styles.collapsedButton}
                    onClick={() => setUnavailableExpanded((value) => !value)}
                    aria-expanded={unavailableExpanded}
                  >
                    <span>
                      {unavailableOperators.length} operadora
                      {unavailableOperators.length === 1 ? "" : "s"} fuera de
                      alcance
                    </span>
                    <ChevronDown
                      className={`${styles.chevron} ${unavailableExpanded ? styles.chevronOpen : ""}`}
                      size={17}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {unavailableExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={styles.collapsedContent}
                      >
                        {unavailableOperators.map((operator) => (
                          <div
                            className={styles.collapsedItem}
                            key={operator.name}
                          >
                            <span>{operator.name}</span>
                            <span>{operator.reason || "No disponible"}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
