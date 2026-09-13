import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { errMsg } from "../api";

const emptyForm = { title: "", description: "", price: "", image: "course", lessons_count: "", level: "Boshlang'ich", group_link: "" };

export default function Admin() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({ user_id: "", course_id: "", title: "", file: "" });
  const [certError, setCertError] = useState("");
  const [certSaving, setCertSaving] = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get("/courses"),
      api.get("/admin/stats"),
      api.get("/admin/requests"),
      api.get("/admin/users"),
      api.get("/admin/certificates"),
    ])
      .then(([c, s, r, u, cert]) => {
        setCourses(c.data);
        setStats(s.data);
        setRequests(r.data);
        setUsers(u.data);
        setCertificates(cert.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  function openCertModal() {
    setCertForm({ user_id: "", course_id: "", title: "", file: "" });
    setCertError("");
    setCertModalOpen(true);
  }

  async function handleIssueCertificate(e) {
    e.preventDefault();
    setCertError("");
    setCertSaving(true);
    try {
      await api.post("/admin/certificates", certForm);
      setCertModalOpen(false);
      loadData();
    } catch (err) {
      setCertError(errMsg(err, "Sertifikat berishda xatolik"));
    } finally {
      setCertSaving(false);
    }
  }

  async function handleApprove(reqId) {
    try {
      await api.post(`/admin/requests/${reqId}/approve`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "Tasdiqlashda xatolik"));
    }
  }

  async function handleReject(reqId) {
    if (!confirm("Bu arizani rad etmoqchimisiz?")) return;
    try {
      await api.post(`/admin/requests/${reqId}/reject`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "Rad etishda xatolik"));
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(course) {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description,
      price: course.price,
      image: course.image,
      lessons_count: course.lessons_count,
      level: course.level,
      group_link: course.group_link || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleDelete(course) {
    if (!confirm(`"${course.title}" kursini o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "O'chirishda xatolik"));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        lessons_count: parseInt(form.lessons_count || 0, 10),
      };
      if (editing) {
        await api.put(`/courses/${editing.id}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(errMsg(err, "Saqlashda xatolik"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-mini-stats">
        {stats && (
          <>
            <div className="admin-mini-stat">
              <b>{stats.courses}</b>
              <span>Kurslar soni</span>
            </div>
            <div className="admin-mini-stat">
              <b>{stats.purchases}</b>
              <span>Sotib olishlar</span>
            </div>
            <div className="admin-mini-stat">
              <b style={{ color: stats.pending_requests > 0 ? "var(--danger)" : undefined }}>
                {stats.pending_requests}
              </b>
              <span>Kutilayotgan arizalar</span>
            </div>
            <div className="admin-mini-stat">
              <b>{Number(stats.revenue).toLocaleString("uz-UZ")}</b>
              <span>Umumiy daromad (so'm)</span>
            </div>
          </>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className={activeTab === "courses" ? "btn btn-primary" : "btn btn-outline"}
              onClick={() => setActiveTab("courses")}
            >
              Kurslar
            </button>
            <button
              className={activeTab === "requests" ? "btn btn-primary" : "btn btn-outline"}
              onClick={() => setActiveTab("requests")}
              style={{ position: "relative" }}
            >
              Arizalar {requests.length > 0 && `(${requests.length})`}
            </button>
            <button
              className={activeTab === "certificates" ? "btn btn-primary" : "btn btn-outline"}
              onClick={() => setActiveTab("certificates")}
            >
              Sertifikatlar
            </button>
          </div>
          {activeTab === "courses" && (
            <button className="btn btn-primary" onClick={openAdd}>
              + Yangi kurs qo'shish
            </button>
          )}
          {activeTab === "certificates" && (
            <button className="btn btn-primary" onClick={openCertModal}>
              + Sertifikat berish
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
        ) : activeTab === "courses" ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Daraja</th>
                <th>Narx</th>
                <th>Darslar</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.level}</td>
                  <td>{Number(c.price).toLocaleString("uz-UZ")} so'm</td>
                  <td>{c.lessons_count}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/admin/courses/${c.id}/modules`} className="btn btn-outline">
                        Darslar
                      </Link>
                      <button className="btn btn-outline" onClick={() => openEdit(c)}>
                        Tahrirlash
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(c)}>
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === "requests" ? (
          requests.length === 0 ? (
            <p style={{ color: "var(--ink-dim)" }}>Hozircha kutilayotgan ariza yo'q.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foydalanuvchi</th>
                  <th>Email</th>
                  <th>Kurs</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user_name}</td>
                    <td>{r.user_email}</td>
                    <td>{r.course_title}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-primary" onClick={() => handleApprove(r.id)}>
                          Qo'shish
                        </button>
                        <button className="btn btn-danger" onClick={() => handleReject(r.id)}>
                          Rad etish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === "certificates" ? (
          certificates.length === 0 ? (
            <p style={{ color: "var(--ink-dim)" }}>Hali sertifikat berilmagan.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foydalanuvchi</th>
                  <th>Kurs</th>
                  <th>Sertifikat</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id}>
                    <td>{c.user_name}</td>
                    <td>{c.course_title}</td>
                    <td>{c.title}</td>
                    <td>{c.issued_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{editing ? "Kursni tahrirlash" : "Yangi kurs qo'shish"}</h3>
              {error && <div className="form-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Kurs nomi</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Tavsif</label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Narx (so'm)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Darslar soni</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lessons_count}
                    onChange={(e) => setForm({ ...form, lessons_count: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Daraja</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    <option>Boshlang'ich</option>
                    <option>O'rta</option>
                    <option>Yuqori</option>
                  </select>
                </div>
                <div className="field">
                  <label>Rang mavzusi</label>
                  <select value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}>
                    <option value="python">Python (ko'k)</option>
                    <option value="react">React (yashil-ko'k)</option>
                    <option value="flask">Flask (jigarrang)</option>
                    <option value="javascript">JavaScript (sariq)</option>
                    <option value="design">Dizayn (pushti)</option>
                    <option value="fullstack">Full-stack (binafsha)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Guruh chat havolasi (Telegram/Zoom, ixtiyoriy)</label>
                  <input
                    value={form.group_link}
                    onChange={(e) => setForm({ ...form, group_link: e.target.value })}
                    placeholder="https://t.me/..."
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setModalOpen(false)}
                  >
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {certModalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCertModalOpen(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Sertifikat berish</h3>
              {certError && <div className="form-error">{certError}</div>}
              <form onSubmit={handleIssueCertificate}>
                <div className="field">
                  <label>Foydalanuvchi</label>
                  <select
                    required
                    value={certForm.user_id}
                    onChange={(e) => setCertForm({ ...certForm, user_id: e.target.value })}
                  >
                    <option value="">Tanlang...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Kurs</label>
                  <select
                    required
                    value={certForm.course_id}
                    onChange={(e) => setCertForm({ ...certForm, course_id: e.target.value })}
                  >
                    <option value="">Tanlang...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Sertifikat nomi</label>
                  <input
                    required
                    value={certForm.title}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    placeholder="Masalan: Python asoslari bo'yicha sertifikat"
                  />
                </div>
                <div className="field">
                  <label>Sertifikat fayli (rasm yoki PDF, ixtiyoriy)</label>
                  <label className="file-input-label">
                    {certForm.file ? "Fayl tanlandi ✓" : "Fayl yuklash uchun bosing"}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setCertForm((f) => ({ ...f, file: reader.result }));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setCertModalOpen(false)}
                  >
                    Bekor qilish
                  </button>
                  <button className="btn btn-primary btn-block" disabled={certSaving}>
                    {certSaving ? "Saqlanmoqda..." : "Berish"}
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
