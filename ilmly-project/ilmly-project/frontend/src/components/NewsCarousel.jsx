import React, { useEffect, useRef, useState } from "react";

export default function NewsCarousel({ news }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (news.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % news.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [news.length, paused]);

  if (news.length === 0) return null;
  const current = news[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      {current.image && (
        <div style={{ width: "100%", background: "#000", overflow: "hidden" }}>
          <img
            src={current.image}
            alt={current.title}
            style={{ width: "100%", maxHeight: 340, objectFit: "contain", display: "block", margin: "0 auto" }}
          />
        </div>
      )}
      <div style={{ padding: 24 }}>
        <span style={{ color: "var(--ink-dim)", fontSize: "0.78rem" }}>{current.created_at?.slice(0, 10)}</span>
        <h3 style={{ marginTop: 8, marginBottom: 10 }}>{current.title}</h3>
        <p style={{ color: "var(--ink-dim)", fontSize: "0.94rem", lineHeight: 1.7 }}>{current.content}</p>
      </div>

      {news.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingBottom: 18 }}>
          {news.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setIndex(i)}
              aria-label={`Yangilik ${i + 1}`}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: i === index ? "var(--teal)" : "var(--border)",
                transition: "width 0.25s ease, background 0.25s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
