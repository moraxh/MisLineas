"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import {
  getOperatorDisplayStatus,
  OPERATOR_STATUS_LABELS,
  OPERATORS,
  type OperatorDisplayStatus,
} from "@/lib/data/operators";
import styles from "./OperatorsSection.module.css";

const statusOrder: OperatorDisplayStatus[] = [
  "supported",
  "unsupported",
  "pending",
];

export function OperatorsSection() {
  const [operatorQuery, setOperatorQuery] = useState("");

  const operatorQueryNormalized = operatorQuery.trim().toLocaleLowerCase("es");
  const filteredOperators = OPERATORS.filter((operator) => {
    if (!operatorQueryNormalized) return true;
    const displayStatus = getOperatorDisplayStatus(operator);
    const statusLabel =
      OPERATOR_STATUS_LABELS[displayStatus].toLocaleLowerCase("es");
    return (
      operator.name.toLocaleLowerCase("es").includes(operatorQueryNormalized) ||
      statusLabel.includes(operatorQueryNormalized)
    );
  }).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const operatorCounts = OPERATORS.reduce(
    (acc, operator) => {
      const displayStatus = getOperatorDisplayStatus(operator);
      acc[displayStatus] += 1;
      return acc;
    },
    { supported: 0, unsupported: 0, pending: 0 } as Record<
      OperatorDisplayStatus,
      number
    >,
  );

  return (
    <section
      id="operadoras"
      className={styles.section}
      aria-labelledby="operators-heading"
    >
      <div className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Cobertura</p>
          <h2 id="operators-heading" className={styles.title}>
            Estado de operadoras
          </h2>
          <p className={styles.description}>
            Consulta qué operadoras podemos revisar desde aquí y cuáles
            requieren otro proceso. La cobertura cambia con el tiempo;{" "}
            <a
              href="https://github.com/moraxh/MisLineas/commits/main/src/lib/data/operators.ts"
              target="_blank"
              rel="noopener noreferrer"
            >
              revisa el historial de cambios
            </a>
            .
          </p>
        </div>

        <div className={styles.searchGroup}>
          <label htmlFor="operator-search" className={styles.searchLabel}>
            Buscar operadora
          </label>
          <div className={styles.searchField}>
            <Search
              className={styles.searchIcon}
              size={18}
              aria-hidden="true"
            />
            <input
              id="operator-search"
              type="search"
              value={operatorQuery}
              onChange={(event) => setOperatorQuery(event.target.value)}
              placeholder="Nombre o estado"
              aria-describedby="operator-results"
            />
            {operatorQuery ? (
              <button
                className={styles.clearButton}
                type="button"
                onClick={() => setOperatorQuery("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <dl className={styles.summary} aria-label="Resumen de cobertura">
        {statusOrder.map((status) => (
          <div className={styles.summaryItem} key={status}>
            <dt className={styles.summaryLabel}>
              <span
                className={`${styles.dot} ${styles[status]}`}
                aria-hidden="true"
              />
              {OPERATOR_STATUS_LABELS[status]}
            </dt>
            <dd className={styles.summaryCount}>{operatorCounts[status]}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.listHeader}>
        <output id="operator-results" className={styles.resultsCount}>
          {operatorQuery
            ? `${filteredOperators.length} resultados`
            : `${OPERATORS.length} operadoras`}
        </output>
        <span className={styles.listHint}>Estado de integración</span>
      </div>

      {filteredOperators.length > 0 ? (
        <ul className={styles.operatorList} aria-label="Operadoras">
          {filteredOperators.map((operator) => {
            const displayStatus = getOperatorDisplayStatus(operator);
            return (
              <li className={styles.operatorRow} key={operator.name}>
                <div className={styles.operatorInfo}>
                  <h3 className={styles.operatorName}>{operator.name}</h3>
                  {operator.reason ? (
                    <p className={styles.reason}>{operator.reason}</p>
                  ) : null}
                </div>
                <span className={`${styles.status} ${styles[displayStatus]}`}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {OPERATOR_STATUS_LABELS[displayStatus]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.emptyState}>
          No encontramos operadoras con esa búsqueda.
        </p>
      )}
    </section>
  );
}
