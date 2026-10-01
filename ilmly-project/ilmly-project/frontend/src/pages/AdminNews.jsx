import React, { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", image: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadNews() {
    setLoading(true);
    api.get("/news").then((res) => setNews(res.data)).finally(() => setLoading(false));
  }

  useEffect(loadNews, []);

  function openAdd() {
    setForm({ title: "", content: "", image: "" });
    setError("");
    setModalOpen(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/admin/news", form);
      setModalOpen(false);
      loadNews();
    } catch (err) {
      setError(errMsg(err, "Qo'shishda xatolik"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bu yangilikni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/admin/news/${id}`);
      loadNews();
    } catch {
      alert("O'chirishda xatolik");
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ fontSize: "1.3rem" }}>Yangiliklar</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + Yangilik qo'shish
        </button>
      </div>

      <div className="admin-panel">
        {loading ? (
          <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
        ) : news.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>Hali yangilik yo'q.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n) => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.created_at?.slice(0, 10)}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(n.id)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yangi yangilik qo'shish</h3>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Sarlavha</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="field">
                <label>Matn</label>
                <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="field">
                <label>Rasm (ixtiyoriy)</label>
                <label className="file-input-label">
                  {form.image ? "Rasm tanlandi ✓" : "Rasm yuklash uchun bosing"}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-block" onClick={() => setModalOpen(false)}>
                  Bekor qilish
                </button>
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? "Saqlanmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
