import { Ban, Bot, DollarSign, PauseCircle } from "lucide-react";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

export default function MisLineas() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_42%,#ffffff_100%)] font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Navbar />

      <main
        id="contenido"
        className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24"
      >
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <PauseCircle className="h-7 w-7 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            MisLíneas está pausado temporalmente
          </h1>

          <p className="max-w-xl text-balance text-zinc-600">
            Hemos decidido detener el servicio de forma temporal, hasta
            encontrar una forma de mitigar los siguientes problemas:
          </p>

          <div className="mt-2 grid w-full gap-4 text-left sm:grid-cols-1">
            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <Bot className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
              <p className="text-sm text-zinc-700">
                <strong className="text-zinc-900">Uso masivo de bots:</strong>{" "}
                el servicio ha sido blanco de consultas automatizadas a gran
                escala, muy por encima del uso que hace una persona real.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
              <p className="text-sm text-zinc-700">
                <strong className="text-zinc-900">
                  Costos de infraestructura insostenibles:
                </strong>{" "}
                ese abuso ha disparado los costos de operación de un proyecto
                que es y siempre ha sido gratuito y sin fines de lucro.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
              <p className="text-sm text-zinc-700">
                <strong className="text-zinc-900">
                  Intentos de reventa del servicio:
                </strong>{" "}
                algunas personas han intentado ofrecer MisLíneas como un
                servicio de pago propio, incluso con publicidad, sin ninguna
                relación con este proyecto.
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm text-zinc-500">
            Estamos trabajando en encontrar una forma de mitigar estos problemas
            para poder reactivar el servicio. Gracias por tu paciencia y por
            seguir apoyando este proyecto independiente.
          </p>
        </div>

        <Footer />
      </main>
    </div>
  );
}
