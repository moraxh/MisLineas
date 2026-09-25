import {
  ArrowUpRight,
  Database,
  Github,
  ListChecks,
  Search,
} from "lucide-react";
import styles from "./WhySection.module.css";

const steps = [
  {
    icon: Search,
    title: "Ingresas tu CURP",
    description: "Inicia la consulta desde un solo formulario.",
  },
  {
    icon: Database,
    title: "Consultamos cada proveedor",
    description:
      "Nos conectamos a cada plataforma y hacemos la solicitud por ti.",
  },
  {
    icon: ListChecks,
    title: "Revisas los resultados",
    description:
      "Distingue coincidencias, pendientes y respuestas sin coincidencias.",
  },
];

export function WhySection() {
  return (
    <div className={styles.content}>
      <ol className={styles.steps} aria-label="Pasos de la consulta">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li className={styles.step} key={title}>
            <span className={styles.icon} aria-hidden="true">
              <Icon size={23} strokeWidth={1.8} />
            </span>
            <h3>
              <span className={styles.stepNumber}>{index + 1}.</span> {title}
            </h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <p className={styles.sourceNote}>
        ¿Tienes dudas?{" "}
        <a
          href="https://github.com/moraxh/MisLineas"
          target="_blank"
          rel="noopener noreferrer"
        >
          El código es totalmente abierto y puedes auditarlo.
          <Github size={15} aria-hidden="true" />
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
