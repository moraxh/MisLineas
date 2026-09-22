import { ArrowUpRight } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AboutVelar() {
  return (
    <AccordionItem value="velar">
      <AccordionTrigger className="min-h-14 text-sm">
        ¿Quiénes son Velar Technologies?
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          MisLíneas fue desarrollado por Jorge Mora, líder de desarrollo de
          Velar Technologies. La empresa cubre los costos de operación y
          mantenimiento para que puedas seguir consultando tus líneas gratis.
        </p>
        <p>
          El tráfico de bots ha aumentado los gastos de infraestructura y
          protección del servicio. Velar Technologies absorbe esos costos para
          mantener el proyecto disponible.
        </p>
        <a
          href="https://velartech.com.mx/"
          target="_blank"
          rel="sponsored noopener"
          referrerPolicy="strict-origin-when-cross-origin"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Conoce Velar <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </AccordionContent>
    </AccordionItem>
  );
}
