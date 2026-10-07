export type OperatorStatus = "supported" | "paused" | "pending" | "verify";
export type OperatorDisplayStatus = "supported" | "unsupported" | "pending";

export type OperatorEntry = {
  name: string;
  status: OperatorStatus;
  reason?: string;
};

export const OPERATOR_STATUS_LABELS: Record<OperatorDisplayStatus, string> = {
  supported: "Soportada",
  unsupported: "No soportada",
  pending: "Pendiente",
};

export const OPERATOR_STATUS_STYLES: Record<OperatorDisplayStatus, string> = {
  supported: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unsupported: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export function getOperatorDisplayStatus(
  operator: OperatorEntry,
): OperatorDisplayStatus {
  if (operator.status === "supported") return "supported";
  if (!operator.reason) return "pending";
  if (operator.reason.toLowerCase().includes("no integrado")) {
    return "pending";
  }
  return "unsupported";
}

export const OPERATORS: OperatorEntry[] = [
  { name: "2y2x", status: "supported" },
  { name: "Abafon", status: "supported" },
  {
    name: "Abib",
    status: "paused",
    reason: "Su consulta ahora exige inicio de sesión.",
  },
  { name: "Abix", status: "supported" },
  { name: "Addinteli", status: "supported" },
  { name: "AhorroCel", status: "supported" },
  { name: "AI Telecomm", status: "supported" },
  { name: "ALLCE", status: "supported" },
  {
    name: "AT&T / Unefon / WIM",
    status: "paused",
    reason: "La consulta de AT&T está en pausa por bloqueos de su portal.",
  },
  {
    name: "Bait",
    status: "paused",
    reason: "Es una marca de AT&T, cuya consulta está en pausa.",
  },
  { name: "Beneleit Móvil", status: "supported" },
  {
    name: "Bestel",
    status: "paused",
    reason: "No ofrecen opción para verificar vinculación de líneas.",
  },
  { name: "BienCel", status: "supported" },
  { name: "Bigcel", status: "supported" },
  { name: "Bromovil", status: "supported" },
  { name: "Cablecom", status: "paused", reason: "Requiere inicio de sesión." },
  { name: "CFE", status: "supported" },
  { name: "Chedraui Móvil", status: "supported" },
  { name: "Chip Macropay", status: "supported" },
  { name: "CoolMobile", status: "supported" },
  { name: "Comunicaciones Green", status: "supported" },
  { name: "Conect2", status: "supported" },
  {
    name: "Dalefon",
    status: "paused",
    reason: "Recaptcha bloquea peticiones desde servidor.",
  },
  { name: "Dialo", status: "supported" },
  { name: "Diri Móvil", status: "supported" },
  { name: "Dua", status: "supported" },
  { name: "ENI Networks", status: "supported" },
  { name: "Fangio Mobile", status: "supported" },
  { name: "Fedego!", status: "supported" },
  { name: "Fibracell", status: "supported" },
  { name: "Flash Mobile", status: "supported" },
  { name: "FRC Mobile", status: "supported" },
  { name: "Freedompop", status: "supported" },
  { name: "Gamers", status: "supported" },
  { name: "Gane", status: "supported" },
  { name: "Glovo Telecom", status: "supported" },
  { name: "Gmovil", status: "supported" },
  { name: "Grupo Inten", status: "supported" },
  { name: "Hashtag", status: "supported" },
  { name: "I AM Abundance", status: "supported" },
  { name: "IENTC", status: "supported" },
  { name: "Interlinked", status: "supported" },
  { name: "Inxel", status: "supported" },
  { name: "Iusatel", status: "supported" },
  { name: "Izzi", status: "paused", reason: "Requiere inicio de sesión." },
  { name: "Link Móvil", status: "supported" },
  { name: "Kolors Mobile", status: "supported" },
  { name: "Maifon", status: "supported" },
  {
    name: "Mega Móvil",
    status: "paused",
    reason:
      "Su API solo confirma una combinación específica de CURP + número de línea; no ofrece forma de listar líneas por CURP.",
  },
  { name: "México Móvil", status: "supported" },
  { name: "Mexfon", status: "supported" },
  {
    name: "Mi móvil",
    status: "paused",
    reason: "Recaptcha bloquea peticiones desde servidor.",
  },
  { name: "Mirlo", status: "supported" },
  { name: "MoBig", status: "supported" },
  {
    name: "Mosi",
    status: "paused",
    reason: "Recaptcha bloquea peticiones desde servidor.",
  },
  { name: "MobileArionet", status: "supported" },
  { name: "Movired", status: "supported" },
  { name: "Móvil para Todos", status: "supported" },
  { name: "Nabi", status: "supported" },
  { name: "Netmas", status: "supported" },
  { name: "Newww", status: "supported" },
  {
    name: "Nextor Movil",
    status: "paused",
    reason: "Rate limit agresivo.",
  },
  { name: "On-Link", status: "supported" },
  { name: "OUI", status: "supported" },
  { name: "Othisi Mobile", status: "supported" },
  {
    name: "Oxio",
    status: "paused",
    reason: "Recaptcha bloquea peticiones desde servidor.",
  },
  { name: "OXXO CEL", status: "supported" },
  { name: "PilloFon", status: "supported" },
  { name: "Playcell", status: "supported" },
  { name: "Red Aguila", status: "supported" },
  { name: "Red Blak", status: "supported" },
  { name: "Red Dog", status: "supported" },
  { name: "Red Potencia", status: "supported" },
  {
    name: "Redphone",
    status: "paused",
    reason: "Recaptcha bloquea peticiones desde servidor.",
  },
  { name: "Redicoppel", status: "supported" },
  { name: "Retemex", status: "supported" },
  { name: "RETESEC", status: "supported" },
  { name: "Rincel", status: "supported" },
  { name: "Secure Witness", status: "supported" },
  { name: "Sfon", status: "supported" },
  { name: "Sky", status: "supported" },
  { name: "Sorcel", status: "supported" },
  { name: "Spot 1", status: "supported" },
  { name: "Starline", status: "supported" },
  { name: "Telcel", status: "supported" },
  { name: "Telefónica Luna", status: "supported" },
  { name: "Telgen", status: "supported" },
  { name: "Telmovil", status: "supported" },
  { name: "Teracel", status: "supported" },
  { name: "TIC-OMV", status: "supported" },
  {
    name: "Telefónica Movistar",
    status: "pending",
    reason: "Pide documentos oficiales para verificar identidad.",
  },
  {
    name: "Tokamóvil",
    status: "paused",
    reason: "Requiere correo electrónico de registro.",
  },
  { name: "Tuis", status: "supported" },
  { name: "TurboCel", status: "supported" },
  { name: "Turbored", status: "supported" },
  { name: "Uber Cel", status: "supported" },
  { name: "Ultracel", status: "supported" },
  { name: "Vasanta", status: "supported" },
  { name: "Viral Cel", status: "paused", reason: "Requiere inicio de sesión." },
  { name: "Virgin Mobile", status: "supported" },
  { name: "VivaMX", status: "supported" },
  { name: "Weex", status: "supported" },
  { name: "Wiicel", status: "supported" },
  { name: "Wiki Katat", status: "supported" },
  { name: "Wimotelecom", status: "supported" },
  {
    name: "Yo mobile",
    status: "paused",
    reason: "Cloudflare JS challenge bloquea peticiones desde servidor.",
  },
  { name: "Yobi Telecom", status: "supported" },
  {
    name: "Yu Movil",
    status: "paused",
    reason: "Requiere login para consultar líneas.",
  },
];
