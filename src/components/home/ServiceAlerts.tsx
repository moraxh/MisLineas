import { AlertTriangle, ArrowUpRight, PartyPopper } from "lucide-react";
import styles from "./ServiceAlerts.module.css";

type AlertNotice = {
  kind: "return" | "telcel";
  title: string;
  copy: string;
  action: string;
  href: string;
  external?: boolean;
};

const notices: AlertNotice[] = [
  {
    kind: "return",
    title: "¡Estamos de vuelta!",
    copy: "Pausamos el servicio por seguridad y costos tras un mal uso de la plataforma. Ahora Velar Technologies es nuestro patrocinador y cubre todos los gastos.",
    action: "Conocer más",
    href: "/donar",
  },
  {
    kind: "telcel",
    title: "Aviso Telcel:",
    copy: "algunas líneas pueden no aparecer aunque ya estén registradas.",
    action: "Revisar vinculación",
    href: "https://registro.telcel.com/vinculatulinea/#/",
    external: true,
  },
];

function NoticeIcon({ notice }: { notice: AlertNotice }) {
  return (
    <span
      className={`${styles.icon} ${notice.kind === "return" ? styles.returnIcon : styles.telcelIcon}`}
      aria-hidden="true"
    >
      {notice.kind === "return" ? (
        <PartyPopper size={17} strokeWidth={1.8} />
      ) : (
        <AlertTriangle size={17} strokeWidth={1.8} />
      )}
    </span>
  );
}

function NoticeLink({ notice }: { notice: AlertNotice }) {
  return (
    <a
      className={`${styles.link} ${notice.kind === "return" ? styles.returnLink : styles.telcelLink}`}
      href={notice.href}
      target={notice.external ? "_blank" : undefined}
      rel={notice.external ? "noopener noreferrer" : undefined}
    >
      {notice.action}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

export function ServiceAlerts({
  kind,
  placement = "page",
}: {
  kind?: AlertNotice["kind"];
  placement?: "page" | "lookup";
}) {
  const visibleNotices = kind
    ? notices.filter((notice) => notice.kind === kind)
    : notices;

  return (
    <section
      className={`${styles.alerts} ${placement === "lookup" ? styles.lookupAlerts : ""}`}
      aria-label="Avisos importantes"
    >
      <div className={styles.bandList}>
        {visibleNotices.map((notice) => (
          <article
            className={`${styles.band} ${notice.kind === "return" ? styles.returnBand : styles.telcelBand}`}
            key={notice.kind}
          >
            <NoticeIcon notice={notice} />
            <p className={styles.copy}>
              <strong
                className={
                  notice.kind === "return"
                    ? styles.returnText
                    : styles.telcelText
                }
              >
                {notice.title}
              </strong>{" "}
              {notice.copy}
            </p>
            <NoticeLink notice={notice} />
          </article>
        ))}
      </div>
    </section>
  );
}
