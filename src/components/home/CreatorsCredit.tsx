import { ArrowUpRight, Github } from "lucide-react";
import Image from "next/image";
import styles from "./CreatorsCredit.module.css";

const VELAR_URL = "https://velartech.com.mx/";

const creators = [
  { name: "Jorge Mora", handle: "@moraxh", href: "https://github.com/moraxh" },
  {
    name: "Hadassah García",
    handle: "@HadassahGarcia",
    href: "https://github.com/HadassahGarcia",
  },
];

export function CreatorsCredit() {
  return (
    <section className={styles.section} aria-label="Creadores de MisLíneas">
      <span className={styles.label}>Creado por</span>
      <div className={styles.list}>
        {creators.map((creator) => (
          <a
            className={styles.creator}
            href={creator.href}
            key={creator.handle}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={15} aria-hidden="true" />
            <span>{creator.name}</span>
            <span className={styles.handle}>{creator.handle}</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        ))}
      </div>
      <a
        className={styles.sponsor}
        href={VELAR_URL}
        target="_blank"
        rel="sponsored noopener"
        referrerPolicy="strict-origin-when-cross-origin"
        aria-label="Sponsored by Velar Technologies"
        title="Sponsored by Velar Technologies"
      >
        <span className={styles.sponsorLabel}>Sponsored by</span>
        <Image
          src="/branding/velar-isotype.png"
          alt="Velar Technologies"
          width={32}
          height={32}
          className={styles.sponsorIcon}
        />
      </a>
    </section>
  );
}
