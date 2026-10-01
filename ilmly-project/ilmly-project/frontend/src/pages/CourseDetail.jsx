import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";

const THUMB_GRADIENTS = {
  python: "linear-gradient(135deg, #3d6b8f, #1b2f45)",
  react: "linear-gradient(135deg, #2a6f7a, #16232e)",
  flask: "linear-gradient(135deg, #4a4030, #241f18)",
  javascript: "linear-gradient(135deg, #7a6a2a, #29230e)",
  design: "linear-gradient(135deg, #7a3f5a, #2a1620)",
  fullstack: "linear-gradient(135deg, #4b3a7a, #1c1730)",
  course: "linear-gradient(135deg, #3d5a8f, #1b2545)",
};

const THUMB_ICONS = {
  python: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  react: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  flask: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
  javascript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  typescript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  design: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  fullstack: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  php: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
  csharp: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
};

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

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [owned, setOwned] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeLesson, setActiveLesson] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  function loadAll() {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
    api.get(`/courses/${id}/modules`).then((res) => setModules(res.data));
    api
      .get("/courses")
      .then((res) => {
        const found = res.data.find((c) => String(c.id) === String(id));
        if (found) setOwned(!!found.purchased);
      })
      .finally(() => setLoading(false));

    if (user) {
      api
        .get(`/my-request-status/${id}`)
        .then((res) => setRequestStatus(res.data.status))
        .catch(() => {});
    }
  }

  useEffect(loadAll, [id, user]);

  async function handleRequestEnroll() {
    if (!user) {
      navigate("/login");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/courses/${id}/request-enroll`);
      setRequestStatus("pending");
    } catch (err) {
      setError(errMsg(err, "Ariza yuborishda xatolik"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleLessonClick(lesson) {
    if (!owned) return;
    navigate(`/learn/${id}/lessons/${lesson.id}`);
  }

  if (loading) return <div className="container section">Yuklanmoqda...</div>;
  if (!course) return <div className="container section">Kurs topilmadi.</div>;

  const gradient = THUMB_GRADIENTS[course.image] || THUMB_GRADIENTS.course;
  const heroIcon = THUMB_ICONS[course.image];
  const embedUrl = activeLesson ? toEmbedUrl(activeLesson.video_url) : null;

  return (
    <div className="container">
      <div className="detail-wrap">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div
            className="detail-hero"
            style={
              course.photo
                ? { backgroundImage: `url(${course.photo})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: gradient }
            }
          >
            {!course.photo && heroIcon && (
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  width: 64,
                  height: 64,
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.94)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                  zIndex: 1,
                }}
              >
                <img src={heroIcon} alt={course.title} style={{ width: 38, height: 38 }} />
              </div>
            )}
            <span>{course.title}</span>
          </div>
          <span className="course-level">{course.level}</span>
          <h2 style={{ marginTop: 10, fontSize: "1.6rem" }}>{course.title}</h2>
          <p style={{ color: "var(--ink-dim)", marginTop: 14, lineHeight: 1.7 }}>{course.description}</p>

          <div style={{ marginTop: 24, color: "var(--ink-dim)", fontSize: "0.92rem" }}>
            {course.lessons_count} ta dars &middot; O'zingizga qulay tezlikda o'rganing
          </div>

          {modules.length > 0 && (
            <div style={{ marginTop: 34 }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: 16 }}>Kurs dasturi</h3>
              {modules.map((m, mi) => (
                <div className="module-card" key={m.id}>
                  <div className="module-card-head">
                    <h3>
                      {mi + 1}. {m.title}
                    </h3>
                    <span style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>
                      {m.lessons.length} dars
                    </span>
                  </div>
                  <div className="lesson-list">
                    {m.lessons.length === 0 ? (
                      <div className="lesson-empty">Bu modulda hali dars yo'q</div>
                    ) : (
                      m.lessons.map((l, li) => (
                        <div
                          className="lesson-row"
                          key={l.id}
                          onClick={() => handleLessonClick(l)}
                          style={{ cursor: owned ? "pointer" : "default" }}
                        >
                          <div className="lesson-thumb">
                            {l.image ? <img src={l.image} alt={l.title} /> : owned ? "▶️" : "🔒"}
                          </div>
                          <div className="lesson-info">
                            <b>
                              {mi + 1}.{li + 1} {l.title}
                            </b>
                            <span>{owned ? "Ko'rish uchun bosing" : "Yozilgandan keyin ochiladi"}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="detail-side"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span className="price">{Number(course.price).toLocaleString("uz-UZ")} so'm</span>

          {error && <div className="form-error">{error}</div>}

          {owned ? (
            <div className="owned-box">✓ Siz bu kursga yozilgansiz</div>
          ) : requestStatus === "pending" ? (
            <div
              className="owned-box"
              style={{
                background: "rgba(217, 164, 65, 0.1)",
                borderColor: "rgba(217, 164, 65, 0.3)",
                color: "var(--gold-soft)",
              }}
            >
              ⏳ Arizangiz yuborildi, admin ko'rib chiqmoqda
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={handleRequestEnroll} disabled={submitting}>
              {submitting ? "Yuborilmoqda..." : "Darsga yozilish uchun ariza yuborish"}
            </button>
          )}

          {!user && (
            <p style={{ marginTop: 14, fontSize: "0.85rem", color: "var(--ink-dim)", textAlign: "center" }}>
              Ariza yuborish uchun{" "}
              <Link to="/login" style={{ color: "var(--gold-soft)" }}>
                tizimga kiring
              </Link>
            </p>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {activeLesson && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLesson(null)}
          >
            <motion.div
              className="modal"
              style={{ maxWidth: 720 }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{activeLesson.title}</h3>
              {embedUrl ? (
                <div
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#000",
                  }}
                >
                  <iframe
                    src={embedUrl}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              ) : activeLesson.image ? (
                <img src={activeLesson.image} alt={activeLesson.title} style={{ width: "100%", borderRadius: 10 }} />
              ) : activeLesson.video_url ? (
                <a href={activeLesson.video_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
                  Videoni ochish
                </a>
              ) : (
                <p style={{ color: "var(--ink-dim)" }}>Bu dars uchun material qo'shilmagan.</p>
              )}
              {activeLesson.description && (
                <p style={{ color: "var(--ink-dim)", marginTop: 16, lineHeight: 1.6 }}>{activeLesson.description}</p>
              )}
              <button
                className="btn btn-outline btn-block"
                style={{ marginTop: 18 }}
                onClick={() => setActiveLesson(null)}
              >
                Yopish
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
