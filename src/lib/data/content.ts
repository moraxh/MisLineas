import { Eye, type LucideIcon, Scale, Zap } from "lucide-react";

export const WHY_CARDS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Zap,
    title: "Un solo lugar",
    body: "En lugar de visitar una por una las plataformas de las compañías, ingresas tu CURP una sola vez y reúnes las respuestas disponibles.",
  },
  {
    icon: Scale,
    title: "Basado en fuentes oficiales",
    body: "Consultamos las plataformas que cada operadora pone a disposición. MisLíneas es independiente y no sustituye a la CRT ni a las compañías.",
  },
  {
    icon: Eye,
    title: "Resultados honestos",
    body: "Te mostramos qué operadoras respondieron, cuáles no están disponibles y cuándo necesitas continuar la revisión directamente.",
  },
];

export const SECURITY_BULLETS = [
  "Conexiones cifradas en tránsito (TLS/HTTPS).",
  "No necesitas crear una cuenta.",
  "El historial de consultas se guarda solo en tu navegador.",
  "No usamos la CURP para crear perfiles o enviar publicidad.",
  "Los resultados indican sus límites y posibles pendientes.",
  "Proyecto open source y auditable.",
];

export const ARCO_RIGHTS = [
  { t: "Acceso", d: "Conoce qué datos tienen de ti" },
  { t: "Rectificación", d: "Corrige lo inexacto" },
  { t: "Cancelación", d: "Elimina tus datos" },
  { t: "Oposición", d: "Niégate al uso" },
];

export const TOTAL_PROVIDERS = 104;
export const TOTAL_QUERIES = 250000;
export const QUERY_TIMEOUT_MS = 15000;

// Hard ceiling on a single provider request. Must stay below the client
// watchdog (QUERY_TIMEOUT_MS * 2 in useLookup): a stalled carrier should come
// back as one failed card while the rest of the stream keeps arriving, rather
// than outliving the abort that kills the whole query.
export const PROVIDER_TIMEOUT_MS = 25000;
