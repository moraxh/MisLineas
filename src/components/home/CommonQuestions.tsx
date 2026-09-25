import { ArrowUpRight } from "lucide-react";
import styles from "./CommonQuestions.module.css";

const questions = [
  {
    question: "¿MisLíneas es una plataforma oficial?",
    answer:
      "No. MisLíneas es un proyecto ciudadano independiente. No pertenece al Gobierno de México ni a una operadora. Reunimos respuestas de los portales disponibles para facilitar la consulta; la confirmación final corresponde a cada operadora.",
  },
  {
    question: "¿Es seguro ingresar mi CURP?",
    answer:
      "Usamos la CURP únicamente para realizar la consulta. No creamos cuentas ni perfiles con ella, y no la conservamos en nuestros servidores. El historial del formulario se queda en tu navegador.",
    href: "#seguridad",
    linkLabel: "Ver cómo protegemos tu información",
  },
  {
    question: "¿Qué hago si aparece una línea que no reconozco?",
    answer:
      "Contacta directamente a la operadora para pedir la aclaración o desvinculación y guarda el folio. Si la plataforma presenta una falla, puedes reportarla ante la CRT.",
    href: "#arco",
    linkLabel: "Conocer tus derechos ARCO",
  },
  {
    question: "¿Por qué una línea puede no aparecer?",
    answer:
      "Algunas operadoras bloquean temporalmente nuestras solicitudes o cambian sus portales. También pueden ocurrir falsos positivos o falsos negativos. Trabajamos activamente para mantener la plataforma y sus integraciones actualizadas, pero los resultados deben confirmarse con la operadora.",
  },
];

export function CommonQuestions() {
  return (
    <div className={styles.content}>
      <p className={styles.intro}>
        Antes de consultar, esto es lo más importante que debes saber.
      </p>
      <dl className={styles.questions}>
        {questions.map(({ question, answer, href, linkLabel }) => (
          <div className={styles.question} key={question}>
            <dt>{question}</dt>
            <dd>
              <p>{answer}</p>
              {href && linkLabel ? (
                <a className={styles.link} href={href}>
                  {linkLabel}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
