import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();

  function loadComments() {
    api
      .get("/comments")
      .then((res) => setComments(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(loadComments, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setPosting(true);
    try {
      await api.post("/comments", { content: text.trim() });
      setText("");
      loadComments();
    } catch (err) {
      setError(errMsg(err, "Fikr yuborishda xatolik"));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bu fikrni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/comments/${id}`);
      loadComments();
    } catch {
      alert("O'chirishda xatolik");
    }
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr.replace(" ", "T") + "Z").getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "hozirgina";
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    return `${Math.floor(hours / 24)} kun oldin`;
  }

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <div className="section-head">
        <div>
          <h2>Fikrlar</h2>
          <p>Savol, taklif yoki fikringizni shu yerga yozing — admin ko'radi.</p>
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <textarea
              rows={3}
              placeholder="Fikringizni yozing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" disabled={posting}>
            {posting ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </form>
      ) : (
        <p style={{ color: "var(--ink-dim)", marginBottom: 24 }}>
          Fikr qoldirish uchun tizimga kiring.
        </p>
      )}

      {loading ? (
        <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "var(--ink-dim)" }}>Hali fikrlar yo'q. Birinchi bo'lib yozing!</p>
      ) : (
        comments.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
              display: "flex",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: c.user_avatar ? `url(${c.user_avatar}) center/cover` : "var(--bg-elevated)",
                border: "1px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                color: "var(--ink-dim)",
                fontWeight: 700,
              }}
            >
              {!c.user_avatar && c.user_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "0.92rem" }}>{c.user_name}</b>
                <span style={{ color: "var(--ink-dim)", fontSize: "0.78rem" }}>{timeAgo(c.created_at)}</span>
              </div>
              <p style={{ marginTop: 6, color: "var(--ink)", lineHeight: 1.6, fontSize: "0.92rem" }}>{c.content}</p>
              {user?.is_admin && (
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 10, padding: "5px 12px", fontSize: "0.78rem" }}
                  onClick={() => handleDelete(c.id)}
                >
                  O'chirish
                </button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
