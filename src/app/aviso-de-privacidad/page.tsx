import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Aviso de Privacidad",
  description:
    "Aviso de privacidad de MisLíneas conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
  alternates: {
    canonical: "/aviso-de-privacidad",
  },
};

const lastUpdated = "21 de septiembre de 2026";

const sections = [
  ["responsable", "Responsable del tratamiento de datos"],
  ["datos", "Datos personales que se recaban"],
  ["finalidad", "Finalidad del tratamiento"],
  ["transferencia", "Transferencia de datos"],
  ["arco", "Derechos ARCO"],
  ["cookies", "Cookies y almacenamiento local"],
  ["seguridad", "Seguridad"],
  ["cambios", "Cambios a este aviso"],
] as const;

function ExternalArrow() {
  return <ArrowUpRight className={styles.externalIcon} aria-hidden="true" />;
}

export default function AvisoDePrivacidad() {
  return (
    <div className={styles.page}>
      <main id="content" className={styles.main} tabIndex={-1}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} aria-hidden="true" />
          Volver al inicio
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroIcon} aria-hidden="true">
            <ShieldCheck className={styles.heroIconGraphic} />
          </div>
          <p className={styles.eyebrow}>Información legal</p>
          <h1 className={styles.title}>Aviso de Privacidad</h1>
          <p className={styles.updated}>
            Última actualización:{" "}
            <time dateTime="2026-09-21">{lastUpdated}</time>
          </p>
        </header>

        <article className={styles.document}>
          <nav className={styles.toc} aria-label="Secciones del aviso">
            <p className={styles.tocTitle}>En esta página</p>
            <ol className={styles.tocList}>
              {sections.map(([id, title], index) => (
                <li key={id}>
                  <a href={`#${id}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section id="responsable" className={styles.section}>
            <h2>1. Responsable del tratamiento de datos</h2>
            <p>
              <strong>MisLíneas</strong> es una plataforma ciudadana
              independiente, de código abierto, sin fines de lucro, disponible
              en{" "}
              <a href="https://mislineas.com.mx" className={styles.inlineLink}>
                mislineas.com.mx <ExternalArrow />
              </a>
              . El responsable del tratamiento de los datos es el autor del
              proyecto (disponible en{" "}
              <a
                href="https://github.com/moraxh/MisLineas"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/moraxh/MisLineas <ExternalArrow />
              </a>
              ).
            </p>
          </section>

          <section id="datos" className={styles.section}>
            <h2>2. Datos personales que se recaban</h2>
            <p>
              Para realizar una consulta, el usuario proporciona voluntariamente
              su <strong>CURP</strong> (Clave Única de Registro de Población).
              Este dato es enviado directamente a los portales oficiales de las
              operadoras de telecomunicaciones de México para obtener la
              información de líneas registradas.
            </p>
            <p>
              MisLíneas <strong>no almacena tu CURP</strong> en ningún servidor
              propio. El único registro local es el historial guardado en el
              navegador del propio usuario ( <code>localStorage</code> ), que
              nunca sale de su dispositivo.
            </p>
          </section>

          <section id="finalidad" className={styles.section}>
            <h2>3. Finalidad del tratamiento</h2>
            <ul>
              <li>
                Consultar las líneas telefónicas vinculadas a la CURP del
                usuario ante las operadoras participantes.
              </li>
              <li>
                Facilitar el ejercicio de derechos ARCO (Acceso, Rectificación,
                Cancelación u Oposición) ante dichas operadoras.
              </li>
            </ul>
            <p>
              No se utilizan los datos para fines de mercadotecnia, perfilado,
              venta a terceros ni ningún otro fin distinto al descrito.
            </p>
          </section>

          <section id="transferencia" className={styles.section}>
            <h2>4. Transferencia de datos</h2>
            <p>
              La CURP es transmitida, en tiempo real y de forma cifrada (HTTPS),
              únicamente a los portales oficiales de las operadoras de
              telecomunicaciones para realizar la consulta. MisLíneas actúa como
              intermediario técnico y no retiene una copia de dicha información.
            </p>
          </section>

          <section id="arco" className={styles.section}>
            <h2>5. Derechos ARCO</h2>
            <p>
              Conforme a la{" "}
              <strong>
                Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares (LFPDPPP)
              </strong>
              , tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al
              tratamiento de tus datos personales.
            </p>
            <p>
              Dado que MisLíneas no almacena tus datos en servidores propios, el
              ejercicio de derechos ARCO frente a las operadoras debe realizarse
              directamente ante cada una de ellas a través de sus canales
              oficiales o del portal del{" "}
              <a
                href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Centro de Registro de Telecomunicaciones (CRT) <ExternalArrow />
              </a>
              .
            </p>
            <p>
              Para cualquier consulta sobre privacidad relacionada con esta
              plataforma, puedes abrir un issue en el repositorio público de
              GitHub.
            </p>
          </section>

          <section id="cookies" className={styles.section}>
            <h2>6. Cookies y almacenamiento local</h2>
            <p>
              MisLíneas no utiliza cookies de seguimiento ni herramientas de
              publicidad. Se usa{" "}
              <a
                href="https://vercel.com/docs/analytics"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel Analytics <ExternalArrow />
              </a>{" "}
              para estadísticas de uso agregadas y anónimas (sin identificación
              personal). El historial de consultas se guarda únicamente en el{" "}
              <code>localStorage</code> del navegador del usuario.
            </p>
          </section>

          <section id="seguridad" className={styles.section}>
            <h2>7. Seguridad</h2>
            <p>
              Todas las comunicaciones entre tu navegador y los servidores de
              MisLíneas se realizan mediante HTTPS. El código fuente es público
              y auditable en{" "}
              <a
                href="https://github.com/moraxh/MisLineas"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub <ExternalArrow />
              </a>
              .
            </p>
            <p>
              Para prevenir abuso automatizado del formulario de consulta,
              MisLíneas utiliza{" "}
              <a
                href="https://www.cloudflare.com/products/turnstile/"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare Turnstile <ExternalArrow />
              </a>{" "}
              en modo invisible. El uso de este servicio se rige por el{" "}
              <a
                href="https://www.cloudflare.com/turnstileprivacypolicy/"
                className={styles.inlineLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Turnstile Privacy Addendum de Cloudflare <ExternalArrow />
              </a>
              .
            </p>
          </section>

          <section id="cambios" className={styles.section}>
            <h2>8. Cambios a este aviso</h2>
            <p>
              Cualquier modificación a este aviso de privacidad será publicada
              en esta página con la fecha de actualización correspondiente. Se
              recomienda revisarlo periódicamente.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
