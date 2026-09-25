import { ArrowLeft, Github, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { SponsorLink } from "@/components/home/SponsorLink";
import styles from "./page.module.css";

export default function DonarPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          Volver al inicio
        </Link>

        <section className={styles.hero} aria-labelledby="support-heading">
          <div className={styles.heroIcon}>
            <HeartHandshake
              className={styles.heroIconGraphic}
              aria-hidden="true"
            />
          </div>
          <p className={styles.eyebrow}>Respaldo del proyecto</p>
          <h1 id="support-heading" className={styles.title}>
            MisLíneas ya cuenta con respaldo
          </h1>
          <p className={styles.description}>
            Un patrocinador cubre actualmente todos los gastos de
            infraestructura y mantenimiento del servicio. Por eso, no necesitas
            hacer una donación para que MisLíneas siga disponible de forma
            gratuita.
          </p>
        </section>

        <section
          className={styles.supportCard}
          aria-label="Respaldo y formas de apoyo"
        >
          <div className={styles.sponsorPanel}>
            <div className={styles.panelCopy}>
              <p className={styles.panelLabel}>Respaldo actual</p>
              <p className={styles.panelText}>
                Velar Technologies cubre la infraestructura y el mantenimiento
                de MisLíneas.
              </p>
            </div>
            <SponsorLink variant="page" />
          </div>

          <div className={styles.projectPanel}>
            <div className={styles.panelCopy}>
              <p className={styles.panelLabel}>Apoyo al proyecto</p>
              <p className={styles.panelText}>
                No necesitas donar. Si quieres ayudar, puedes compartir el
                servicio, reportar errores o contribuir en{" "}
                <a
                  href="https://github.com/moraxh/MisLineas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.inlineLink}
                >
                  GitHub
                  <Github className={styles.inlineIcon} aria-hidden="true" />
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <div className={styles.thanks}>
          <p>
            Antes de este respaldo, MisLíneas se mantuvo gracias a las
            donaciones y al apoyo de personas de la comunidad. Gracias a cada
            una de ellas.
          </p>
          <p>
            Gracias por usar el servicio y por compartirlo con quien pueda
            necesitarlo.
          </p>
        </div>
      </main>
    </div>
  );
}
