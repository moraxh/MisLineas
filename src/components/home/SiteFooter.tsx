import {
  ArrowUpRight,
  Github,
  HeartHandshake,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { SponsorLink } from "@/components/home/SponsorLink";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.main}>
          <div className={styles.identity}>
            <div className={styles.brand}>
              <Image src={logo} alt="MisLíneas" width={28} height={28} />
              <span>MisLíneas</span>
            </div>
            <p>Consulta las líneas telefónicas vinculadas a tu CURP.</p>
          </div>

          <div className={styles.linksArea}>
            <div className={styles.linksIntro}>
              <h2>Conoce el proyecto</h2>
              <p>
                Revisa el código, conoce cómo protegemos tu información o
                escríbenos.
              </p>
            </div>

            <nav className={styles.links} aria-label="Enlaces del sitio">
              <a
                href="https://github.com/moraxh/MisLineas"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.linkIcon} aria-hidden="true">
                  <Github />
                </span>
                <span className={styles.linkCopy}>
                  <span className={styles.linkName}>Repositorio</span>
                  <span className={styles.linkDescription}>Código abierto</span>
                </span>
                <ArrowUpRight className={styles.linkArrow} aria-hidden="true" />
              </a>
              <a href="/aviso-de-privacidad">
                <span className={styles.linkIcon} aria-hidden="true">
                  <ShieldCheck />
                </span>
                <span className={styles.linkCopy}>
                  <span className={styles.linkName}>Privacidad</span>
                  <span className={styles.linkDescription}>
                    Cómo usamos tus datos
                  </span>
                </span>
                <ArrowUpRight className={styles.linkArrow} aria-hidden="true" />
              </a>
              <a href="mailto:contact@moraxh.dev">
                <span className={styles.linkIcon} aria-hidden="true">
                  <Mail />
                </span>
                <span className={styles.linkCopy}>
                  <span className={styles.linkName}>Contacto</span>
                  <span className={styles.linkDescription}>
                    contact@moraxh.dev
                  </span>
                </span>
                <ArrowUpRight className={styles.linkArrow} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>

        <div className={styles.meta}>
          <p>
            Servicio gratuito y sin fines de lucro. No afiliado al Gobierno de
            México.
          </p>
          <a className={styles.support} href="/donar">
            <HeartHandshake size={16} aria-hidden="true" />
            <span>Apoyar el proyecto</span>
          </a>
          <SponsorLink variant="footer" className={styles.sponsor} />
        </div>
      </div>
    </footer>
  );
}
