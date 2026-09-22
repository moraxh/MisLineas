"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "curp_history";
const MAX_HISTORY = 5;

export function useCurpHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const saveToHistory = (newCurp: string) => {
    setHistory((prev) => {
      const updated = [newCurp, ...prev.filter((c) => c !== newCurp)].slice(
        0,
        MAX_HISTORY,
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return { history, saveToHistory, clearHistory };
}
