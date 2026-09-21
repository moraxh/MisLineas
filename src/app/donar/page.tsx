import { ArrowLeft, ExternalLink, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { SponsorLink } from "@/components/home/SponsorLink";

const VELAR_URL = "https://velartech.com.mx/";

export default function DonarPage() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_40%,#ffffff_100%)] font-sans text-zinc-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <main className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
            <HeartHandshake className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              MisLíneas ya cuenta con respaldo
            </h1>
            <p className="max-w-md text-sm leading-7 text-zinc-600 sm:text-base">
              Velar Technologies cubre actualmente todos los gastos de
              infraestructura y mantenimiento del servicio. Por eso, no
              necesitas hacer una donación para que MisLíneas siga disponible de
              forma gratuita.
            </p>
          </div>

          <section className="w-full rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm">
            <SponsorLink variant="page" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Apoyo al proyecto
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              MisLíneas continúa siendo un proyecto independiente, sin anuncios
              y sin fines de lucro.
            </p>
            <a
              href={VELAR_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600"
            >
              Conocer a Velar Technologies
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
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
