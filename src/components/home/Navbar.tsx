"use client";

import { Github, Menu, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { SponsorLink } from "@/components/home/SponsorLink";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSectionNavigation = (sectionId: string) => {
    setIsMenuOpen(false);
    window.location.hash = sectionId;
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 backdrop-blur-md">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="group flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              aria-label="MisLíneas, inicio"
            >
              <Image
                src={logo}
                alt="MisLíneas"
                width={32}
                height={32}
                className="rounded-md transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-semibold tracking-tight text-zinc-950">
                MisLíneas
              </span>
            </a>
            <a
              href="https://github.com/moraxh/MisLineas"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver MisLíneas en GitHub"
              title="Ver MisLíneas en GitHub"
              className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-5 md:flex">
              <a
                href="#seguridad"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Seguridad
              </a>
              <a
                href="#arco"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Derechos ARCO
              </a>
            </div>

            <div className="hidden md:block">
              <SponsorLink variant="header" />
            </div>

            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-950 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 active:translate-y-px md:flex"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Reportar Fraude
            </a>

            <button
              type="button"
              className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-40 space-y-4 overflow-hidden border-b border-zinc-200 bg-white px-4 py-5 md:hidden"
          >
            <button
              type="button"
              onClick={() => handleSectionNavigation("seguridad")}
              className="block w-full rounded-md py-1 text-left font-medium text-zinc-700 transition-colors hover:text-zinc-950"
            >
              Seguridad
            </button>
            <button
              type="button"
              onClick={() => handleSectionNavigation("arco")}
              className="block w-full rounded-md py-1 text-left font-medium text-zinc-700 transition-colors hover:text-zinc-950"
            >
              Derechos ARCO
            </button>
            <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4">
              <SponsorLink variant="header" />
            </div>
            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 py-3 font-medium text-white transition-colors hover:bg-zinc-800 active:translate-y-px"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Reportar Fraude
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
