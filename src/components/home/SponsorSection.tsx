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
          Velar Technologies digitaliza los procesos de las empresas, unifica
          sus sistemas aislados en una operación conectada y les permite tomar
          decisiones con inteligencia artificial nativa.
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
        <SponsorLink
          variant="page"
          className={styles.sponsorLink}
          hideLabel
          logo="isotype"
        />
      </aside>
    </div>
  );
}
