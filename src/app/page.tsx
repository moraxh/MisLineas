import { CreatorsCredit } from "@/components/home/CreatorsCredit";
import { Hero } from "@/components/home/Hero";
import { InformationCenter } from "@/components/home/InformationCenter";
import { Lookup } from "@/components/home/Lookup";
import { OperatorsSection } from "@/components/home/OperatorsSection";
import { ServiceAlerts } from "@/components/home/ServiceAlerts";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { TOTAL_QUERIES } from "@/lib/data/content";
import styles from "./page.module.css";

export default function MisLineas() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <ServiceAlerts kind="return" />
      <main className={styles.heroSection}>
        <div className={styles.heroContent}>
          <Hero />
        </div>
        <p className={styles.milestone}>
          Más de {TOTAL_QUERIES.toLocaleString("en-US")} consultas realizadas
        </p>
        <Lookup />
        <CreatorsCredit />
        <div className={styles.operatorsSection}>
          <OperatorsSection />
        </div>
        <div className={styles.informationSection}>
          <InformationCenter />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
