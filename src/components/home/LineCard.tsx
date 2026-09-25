"use client";

import {
  Check,
  CheckCircle2,
  CircleDashed,
  Copy,
  ExternalLink,
  Flag,
  MessageSquareWarning,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { getProviderWebsite } from "@/lib/data/providerWebsites";
import type { DisplayLine } from "@/types";
import styles from "./ResultsPanel.module.css";

type ResultState =
  | "confirmed"
  | "possible"
  | "notFound"
  | "error"
  | "unavailable";

function getResultState(linea: DisplayLine): ResultState {
  if (linea.isPossible) return "possible";
  if (linea.isNotFound) return "notFound";
  if (linea.isError) return "error";
  if (linea.isUnavailable) return "unavailable";
  return "confirmed";
}

function getStateCopy(state: ResultState) {
  switch (state) {
    case "possible":
      return {
        label: "Posible",
        hint: "Coincidencia por confirmar",
        icon: CircleDashed,
      };
    case "notFound":
      return {
        label: "Sin registro",
        hint: "No se encontró vinculación",
        icon: CircleDashed,
      };
    case "error":
      return {
        label: "Error",
        hint: "La consulta no terminó",
        icon: TriangleAlert,
      };
    case "unavailable":
      return {
        label: "No disponible",
        hint: "La operadora no respondió",
        icon: TriangleAlert,
      };
    default:
      return {
        label: "Confirmada",
        hint: "Línea vinculada a esta CURP",
        icon: CheckCircle2,
      };
  }
}

function getMonogram(operator: string) {
  const words = operator
    .replace(/[^A-Za-zÁÉÍÓÚÜÑ0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return operator.slice(0, 2).toUpperCase();
}

interface Props {
  linea: DisplayLine;
  idx: number;
  onReport: (operadora: string) => void;
}

export function LineCard({ linea, idx, onReport }: Props) {
  const [copied, setCopied] = useState(false);
  const state = getResultState(linea);
  const stateCopy = getStateCopy(state);
  const StateIcon = stateCopy.icon;
  const hasVisibleNumber =
    linea.numero !== "Número no confirmado" &&
    linea.numero !== "Número oculto" &&
    linea.numero !== "Sin registro" &&
    linea.numero !== "Temporalmente no disponible" &&
    linea.numero !== "Error al consultar";
  const canReport =
    state === "confirmed" || state === "possible" || state === "error";
  const website =
    state === "confirmed" ? getProviderWebsite(linea.operadora) : null;

  const handleCopy = async () => {
    if (!hasVisibleNumber) return;

    try {
      await navigator.clipboard.writeText(linea.numero);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, delay: Math.min(idx * 0.045, 0.25) }}
      className={styles.resultCard}
    >
      <div className={styles.cardMain}>
        <span className={styles.operatorMark} aria-hidden="true">
          {getMonogram(linea.operadora)}
        </span>
        <div className={styles.cardContent}>
          <div className={styles.operatorLine}>
            <h3 className={styles.operatorName}>{linea.operadora}</h3>
            <span
              className={`${styles.statusBadge} ${styles[`status${state.charAt(0).toUpperCase()}${state.slice(1)}`]}`}
            >
              <StateIcon aria-hidden="true" />
              {stateCopy.label}
            </span>
          </div>
          {state !== "confirmed" && (
            <p className={styles.cardHint}>{stateCopy.hint}</p>
          )}
        </div>

        <div className={styles.numberBlock}>
          <p
            className={`${styles.number} ${hasVisibleNumber ? "" : styles.numberMuted}`}
          >
            {linea.numero}
          </p>
          {linea.disclaimer && (
            <p className={styles.disclaimer}>{linea.disclaimer}</p>
          )}
        </div>
      </div>

      <div className={styles.cardActions}>
        {hasVisibleNumber && (
          <button
            type="button"
            className={styles.copyButton}
            data-copied={copied}
            onClick={handleCopy}
            aria-label={
              copied ? "Número copiado" : `Copiar número de ${linea.operadora}`
            }
            title={copied ? "Copiado" : "Copiar número"}
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
          </button>
        )}
        {canReport && (
          <button
            type="button"
            className={styles.cardAction}
            onClick={() => onReport(linea.operadora)}
            aria-label={`Desconocer línea de ${linea.operadora}`}
            title="Desconocer línea / Derechos ARCO"
          >
            <Flag size={16} aria-hidden="true" />
          </button>
        )}
        {(state === "error" ||
          state === "notFound" ||
          state === "unavailable") && (
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdI1KnQDXHA6lnAD29JZLokvf5NRCeLb_wPuTiDQ1bs8os6_A/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cardAction}
            aria-label={`Reportar problema con ${linea.operadora}`}
            title="Reportar problema"
          >
            <MessageSquareWarning size={16} aria-hidden="true" />
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cardAction}
            aria-label={`Ir al sitio de ${linea.operadora}`}
            title="Sitio de la operadora"
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
      </div>
    </motion.article>
  );
}
