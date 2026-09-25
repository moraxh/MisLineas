"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useId } from "react";
import styles from "./AccordionItem.module.css";

interface AccordionItemProps {
  id: string;
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function AccordionItem({
  id,
  title,
  children,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  const uniqueId = useId();
  const triggerId = `information-trigger-${uniqueId}`;
  const panelId = `information-panel-${uniqueId}`;

  return (
    <div id={id} className={styles.item}>
      <button
        id={triggerId}
        className={styles.trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{title}</span>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          size={20}
          aria-hidden="true"
        />
      </button>

      <section
        id={panelId}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className={styles.panelInner}>
          <div className={styles.panelContent}>{children}</div>
        </div>
      </section>
    </div>
  );
}
