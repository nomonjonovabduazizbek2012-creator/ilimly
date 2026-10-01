import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { errMsg } from "../api";

const emptyLessonForm = { title: "", video_url: "", image: "", description: "", content: "" };

export default function AdminModules() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleImage, setModuleImage] = useState("");
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleError, setModuleError] = useState("");

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [lessonSource, setLessonSource] = useState("link"); // 'link' | 'image'
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonError, setLessonError] = useState("");

  function loadData() {
    setLoading(true);
    Promise.all([api.get(`/courses/${id}`), api.get(`/courses/${id}/modules`)])
      .then(([c, m]) => {
        setCourse(c.data);
        setModules(m.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, [id]);

  function openAddModule() {
    setModuleTitle("");
    setModuleImage("");
    setModuleError("");
    setModuleModalOpen(true);
  }

  async function handleAddModule(e) {
    e.preventDefault();
    setModuleError("");
    setModuleSaving(true);
    try {
      await api.post(`/courses/${id}/modules`, { title: moduleTitle, image: moduleImage });
      setModuleModalOpen(false);
      loadData();
    } catch (err) {
      setModuleError(errMsg(err, "Modul qo'shishda xatolik"));
    } finally {
      setModuleSaving(false);
    }
  }

  async function handleDeleteModule(module) {
    if (!confirm(`"${module.title}" modulini o'chirmoqchimisiz? Ichidagi barcha darslar ham o'chadi.`)) return;
    try {
      await api.delete(`/modules/${module.id}`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "O'chirishda xatolik"));
    }
  }

  function openAddLesson(moduleId) {
    setActiveModuleId(moduleId);
    setLessonForm(emptyLessonForm);
    setLessonSource("link");
    setLessonError("");
    setLessonModalOpen(true);
  }

  async function handleDeleteLesson(lesson) {
    if (!confirm(`"${lesson.title}" darsini o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/lessons/${lesson.id}`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "O'chirishda xatolik"));
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLessonForm((f) => ({ ...f, image: reader.result, video_url: "" }));
    };
    reader.readAsDataURL(file);
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    setLessonError("");

    if (lessonSource === "link" && !lessonForm.video_url.trim()) {
      setLessonError("Video havolasini kiriting");
      return;
    }
    if (lessonSource === "image" && !lessonForm.image) {
      setLessonError("Rasm tanlang");
      return;
    }

    setLessonSaving(true);
    try {
      await api.post(`/modules/${activeModuleId}/lessons`, {
        title: lessonForm.title,
        description: lessonForm.description,
        content: lessonForm.content,
        video_url: lessonSource === "link" ? lessonForm.video_url : "",
        image: lessonSource === "image" ? lessonForm.image : "",
      });
      setLessonModalOpen(false);
      loadData();
    } catch (err) {
      setLessonError(errMsg(err, "Dars qo'shishda xatolik"));
    } finally {
      setLessonSaving(false);
    }
  }

  return (
    <div className="container section">
      <Link to="/admin/manage" className="back-link">
        ← Admin panelga qaytish
      </Link>

      <div className="modules-header">
        <div>
          <h2>{loading ? "Yuklanmoqda..." : `${course?.title} — Darslar`}</h2>
          <p style={{ color: "var(--ink-dim)", marginTop: 6 }}>
            Modullarni va ularning ichidagi darslarni boshqaring.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModule}>
          + Modul qo'shish
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
      ) : modules.length === 0 ? (
        <p style={{ color: "var(--ink-dim)" }}>
          Hali modul yo'q. Yuqoridagi tugma orqali birinchi modulni qo'shing.
        </p>
      ) : (
        modules.map((m) => (
          <div className="module-card" key={m.id}>
            <div className="module-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.image && (
                  <img src={m.image} alt={m.title} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                )}
                <h3>{m.title}</h3>
              </div>
              <div className="module-actions">
                <button className="btn btn-outline" onClick={() => openAddLesson(m.id)}>
                  + Dars qo'shish
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteModule(m)}>
                  O'chirish
                </button>
              </div>
            </div>
            <div className="lesson-list">
              {m.lessons.length === 0 ? (
                <div className="lesson-empty">Bu modulda hali dars yo'q</div>
              ) : (
                m.lessons.map((l) => (
                  <div className="lesson-row" key={l.id}>
                    <div className="lesson-thumb">
                      {l.image ? <img src={l.image} alt={l.title} /> : "🎬"}
                    </div>
                    <div className="lesson-info">
                      <b>{l.title}</b>
                      <span>{l.video_url ? "Video havola" : "Rasm bilan dars"}</span>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleDeleteLesson(l)}>
                      O'chirish
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}

      {/* Modul qo'shish modali */}
      <AnimatePresence>
        {moduleModalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModuleModalOpen(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Yangi modul qo'shish</h3>
              {moduleError && <div className="form-error">{moduleError}</div>}
              <form onSubmit={handleAddModule}>
                <div className="field">
                  <label>Modul nomi</label>
                  <input
                    required
                    autoFocus
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Masalan: 1-modul — Kirish"
                  />
                </div>
                <div className="field">
                  <label>Modul rasmi (ixtiyoriy)</label>
                  <label className="file-input-label">
                    {moduleImage ? "Rasm tanlandi ✓" : "Rasm yuklash uchun bosing"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setModuleImage(reader.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {moduleImage && (
                    <div className="image-preview">
                      <img src={moduleImage} alt="preview" />
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setModuleModalOpen(false)}
                  >
                    Bekor qilish
                  </button>
                  <button className="btn btn-primary btn-block" disabled={moduleSaving}>
                    {moduleSaving ? "Saqlanmoqda..." : "Qo'shish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dars qo'shish modali */}
      <AnimatePresence>
        {lessonModalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLessonModalOpen(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Yangi dars qo'shish</h3>
              {lessonError && <div className="form-error">{lessonError}</div>}
              <form onSubmit={handleAddLesson}>
                <div className="field">
                  <label>Dars nomi</label>
                  <input
                    required
                    autoFocus
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Masalan: 1-dars — Salom, Python!"
                  />
                </div>

                <div className="field">
                  <label>Dars materiali</label>
                  <div className="source-toggle">
                    <button
                      type="button"
                      className={lessonSource === "link" ? "active" : ""}
                      onClick={() => setLessonSource("link")}
                    >
                      🔗 Video havola
                    </button>
                    <button
                      type="button"
                      className={lessonSource === "image" ? "active" : ""}
                      onClick={() => setLessonSource("image")}
                    >
                      🖼️ Galereyadan rasm
                    </button>
                  </div>

                  {lessonSource === "link" ? (
                    <input
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  ) : (
                    <>
                      <label className="file-input-label">
                        Rasm tanlash uchun bosing
                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                      </label>
                      {lessonForm.image && (
                        <div className="image-preview">
                          <img src={lessonForm.image} alt="preview" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="field">
                  <label>Tavsif (ixtiyoriy)</label>
                  <textarea
                    rows={2}
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Qo'shimcha matn / kod (Notion uslubida, ixtiyoriy)</label>
                  <textarea
                    rows={5}
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder={"Masalan:\nprint('Salom, Python!')\n\nyoki darsga oid eslatmalar, havolalar..."}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setLessonModalOpen(false)}
                  >
                    Bekor qilish
                  </button>
                  <button className="btn btn-primary btn-block" disabled={lessonSaving}>
                    {lessonSaving ? "Saqlanmoqda..." : "Qo'shish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
