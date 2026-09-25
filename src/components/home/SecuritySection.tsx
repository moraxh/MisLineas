import {
  ArrowRight,
  ArrowUpRight,
  Database,
  EyeOff,
  Github,
  LockKeyhole,
} from "lucide-react";
import styles from "./SecuritySection.module.css";

const facts = [
  {
    icon: EyeOff,
    title: "No la guardamos",
    description: "La CURP no se conserva en nuestros servidores.",
  },
  {
    icon: Database,
    title: "Historial local",
    description: "Tus búsquedas recientes solo viven en este navegador.",
  },
  {
    icon: LockKeyhole,
    title: "Conexión protegida",
    description: "La consulta se transmite mediante HTTPS.",
  },
];

export function SecuritySection() {
  return (
    <div className={styles.content}>
      <div className={styles.intro}>
        <p className={styles.lead}>Tu CURP se usa solo para consultar.</p>
        <p className={styles.summary}>
          No creamos cuentas ni perfiles con ella.
        </p>
      </div>

      <dl className={styles.facts}>
        {facts.map(({ icon: Icon, title, description }) => (
          <div className={styles.fact} key={title}>
            <span className={styles.factIcon} aria-hidden="true">
              <Icon size={23} strokeWidth={1.8} />
            </span>
            <dt>{title}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.footer}>
        <span className={styles.secureLabel}>HTTPS activo</span>
        <a className={styles.sourceLink} href="/aviso-de-privacidad">
          Aviso de privacidad
          <ArrowRight size={15} aria-hidden="true" />
        </a>
        <a
          className={styles.sourceLink}
          href="https://github.com/moraxh/MisLineas"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={15} aria-hidden="true" />
          Código abierto
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
