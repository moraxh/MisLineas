import { ArrowLeft, ExternalLink, Github, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { SponsorLink } from "@/components/home/SponsorLink";

const VELAR_URL = "https://velartech.com.mx/";

export default function DonarPage() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_40%,#ffffff_100%)] font-sans text-zinc-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <main className="flex flex-1 flex-col items-center justify-center gap-9 text-center">
          <div className="max-w-xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
              <HeartHandshake className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              MisLíneas ya cuenta con respaldo
            </h1>
            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              Velar Technologies cubre actualmente todos los gastos de
              infraestructura y mantenimiento del servicio. Por eso, no
              necesitas hacer una donación para que MisLíneas siga disponible de
              forma gratuita.
            </p>
          </div>

          <section
            aria-labelledby="support-heading"
            className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <h2 id="support-heading" className="sr-only">
              Respaldo y formas de apoyo
            </h2>
            <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="flex flex-col justify-between gap-8 bg-sky-50/70 p-6 sm:p-7">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-900/60">
                    Respaldo actual
                  </p>
                  <p className="text-sm leading-6 text-zinc-700">
                    Velar Technologies cubre la infraestructura y el
                    mantenimiento de MisLíneas.
                  </p>
                </div>
                <SponsorLink variant="page" />
              </div>

              <div className="flex flex-col justify-between gap-7 p-6 text-left sm:p-7">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Apoyo al proyecto
                  </p>
                  <p className="text-sm leading-6 text-zinc-600">
                    No necesitas donar. Si quieres ayudar, puedes compartir el
                    servicio, reportar errores o contribuir en{" "}
                    <a
                      href="https://github.com/moraxh/MisLineas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600"
                    >
                      GitHub
                      <Github className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    .
                  </p>
                </div>
                <a
                  href={VELAR_URL}
                  target="_blank"
                  rel="sponsored noopener"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600"
                >
                  Conocer a Velar Technologies
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          <p className="max-w-md text-xs leading-6 text-zinc-400">
            Gracias por usar el servicio y por compartirlo con quien pueda
            necesitarlo.
          </p>
        </main>
      </div>
    </div>
  );
}
