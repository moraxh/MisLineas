import { Heart, ShieldCheck } from "lucide-react";
import { SponsorLink } from "@/components/home/SponsorLink";

export function SponsorSection() {
  return (
    <div className="pt-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-zinc-900">
              Con el respaldo de Velar Technologies
            </h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            MisLíneas fue desarrollado por Jorge Mora, líder de desarrollo de
            Velar Technologies. La empresa cubre los costos de operación y
            mantenimiento para que puedas seguir consultando tus líneas gratis.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-zinc-900">
              Por qué es necesario
            </h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            El tráfico de bots ha aumentado los gastos de infraestructura y
            protección del servicio. Velar Technologies absorbe esos costos para
            mantener el proyecto disponible.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <SponsorLink variant="page" />
      </div>
    </div>
  );
}
