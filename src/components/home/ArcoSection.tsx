import { ArrowUpRight, CircleAlert } from "lucide-react";
import { ARCO_RIGHTS } from "@/lib/data/content";
import styles from "./ArcoSection.module.css";

const LAW_URL = "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf";
const CRT_REPORT_URL =
  "https://portal.crt.gob.mx/reporte-fallas-plataforma-registro";

export function ArcoSection() {
  return (
    <div className={styles.content}>
      <div className={styles.intro}>
        <h3>Sobre tus datos, tú decides.</h3>
        <p>
          Puedes ejercer estos derechos directamente ante tu operadora, conforme
          a la ley.
        </p>
      </div>

      <dl className={styles.rights}>
        {ARCO_RIGHTS.map((right) => (
          <div className={styles.right} key={right.t}>
            <span className={styles.initial} aria-hidden="true">
              {right.t[0]}
            </span>
            <dt>{right.t}</dt>
            <dd>{right.d}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.followUp}>
        <div className={styles.followUpCopy}>
          <CircleAlert size={20} aria-hidden="true" />
          <div>
            <h3>¿No reconoces una línea?</h3>
            <p>
              Solicita la aclaración o desvinculación directamente con la
              operadora.
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <a
            className={styles.lawLink}
            href={LAW_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar la ley
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <a
            className={styles.reportLink}
            href={CRT_REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reportar una falla en la CRT
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
