import {
  Building2,
  Eye,
  type LucideIcon,
  Scale,
  Signal,
  Wifi,
  Zap,
} from "lucide-react";

export const KNOWN_PROVIDERS: { name: string; icon: LucideIcon }[] = [
  { name: "Telcel", icon: Signal },
  { name: "AT&T", icon: Wifi },
  { name: "+80 MVNOs (Red Altan)", icon: Building2 },
];

export const WHY_CARDS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Zap,
    title: "Un solo lugar",
    body: "Antes tenías que buscar en más de 100 sitios web diferentes. Hoy solo necesitas ingresar tu CURP aquí.",
  },
  {
    icon: Scale,
    title: "Protección Federal",
    body: "Procesos bajo la Ley Federal de Telecomunicaciones. Orquestación efímera y segura.",
  },
  {
    icon: Eye,
    title: "Transparencia Total",
    body: "No somos una operadora ni vendemos planes. Solo devolvemos la información a su dueño: el ciudadano.",
  },
];

export const SECURITY_BULLETS = [
  "Conexiones cifradas en tránsito (TLS/HTTPS).",
  "Sesión destruida automáticamente.",
  "No guardamos datos personales ni historiales.",
  "No almacenamos CURP ni números.",
  "Cumplimiento de privacidad.",
  "Proyecto open source y auditable.",
];

export const ARCO_RIGHTS = [
  { t: "Acceso", d: "Conoce qué datos tienen de ti" },
  { t: "Rectificación", d: "Corrige lo inexacto" },
  { t: "Cancelación", d: "Elimina tus datos" },
  { t: "Oposición", d: "Niégate al uso" },
];

export const TOTAL_PROVIDERS = 104;
export const QUERY_TIMEOUT_MS = 15000;

// Hard ceiling on a single provider request. Must stay below the client
// watchdog (QUERY_TIMEOUT_MS * 2 in useLookup): a stalled carrier should come
// back as one failed card while the rest of the stream keeps arriving, rather
// than outliving the abort that kills the whole query.
export const PROVIDER_TIMEOUT_MS = 25000;
