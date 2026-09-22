"use client";

import { useEffect, useState } from "react";
import { AccordionItem } from "@/components/home/AccordionItem";
import { ArcoSection } from "@/components/home/ArcoSection";
import { CommonQuestions } from "@/components/home/CommonQuestions";
import { SecuritySection } from "@/components/home/SecuritySection";
import { SponsorSection } from "@/components/home/SponsorSection";
import { WhySection } from "@/components/home/WhySection";
import styles from "./InformationCenter.module.css";

const informationIds = [
  "como-funciona",
  "preguntas-frecuentes",
  "seguridad",
  "arco",
  "velar",
];

export function InformationCenter() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    const syncWithHash = () => {
      const targetId = window.location.hash.slice(1);
      if (informationIds.includes(targetId)) {
        setOpenItem(targetId);
      }
    };

    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);

    return () => {
      window.removeEventListener("hashchange", syncWithHash);
    };
  }, []);

  const toggleItem = (id: string) => {
    setOpenItem((current) => (current === id ? null : id));
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="information-center-heading"
    >
      <h2 id="information-center-heading" className={styles.heading}>
        Centro de Información
      </h2>

      <div className={styles.items}>
        <AccordionItem
          id="como-funciona"
          title="Cómo funciona"
          isOpen={openItem === "como-funciona"}
          onToggle={() => toggleItem("como-funciona")}
        >
          <WhySection />
        </AccordionItem>
        <AccordionItem
          id="preguntas-frecuentes"
          title="Preguntas frecuentes"
          isOpen={openItem === "preguntas-frecuentes"}
          onToggle={() => toggleItem("preguntas-frecuentes")}
        >
          <CommonQuestions />
        </AccordionItem>
        <AccordionItem
          id="seguridad"
          title="Privacidad y seguridad"
          isOpen={openItem === "seguridad"}
          onToggle={() => toggleItem("seguridad")}
        >
          <SecuritySection />
        </AccordionItem>
        <AccordionItem
          id="arco"
          title="Derechos ARCO y reportes"
          isOpen={openItem === "arco"}
          onToggle={() => toggleItem("arco")}
        >
          <ArcoSection />
        </AccordionItem>
        <AccordionItem
          id="velar"
          title="¿Quiénes son Velar Technologies?"
          isOpen={openItem === "velar"}
          onToggle={() => toggleItem("velar")}
        >
          <SponsorSection />
        </AccordionItem>
      </div>
    </section>
  );
}
