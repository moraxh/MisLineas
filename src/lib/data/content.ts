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

// Must match the number of NDJSON rows /api/lookup actually streams: one per
// entry in route.ts's `providers` array, except Freedompop which expands to
// one row per brand in FREEDOMPOP_PROVIDERS (7). Currently 12 single-row
// providers + 7 Freedompop rows = 19. Update this whenever `providers` in
// route.ts changes (enabling/disabling a carrier, adding a multi-brand one).
export const TOTAL_PROVIDERS = 19;
export const TOTAL_QUERIES = 250000;
export const QUERY_TIMEOUT_MS = 15000;

// Hard ceiling on a single provider request. Must stay below the client
// watchdog (QUERY_TIMEOUT_MS * 2 in useLookup): a stalled carrier should come
// back as one failed card while the rest of the stream keeps arriving, rather
// than outliving the abort that kills the whole query.
export const PROVIDER_TIMEOUT_MS = 25000;
