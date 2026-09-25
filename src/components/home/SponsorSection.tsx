import { SponsorLink } from "@/components/home/SponsorLink";
import styles from "./SponsorSection.module.css";

export function SponsorSection() {
  return (
    <div className={styles.content}>
      <div className={styles.copy}>
        <p className={styles.lead}>
          Un proyecto independiente con respaldo técnico.
        </p>
        <p>
          Velar Technologies es una empresa mexicana de tecnología que integra
          sistemas y datos empresariales, construye software a la medida y
          automatiza procesos con inteligencia artificial.
        </p>
        <p>
          MisLíneas fue creado originalmente por Jorge Mora y Hadassah García.
          Cuando el servicio comenzó a recibir abuso y aumentaron los costos de
          infraestructura y protección, Velar Technologies se ofreció a
          cubrirlos para mantener las consultas gratuitas.
        </p>
      </div>
      <aside className={styles.sponsor} aria-label="Visitar Velar Technologies">
        <p className={styles.sponsorLabel}>Visitar Velar Technologies</p>
        <SponsorLink variant="page" className={styles.sponsorLink} />
      </aside>
    </div>
  );
}
