import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <main id="content" className={styles.main} tabIndex={-1}>
        <section
          className={styles.emptyState}
          aria-labelledby="not-found-title"
        >
          <p className={styles.statusCode}>Error 404</p>
          <h1 id="not-found-title">No encontramos esta página.</h1>
          <p className={styles.description}>
            Es posible que la dirección haya cambiado o que el enlace ya no esté
            disponible. Regresa al inicio para continuar tu consulta.
          </p>
          <Link className={styles.homeLink} href="/">
            Volver al inicio
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
