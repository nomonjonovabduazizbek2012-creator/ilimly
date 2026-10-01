import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";

export default function StudyCourse() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/modules`),
      api.get(`/courses/${courseId}/progress`),
      api.get(`/courses/${courseId}/completed-lessons`),
    ])
      .then(([c, m, p, cl]) => {
        setCourse(c.data);
        setModules(m.data);
        setProgress(p.data);
        setCompletedIds(cl.data);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="container section">Yuklanmoqda...</div>;
  if (!course) return <div className="container section">Kurs topilmadi.</div>;

  const allLessons = [];
  modules.forEach((m, mi) => {
    m.lessons.forEach((l, li) => {
      allLessons.push({ ...l, moduleTitle: m.title, number: `${mi + 1}.${li + 1}` });
    });
  });

  const filtered = allLessons.filter((l) => l.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="container section">
      <Link to="/my-courses" className="back-link">
        ← Kurslarimga qaytish
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 28,
          marginTop: 14,
          marginBottom: 30,
        }}
      >
        <span style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700 }}>KURS DARSLARI</span>
        <h2 style={{ marginTop: 8, fontSize: "1.7rem" }}>{course.title}</h2>
        <p style={{ color: "var(--ink-dim)", marginTop: 6 }}>{course.description}</p>
        <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: "0.85rem",
            }}
          >
            Jami darslar: <b style={{ color: "var(--teal)" }}>{allLessons.length}</b>
          </div>
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: "0.85rem",
            }}
          >
            Holat: <b style={{ color: "var(--gold-soft)" }}>O'rganishga tayyor</b>
          </div>
          {course.group_link && (
            <a
              href={course.group_link}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: "10px 16px", fontSize: "0.85rem" }}
            >
              💬 Guruhga qo'shilish
            </a>
          )}
        </div>

        {progress.total > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
              <span style={{ color: "var(--ink-dim)" }}>Progress</span>
              <span style={{ color: "var(--teal)", fontWeight: 700 }}>
                {progress.completed}/{progress.total}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
                  background: "linear-gradient(90deg, var(--gold), var(--teal))",
                }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="section-head">
        <div>
          <span style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700 }}>O'QUV DASTURI</span>
          <h3 style={{ marginTop: 6, fontSize: "1.3rem" }}>Darslar ro'yxati</h3>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <input
          placeholder="Darslardan qidirish..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--ink-dim)" }}>Dars topilmadi.</p>
      ) : (
        filtered.map((l) => (
          <Link
            to={`/learn/${courseId}/lessons/${l.id}`}
            key={l.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: completedIds.includes(l.id) ? "rgba(52, 211, 153, 0.15)" : "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: completedIds.includes(l.id) ? "var(--teal)" : "var(--teal)",
                flexShrink: 0,
              }}
            >
              {completedIds.includes(l.id) ? "✓" : l.number.split(".")[1]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--ink-dim)", fontWeight: 700, letterSpacing: "0.03em" }}>
                DARS {l.number}
              </div>
              <b>{l.title}</b>
              <div style={{ color: "var(--ink-dim)", fontSize: "0.85rem", marginTop: 2 }}>{l.moduleTitle}</div>
            </div>
            <span className="btn btn-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
              Boshlash
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
