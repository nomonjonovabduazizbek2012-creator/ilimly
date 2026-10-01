import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

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

export default function CourseCard({ course, index = 0 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const gradient = THUMB_GRADIENTS[course.image] || THUMB_GRADIENTS.course;
  const icon = THUMB_ICONS[course.image];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link to={`/courses/${course.id}`}>
        <motion.div
          ref={ref}
          className="course-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY }}
        >
          <div className="course-thumb" style={{ background: gradient }}>
            {course.photo ? (
              <img src={course.photo} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : icon ? (
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
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <img src={icon} alt={course.title} style={{ width: 38, height: 38 }} />
              </div>
            ) : (
              course.title.slice(0, 1)
            )}
          </div>
          <div className="course-body">
            <span className="course-level">{course.level}</span>
            <h3>{course.title}</h3>
            <p className="desc">{course.description}</p>
            <div className="course-meta">
              <span>{course.lessons_count} dars</span>
              {course.purchased ? <span className="badge-owned">✓ Sotib olingan</span> : null}
            </div>
            <div className="course-footer">
              <span className="price">{Number(course.price).toLocaleString("uz-UZ")} so'm</span>
              <span className="btn btn-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                Batafsil
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
