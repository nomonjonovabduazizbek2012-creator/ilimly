import React from "react";

export default function AdminSettings() {
  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ fontSize: "1.3rem" }}>Sozlamalar</h2>
      </div>
      <div className="admin-panel">
        <p style={{ color: "var(--ink-dim)" }}>
          Platforma sozlamalari shu yerda bo'ladi (nom, logo, aloqa ma'lumotlari va h.k.).
          Hozircha bu bo'lim ishlab chiqilmoqda.
        </p>
      </div>
    </div>
  );
}
