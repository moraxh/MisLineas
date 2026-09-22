"use client";

import { ArrowUpRight } from "lucide-react";
import { Manrope } from "next/font/google";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { SponsorLink } from "@/components/home/SponsorLink";
import styles from "./SiteHeader.module.css";

const manrope = Manrope({ subsets: ["latin"] });

const navigationLinks = [
  { href: "/#seguridad", label: "Seguridad" },
  { href: "/#arco", label: "Derechos ARCO" },
];

export function SiteHeader() {
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;

    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setIsScrolled(!entry.isIntersecting);
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.headerSlot}>
      <div
        ref={scrollSentinelRef}
        className={styles.scrollSentinel}
        aria-hidden="true"
      />
      <header
        data-scrolled={isScrolled}
        className={`${styles.header} ${manrope.className} text-zinc-950`}
      >
        <div className={styles.surface} aria-hidden="true" />
        <div
          className={`${styles.topRow} mx-auto flex max-w-[1160px] items-center justify-between gap-5 px-4 sm:px-7 lg:px-10`}
        >
          <a
            href="/"
            aria-label="MisLíneas, inicio"
            className={`${styles.brand} flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900`}
          >
            <Image
              src={logo}
              alt=""
              width={44}
              height={44}
              className={styles.mark}
              priority
            />
            <span
              className={`${styles.wordmark} text-[1.2rem] font-bold tracking-[-0.045em] text-zinc-950 sm:text-[1.35rem]`}
            >
              MisLíneas
            </span>
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 lg:flex"
          >
            {navigationLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`${styles.navLink} text-[0.9rem] font-medium text-zinc-600 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900`}
              >
                {label}
              </a>
            ))}
            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.navLink} ${styles.externalLink} inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-zinc-600 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900`}
            >
              Reportar fraude
              <ArrowUpRight
                className={`${styles.externalIcon} size-4`}
                aria-hidden="true"
              />
            </a>
          </nav>

          <SponsorLink variant="redesign-header" className={styles.sponsor} />
        </div>

        <nav
          aria-label="Navegación secundaria"
          className="flex min-h-12 flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-[0.78rem] font-medium text-zinc-600 sm:px-8 lg:hidden"
        >
          {navigationLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`${styles.navLink} focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900`}
            >
              {label}
            </a>
          ))}
          <a
            href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.navLink} ${styles.externalLink} inline-flex items-center gap-1 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900`}
          >
            Reportar fraude
            <ArrowUpRight
              className={`${styles.externalIcon} size-3.5`}
              aria-hidden="true"
            />
          </a>
        </nav>
      </header>
    </div>
  );
}
