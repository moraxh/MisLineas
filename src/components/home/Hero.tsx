"use client";

import { Github } from "lucide-react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { TOTAL_QUERIES } from "@/lib/data/content";

function AnimatedCount({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const raw = useMotionValue(0);
  const smoothed = useSpring(raw, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (inView) raw.set(target);
  }, [inView, raw, target]);

  useEffect(() => {
    return smoothed.on("change", (value) => {
      if (ref.current) {
        ref.current.textContent = `+${Math.round(value).toLocaleString("es-MX")}`;
      }
    });
  }, [smoothed]);

  return <span ref={ref}>+0</span>;
}

export function Hero() {
  return (
    <div className="space-y-5 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-zinc-600">
        <a
          href="https://github.com/moraxh/MisLineas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-emerald-700 transition-colors hover:text-emerald-900"
        >
          <Github className="h-3.5 w-3.5" />
          <span>Código abierto y auditable</span>
        </a>
      </div>

      <div className="space-y-3">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl">
          Consulta las líneas registradas a tu nombre.
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-2xl text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400"
        >
          <AnimatedCount target={TOTAL_QUERIES} /> consultas realizadas
        </motion.p>
        <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
          Ingresa tu CURP y revisa qué líneas aparecen vinculadas contigo. Si
          una operadora requiere revisión manual, te mostraremos su ruta
          oficial.
        </p>
      </div>
    </div>
  );
}
