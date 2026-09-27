import type { DisplayLine, ProviderResponse } from "@/types";

export function transformApiResponse(
  responses: ProviderResponse[],
): DisplayLine[] {
  const lines: DisplayLine[] = [];

  for (const { provider, result } of responses) {
    if (result.temporaryUnavailable) {
      const label = result.company || provider;
      lines.push({
        id: `${provider}-unavailable-${label}`,
        operadora: label,
        numero: "Temporalmente no disponible",
        isUnavailable: true,
      });
      continue;
    }

    if (result.error) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        for (const posible of result.possibleProviders) {
          lines.push({
            id: `${provider}-error-${posible}`,
            operadora: posible,
            numero: "Error al consultar",
            isError: true,
          });
        }
      } else {
        const label = result.company || provider;
        lines.push({
          id: `${provider}-error-${label}`,
          operadora: label,
          numero: "Error al consultar",
          isError: true,
        });
      }
      continue;
    }

    const hasLines = result.lines && result.lines.length > 0;
    const hasPossible =
      result.isRegistered &&
      result.possibleProviders &&
      result.possibleProviders.length > 0;
    const isRegisteredWithoutLinesOrPossible =
      result.isRegistered &&
      !hasLines &&
      !(result.possibleProviders && result.possibleProviders.length > 0);

    if (!hasLines && !hasPossible && !isRegisteredWithoutLinesOrPossible) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        for (const posible of result.possibleProviders) {
          lines.push({
            id: `${provider}-notfound-${posible}`,
            operadora: posible,
            numero: "Sin registro",
            isNotFound: true,
          });
        }
      } else {
        const label = result.company || provider;
        lines.push({
          id: `${provider}-notfound-${label}`,
          operadora: label,
          numero: "Sin registro",
          isNotFound: true,
        });
      }
      continue;
    }

    for (const lineStr of result.lines ?? []) {
      const colonIdx = lineStr.indexOf(": ");
      const hasBrandPrefix = colonIdx !== -1;
      const operadora = hasBrandPrefix
        ? lineStr.slice(0, colonIdx)
        : result.company;
      const numero = hasBrandPrefix ? lineStr.slice(colonIdx + 2) : lineStr;
      lines.push({
        id: `${provider}-confirmed-${lineStr}`,
        operadora,
        numero,
        isPossible: false,
      });
    }

    if (result.isRegistered) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        // The provider confirmed a line exists but can't say which of its
        // sub-brands owns it. One line was found, so show one card (not one
        // per candidate brand) listing the candidates in the disclaimer.
        const candidates = result.possibleProviders.join(", ");
        lines.push({
          id: `${provider}-possible-group`,
          operadora: result.company || provider,
          numero: "Número no confirmado",
          isPossible: true,
          disclaimer: result.possibleDisclaimer
            ? `${result.possibleDisclaimer} Marcas candidatas: ${candidates}.`
            : `Marca exacta no confirmada por el operador. Marcas candidatas: ${candidates}.`,
        });
      } else if (!hasLines) {
        lines.push({
          id: `${provider}-hidden`,
          operadora: result.company || provider,
          numero: "Número oculto",
          disclaimer:
            provider === "Telcel"
              ? "Telcel no informa el numero exacto de lineas registradas; solo confirma que hay al menos una vinculada a esta CURP."
              : undefined,
          isPossible: false,
        });
      }
    }

    for (const notFound of result.notFoundProviders ?? []) {
      lines.push({
        id: `${provider}-notfound-${notFound}`,
        operadora: notFound,
        numero: "Sin registro",
        isNotFound: true,
      });
    }
  }

  lines.sort((a, b) => {
    const aScore = a.isError
      ? 4
      : a.isUnavailable
        ? 3
        : a.isNotFound
          ? 2
          : a.isPossible
            ? 1
            : 0;
    const bScore = b.isError
      ? 4
      : b.isUnavailable
        ? 3
        : b.isNotFound
          ? 2
          : b.isPossible
            ? 1
            : 0;
    if (aScore !== bScore) return aScore - bScore;
    return a.operadora.localeCompare(b.operadora);
  });

  return lines;
}

export function getRiskLevel(lines: DisplayLine[]): {
  label: string;
  color: string;
  description: string;
  reason: string;
} {
  const confirmed = lines.filter(
    (l) => !l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable,
  ).length;
  const possible = lines.filter(
    (l) => l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable,
  ).length;
  if (confirmed === 0 && possible === 0)
    return {
      label: "Sin Registro",
      color: "bg-slate-400",
      description: "Sin líneas vinculadas",
      reason: "No se encontraron líneas confirmadas ni posibles.",
    };
  if (confirmed <= 2 && possible === 0)
    return {
      label: "Bajo",
      color: "bg-emerald-500",
      description: "Identidad protegida y consistente",
      reason: `${confirmed} ${confirmed === 1 ? "línea confirmada" : "líneas confirmadas"}, dentro de lo esperado para una persona.`,
    };
  return {
    label: "Moderado",
    color: "bg-amber-500",
    description: "Revisar líneas detectadas",
    reason:
      confirmed > 2
        ? `${confirmed} líneas confirmadas a tu nombre. Si no las reconoces todas, revísalas antes de descartar nada.`
        : `${possible} ${possible === 1 ? "coincidencia posible" : "coincidencias posibles"} sin confirmar. No es una alerta de fraude, solo un caso que conviene revisar.`,
  };
}
