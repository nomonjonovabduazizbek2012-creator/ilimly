import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";

const TELEGRAM_LINK = "https://t.me/+ka_C0Lcf2xRhNDgy";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/my-courses"), api.get("/my-certificates"), api.get("/my-total-completed")])
      .then(([c, cert, tc]) => {
        setMyCourses(c.data);
        setCertificates(cert.data);
        setTotalCompleted(tc.data.total_completed);
      })
      .finally(() => setLoading(false));
  }, []);

  const ACHIEVEMENTS = [
    { icon: "🚀", title: "Birinchi qadam", need: 1, text: "1 ta darsni tugating" },
    { icon: "⚡", title: "Tez o'rganuvchi", need: 3, text: "3 ta darsni tugating" },
    { icon: "📚", title: "Kitobxon", need: 5, text: "5 ta darsni tugating" },
    { icon: "🌟", title: "Yulduz", need: 10, text: "10 ta darsni tugating" },
    { icon: "🎓", title: "Professor", need: 15, text: "15 ta darsni tugating" },
    { icon: "🧠", title: "Bilimdon", need: 20, text: "20 ta darsni tugating" },
  ];

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setAvatarSaving(true);
      try {
        await api.put("/me/avatar", { avatar: reader.result });
        updateUser({ avatar: reader.result });
      } catch {
        alert("Rasmni saqlashda xatolik");
      } finally {
        setAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwSaving(true);
    try {
      await api.post("/me/change-password", { current_password: currentPassword, new_password: newPassword });
      setPwSuccess("Parol muvaffaqiyatli yangilandi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(errMsg(err, "Parolni yangilashda xatolik"));
    } finally {
      setPwSaving(false);
    }
  }

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container section" style={{ maxWidth: 780 }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 30,
          display: "flex",
          alignItems: "center",
          gap: 22,
          flexWrap: "wrap",
          marginBottom: 30,
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: user.avatar ? `url(${user.avatar}) center/cover` : "var(--bg-elevated)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--ink-dim)",
            }}
          >
            {!user.avatar && initials}
          </div>
          <label
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.85rem",
              border: "2px solid var(--bg-card)",
            }}
            title="Rasmni o'zgartirish"
          >
            {avatarSaving ? "..." : "📷"}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </label>
        </div>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>{user.name}</h2>
          <p style={{ color: "var(--ink-dim)", marginTop: 4 }}>{user.email}</p>
          {user.is_admin && (
            <span style={{ color: "var(--teal)", fontSize: "0.8rem", fontWeight: 700 }}>● Admin</span>
          )}
        </div>
        <a
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{ marginLeft: "auto" }}
        >
          💬 Telegram guruhga qo'shilish
        </a>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-soft)", fontFamily: "var(--font-display)" }}>
            {myCourses.length}
          </div>
          <div style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>Kurslar</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--teal)", fontFamily: "var(--font-display)" }}>
            {certificates.length}
          </div>
          <div style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>Sertifikatlar</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(217,164,65,0.15), rgba(34,197,94,0.1))", border: "1px solid rgba(217,164,65,0.3)", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-soft)", fontFamily: "var(--font-display)" }}>
            Level {user.level || 1}
          </div>
          <div style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>{user.xp || 0} XP</div>
        </div>
      </div>

      <div style={{ marginBottom: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
          <span style={{ color: "var(--ink-dim)" }}>Keyingi darajagacha</span>
          <span style={{ color: "var(--teal)", fontWeight: 700 }}>{(user.xp || 0) % 100}/100 XP</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(user.xp || 0) % 100}%`,
              background: "linear-gradient(90deg, var(--gold), var(--teal))",
            }}
          />
        </div>
      </div>

      <div className="section-head">
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>🏆 Sertifikatlar</h3>
          <p style={{ marginTop: 4 }}>Admin tomonidan berilgan sertifikatlaringiz.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
      ) : certificates.length === 0 ? (
        <p style={{ color: "var(--ink-dim)", marginBottom: 30 }}>
          Hali sertifikatingiz yo'q. Kursni tugatib, admin sizga sertifikat berishini kuting.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 30 }}>
          {certificates.map((cert) => (
            <div
              key={cert.id}
              style={{
                background: "linear-gradient(135deg, rgba(217,164,65,0.12), rgba(34,197,94,0.08))",
                border: "1px solid rgba(217,164,65,0.3)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: "1.6rem" }}>🏅</div>
              <b style={{ display: "block", marginTop: 8 }}>{cert.title}</b>
              <span style={{ color: "var(--ink-dim)", fontSize: "0.82rem" }}>{cert.course_title}</span>
              <div style={{ color: "var(--ink-dim)", fontSize: "0.75rem", marginTop: 8 }}>
                {new Date(cert.issued_at.replace(" ", "T") + "Z").toLocaleDateString("uz-UZ")}
              </div>
              {cert.file && (
                <a
                  href={cert.file}
                  download={`${cert.title}.pdf`}
                  className="btn btn-outline"
                  style={{ marginTop: 12, width: "100%", textAlign: "center", padding: "8px", fontSize: "0.82rem" }}
                >
                  ⬇️ Yuklab olish
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="section-head" style={{ marginTop: 10 }}>
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>⭐ Darslar bo'yicha yutuqlar</h3>
          <p style={{ marginTop: 4 }}>Jami tugatilgan darslar: {totalCompleted}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 40 }}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = totalCompleted >= a.need;
          const pct = Math.min(100, Math.round((totalCompleted / a.need) * 100));
          return (
            <div
              key={a.title}
              style={{
                background: unlocked ? "rgba(52,211,153,0.08)" : "var(--bg-card)",
                border: `1px solid ${unlocked ? "rgba(52,211,153,0.3)" : "var(--border)"}`,
                borderRadius: 12,
                padding: 16,
                opacity: unlocked ? 1 : 0.7,
              }}
            >
              <div style={{ fontSize: "1.4rem" }}>{unlocked ? a.icon : "🔒"}</div>
              <b style={{ display: "block", marginTop: 8, fontSize: "0.9rem" }}>{a.title}</b>
              <span style={{ color: "var(--ink-dim)", fontSize: "0.78rem" }}>{a.text}</span>
              <div style={{ height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: unlocked ? "var(--teal)" : "var(--gold)" }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-dim)" }}>
                {Math.min(totalCompleted, a.need)}/{a.need}
              </span>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>⚙️ Sozlamalar</h3>
          <p style={{ marginTop: 4 }}>Parolingizni shu yerdan yangilashingiz mumkin.</p>
        </div>
      </div>

      <form
        onSubmit={handleChangePassword}
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 22, maxWidth: 420 }}
      >
        {pwError && <div className="form-error">{pwError}</div>}
        {pwSuccess && <div className="form-success">{pwSuccess}</div>}
        <div className="field">
          <label>Joriy parol</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Yangi parol</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" disabled={pwSaving}>
          {pwSaving ? "Yangilanmoqda..." : "Parolni yangilash"}
        </button>
      </form>
    </div>
  );
}
