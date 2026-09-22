import { ArrowUpRight } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const rights = [
  {
    name: "Acceso",
    description: "Conoce qué datos tiene la operadora sobre ti.",
  },
  {
    name: "Rectificación",
    description: "Solicita corregir datos inexactos o incompletos.",
  },
  {
    name: "Cancelación",
    description: "Solicita la eliminación de tus datos cuando proceda.",
  },
  {
    name: "Oposición",
    description: "Solicita que dejen de usar tus datos para ciertos fines.",
  },
];

export function ArcoHelp() {
  return (
    <AccordionItem value="arco">
      <AccordionTrigger className="min-h-14 text-sm">
        Derechos ARCO y reportes
      </AccordionTrigger>
      <AccordionContent className="space-y-5 pb-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Puedes ejercer estos derechos ante tu operadora, conforme a la Ley
          Federal de Protección de Datos Personales en Posesión de los
          Particulares.
        </p>
        <dl className="divide-y divide-border">
          {rights.map((right) => (
            <div
              key={right.name}
              className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-3 py-3 first:pt-0"
            >
              <dt className="text-sm font-medium">{right.name}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">
                {right.description}
              </dd>
            </div>
          ))}
        </dl>
        <a
          href="https://sidof.segob.gob.mx/notas/docFuente/5752569"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground"
        >
          Consultar la ley{" "}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
        <Separator />
        <section aria-labelledby="unknown-line-title" className="space-y-3">
          <h3 id="unknown-line-title" className="text-sm font-medium">
            ¿No reconoces una línea?
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Contacta a la operadora para aclarar el registro y solicitar la
            desvinculación. Guarda el folio para dar seguimiento.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Si la plataforma de registro o consulta presenta fallas, puedes
            reportarlas ante la CRT.
          </p>
          <Button
            asChild
            variant="outline"
            className="min-h-11 w-full whitespace-normal text-sm"
          >
            <a
              href="https://portal.crt.gob.mx/reporte-fallas-plataforma-registro"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reportar una falla en la CRT <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </section>
      </AccordionContent>
    </AccordionItem>
  );
}
