export const ARCO_RIGHTS = [
  { t: "Acceso", d: "Conoce qué datos tiene la operadora sobre ti." },
  {
    t: "Rectificación",
    d: "Solicita corregir datos inexactos o incompletos.",
  },
  {
    t: "Cancelación",
    d: "Solicita eliminar tus datos cuando proceda.",
  },
  {
    t: "Oposición",
    d: "Solicita que dejen de usar tus datos para ciertos fines.",
  },
];

export const TOTAL_PROVIDERS = 104;
export const TOTAL_QUERIES = 250000;
export const QUERY_TIMEOUT_MS = 15000;

// Hard ceiling on a single provider request. Must stay below the client
// watchdog (QUERY_TIMEOUT_MS * 2 in useLookup): a stalled carrier should come
// back as one failed card while the rest of the stream keeps arriving, rather
// than outliving the abort that kills the whole query.
export const PROVIDER_TIMEOUT_MS = 25000;
