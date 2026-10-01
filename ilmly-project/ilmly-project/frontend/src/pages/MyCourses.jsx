import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

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
  design: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  fullstack: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
};

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/my-courses")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <h2>Mening kurslarim</h2>
          <p>Siz yozilgan barcha kurslarni shu yerda ko'rishingiz va o'qishni davom ettirishingiz mumkin.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
      ) : courses.length === 0 ? (
        <p style={{ color: "var(--ink-dim)" }}>
          Hali hech qanday kursga yozilmagansiz. Bosh sahifadan kurs tanlab, ariza yuboring.
        </p>
      ) : (
        <div className="course-grid">
          {courses.map((c) => {
            const gradient = THUMB_GRADIENTS[c.image] || THUMB_GRADIENTS.course;
            const icon = THUMB_ICONS[c.image];
            return (
              <div className="course-card" key={c.id} style={{ cursor: "default" }}>
                <div className="course-thumb" style={{ background: gradient, position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "rgba(0,0,0,0.55)",
                      color: "var(--teal)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      zIndex: 2,
                    }}
                  >
                    ● Kursga yozilgan
                  </span>
                  {icon ? (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.94)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      }}
                    >
                      <img src={icon} alt={c.title} style={{ width: 38, height: 38 }} />
                    </div>
                  ) : (
                    c.title.slice(0, 1)
                  )}
                </div>
                <div className="course-body">
                  <span className="course-level">{c.level}</span>
                  <h3>{c.title}</h3>
                  <p className="desc">{c.description}</p>
                  <div className="course-footer">
                    <span style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>
                      {c.lessons_count} ta dars
                    </span>
                    <Link to={`/learn/${c.id}`} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: "0.85rem" }}>
                      O'qishni boshlash
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
