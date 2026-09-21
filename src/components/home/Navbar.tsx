"use client";

import { Menu, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { SponsorLink } from "@/components/home/SponsorLink";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Image
              src={logo}
              alt="MisLíneas"
              width={34}
              height={34}
              className="rounded-md transition-transform group-hover:scale-105"
            />
            <span className="font-semibold text-lg tracking-tight">
              MisLíneas
            </span>
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

            <SponsorLink variant="header" />

            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 md:flex"
            >
              <ShieldAlert className="h-4 w-4" />
              Reportar Fraude
            </a>

            <button
              type="button"
              className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Menú"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-200 px-4 py-6 space-y-4 overflow-hidden z-40 relative"
          >
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                window.location.hash = "seguridad";
              }}
              className="block w-full text-left font-medium text-zinc-700"
            >
              Seguridad
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                window.location.hash = "arco";
              }}
              className="block w-full text-left font-medium text-zinc-700"
            >
              Derechos ARCO
            </button>
            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="bg-black text-white w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Reportar Fraude
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
