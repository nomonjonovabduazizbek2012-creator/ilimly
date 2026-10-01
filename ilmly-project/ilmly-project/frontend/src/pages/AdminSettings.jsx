import React from "react";
import { useTheme } from "../ThemeContext";

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ fontSize: "1.3rem" }}>Sozlamalar</h2>
      </div>
      <div className="admin-panel">
        <h4 style={{ marginBottom: 14 }}>Ko'rinish</h4>
        <p style={{ marginBottom: 16 }}>Saytning rang rejimini tanlang.</p>
        <div style={{ display: "flex", gap: 14 }}>
          <button
            onClick={() => setTheme("dark")}
            className={theme === "dark" ? "btn btn-primary" : "btn btn-outline"}
            style={{ flexDirection: "column", height: 90, width: 110, gap: 8 }}
          >
            <span style={{ fontSize: "1.6rem" }}>🏠</span>
            Qorong'i
          </button>
          <button
            onClick={() => setTheme("light")}
            className={theme === "light" ? "btn btn-primary" : "btn btn-outline"}
            style={{ flexDirection: "column", height: 90, width: 110, gap: 8 }}
          >
            <span style={{ fontSize: "1.6rem" }}>☀️</span>
            Yorug'
          </button>
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: 20 }}>
        <p style={{ color: "var(--ink-dim)" }}>
          Boshqa platforma sozlamalari (nom, logo, aloqa ma'lumotlari) hozircha ishlab chiqilmoqda.
        </p>
      </div>
    </div>
  );
}
