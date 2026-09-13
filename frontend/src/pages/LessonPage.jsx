import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";

function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/modules`)])
      .then(([c, m]) => {
        setCourse(c.data);
        setModules(m.data);
      })
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  if (loading) return <div className="container section">Yuklanmoqda...</div>;

  let lesson = null;
  for (const m of modules) {
    const found = m.lessons.find((l) => String(l.id) === String(lessonId));
    if (found) {
      lesson = found;
      break;
    }
  }

  if (!lesson) return <div className="container section">Dars topilmadi.</div>;

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await api.post(`/lessons/${lessonId}/complete`);
      if (res.data.xp_gained > 0) {
        alert(`✅ Dars tugatildi! +${res.data.xp_gained} XP qo'shildi. Jami: ${res.data.total_xp} XP (Level ${res.data.level})`);
      }
      navigate(`/learn/${courseId}`);
    } catch {
      setCompleting(false);
    }
  }

  const embedUrl = toEmbedUrl(lesson.video_url);

  return (
    <div className="container section">
      <Link to={`/learn/${courseId}`} className="back-link">
        ← Orqaga
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 26,
          marginTop: 14,
          marginBottom: 24,
        }}
      >
        <span style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700 }}>DARS</span>
        <h2 style={{ marginTop: 8, fontSize: "1.7rem" }}>{lesson.title}</h2>
      </motion.div>

      <div className="detail-wrap" style={{ paddingTop: 0 }}>
        <div>
          {embedUrl ? (
            <div
              style={{
                position: "relative",
                paddingTop: "56.25%",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                background: "#000",
                border: "1px solid var(--border)",
              }}
            >
              <iframe
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          ) : lesson.image ? (
            <img
              src={lesson.image}
              alt={lesson.title}
              style={{ width: "100%", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
            />
          ) : lesson.video_url ? (
            <a href={lesson.video_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
              Videoni ochish
            </a>
          ) : (
            <p style={{ color: "var(--ink-dim)" }}>Bu dars uchun material qo'shilmagan.</p>
          )}

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 22,
              marginTop: 20,
            }}
          >
            <h4 style={{ marginBottom: 10 }}>Dars haqida</h4>
            <p style={{ color: "var(--ink-dim)", lineHeight: 1.7 }}>
              {lesson.description || "Bu dars uchun qo'shimcha tavsif kiritilmagan."}
            </p>
          </div>

          {lesson.content && (
            <div
              style={{
                background: "#0d1210",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 22,
                marginTop: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: "1.1rem" }}>📝</span>
                <h4 style={{ margin: 0 }}>Qo'shimcha materiallar</h4>
              </div>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                  fontSize: "0.88rem",
                  color: "var(--ink)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {lesson.content}
              </pre>
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 20 }}
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? "Belgilanmoqda..." : "✅ Darsni tugatish"}
          </button>
        </div>

        <div className="detail-side">
          <h4 style={{ marginBottom: 16 }}>Dars ma'lumotlari</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--ink-dim)" }}>Video</span>
              <span style={{ color: lesson.video_url ? "var(--teal)" : "var(--ink-dim)" }}>
                {lesson.video_url ? "Mavjud" : "Yo'q"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--ink-dim)" }}>Rasm</span>
              <span style={{ color: lesson.image ? "var(--teal)" : "var(--ink-dim)" }}>
                {lesson.image ? "Mavjud" : "Yo'q"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--ink-dim)" }}>Kurs</span>
              <span>{course.title}</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              background: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
            }}
          >
            <b style={{ fontSize: "0.85rem", color: "var(--teal)" }}>💡 O'qish uchun maslahat</b>
            <ul style={{ marginTop: 8, paddingLeft: 18, color: "var(--ink-dim)", fontSize: "0.85rem", lineHeight: 1.7 }}>
              <li>Videoni diqqat bilan tomosha qiling</li>
              <li>Muhim joylarni yozib boring</li>
              <li>Mavzuni mustaqil mashq qiling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
