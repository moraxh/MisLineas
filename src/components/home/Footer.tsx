import { HeartHandshake, Mail } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { SponsorLink } from "@/components/home/SponsorLink";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-200 pt-10 text-sm text-zinc-500 sm:pt-12">
      <div className="grid gap-10 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,2fr)] md:items-start md:gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 font-medium text-zinc-950">
            <Image
              src={logo}
              alt="MisLíneas"
              width={22}
              height={22}
              className="rounded"
            />
            <span>MisLíneas</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Una plataforma ciudadana independiente para consultar las líneas
            telefónicas vinculadas a tu CURP.
          </p>
        </div>

        <div className="min-w-0">
          <nav
            aria-label="Enlaces del sitio"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3"
          >
            <div className="min-w-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Proyecto
              </p>
              <a
                href="https://github.com/moraxh/MisLineas"
                className="block w-fit text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950"
                target="_blank"
                rel="noopener noreferrer"
              >
                Repositorio Open Source
              </a>
            </div>

            <div className="min-w-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Privacidad
              </p>
              <a
                href="/aviso-de-privacidad"
                className="block w-fit text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950"
              >
                Aviso de Privacidad
              </a>
            </div>

            <div className="min-w-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Contacto
              </p>
              <a
                href="mailto:contact@moraxh.dev"
                className="flex min-h-6 min-w-0 items-start gap-1.5 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950"
              >
                <Mail
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">contact@moraxh.dev</span>
              </a>
            </div>
          </nav>
        </div>
      </div>

      <div className="mt-10 grid gap-4 border-t border-zinc-100 pt-5 text-xs leading-5 text-zinc-400 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
        <p>
          Servicio gratuito y sin fines de lucro. No afiliado al Gobierno de
          México.
        </p>
        <a
          href="/donar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950"
        >
          <HeartHandshake className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="block">Apoyar el proyecto</span>
            <span className="block text-xs font-normal text-zinc-400">
              No necesitas donar
            </span>
          </span>
        </a>
        <SponsorLink variant="footer" />
      </div>
    </footer>
  );
}
