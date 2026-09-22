"use client";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOperatorDisplayStatus,
  OPERATOR_STATUS_LABELS,
  OPERATORS,
} from "@/lib/data/operators";
import { AboutVelar } from "./AboutVelar";
import { ArcoHelp } from "./ArcoHelp";

export function Coverage() {
  const [query, setQuery] = useState("");
  const operators = OPERATORS.filter((o) =>
    `${o.name} ${OPERATOR_STATUS_LABELS[getOperatorDisplayStatus(o)]}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  ).sort((a, b) => a.name.localeCompare(b.name, "es"));
  return (
    <Accordion type="single" collapsible className="mt-7">
      <AccordionItem value="operators">
        <AccordionTrigger className="min-h-14 text-sm">
          Operadoras disponibles
          <Badge variant="secondary" className="ml-auto mr-2">
            {OPERATORS.length}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Integraciones registradas en el proyecto. La disponibilidad puede
            cambiar al consultar.
          </p>
          <div className="space-y-2">
            <Label htmlFor="operator-search">Buscar operadora</Label>
            <Input
              id="operator-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o estado"
              className="h-11 text-base md:text-base"
            />
          </div>
          <section
            className="max-h-80 overflow-y-auto rounded-lg border border-border"
            aria-label="Lista de operadoras"
          >
            {operators.map((o) => {
              const status = getOperatorDisplayStatus(o);
              return (
                <div
                  key={o.name}
                  className="border-b border-border p-3 last:border-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 basis-28 break-words text-sm font-medium">
                      {o.name}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      <span
                        className={`mr-1 size-1.5 rounded-full ${status === "supported" ? "bg-emerald-500" : status === "pending" ? "bg-amber-400" : "bg-rose-400"}`}
                      />
                      {OPERATOR_STATUS_LABELS[status]}
                    </Badge>
                  </div>
                  {o.reason && (
                    <p className="mt-1.5 break-words text-xs leading-5 text-muted-foreground">
                      {o.reason}
                    </p>
                  )}
                </div>
              );
            })}
            {!operators.length && (
              <p className="p-5 text-sm text-muted-foreground">
                No encontramos esa operadora.
              </p>
            )}
          </section>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="privacy">
        <AccordionTrigger className="min-h-14 text-sm">
          Privacidad y seguridad
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Tu CURP se utiliza para consultar las plataformas de las operadoras.
            No necesitas crear una cuenta.
          </p>
          <p>Los resultados dependen de la respuesta de cada proveedor.</p>
          <a
            href="/aviso-de-privacidad"
            className="underline underline-offset-4"
          >
            Leer aviso de privacidad
          </a>
        </AccordionContent>
      </AccordionItem>
      <ArcoHelp />
      <AboutVelar />
    </Accordion>
  );
}
