import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarSource, setAvatarSource] = useState("upload");
  const [avatarLink, setAvatarLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }

    setLoading(true);
    try {
      const finalAvatar = avatarSource === "link" ? avatarLink.trim() : avatar;
      const res = await api.post("/register", {
        first_name: firstName,
        last_name: lastName,
        age,
        gender,
        username,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
        avatar: finalAvatar,
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(errMsg(err, "Ro'yxatdan o'tishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card"
        style={{ maxWidth: 560 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>Ro'yxatdan o'tish</h2>
        <p className="sub">Yangi hisob yaratish va platformadan foydalanish</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background:
                  (avatarSource === "link" ? avatarLink : avatar)
                    ? `url(${avatarSource === "link" ? avatarLink : avatar}) center/cover`
                    : "var(--bg-elevated)",
                border: "2px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                color: "var(--ink-dim)",
              }}
            >
              {!(avatarSource === "link" ? avatarLink : avatar) && "📷"}
            </div>

            <div className="source-toggle" style={{ width: "100%", maxWidth: 280 }}>
              <button type="button" className={avatarSource === "upload" ? "active" : ""} onClick={() => setAvatarSource("upload")}>
                🖼️ Fayl yuklash
              </button>
              <button type="button" className={avatarSource === "link" ? "active" : ""} onClick={() => setAvatarSource("link")}>
                🔗 Rasm havolasi
              </button>
            </div>

            {avatarSource === "upload" ? (
              <label className="file-input-label" style={{ maxWidth: 280 }}>
                {avatar ? "Rasmni almashtirish" : "Profil rasmi yuklash"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            ) : (
              <input
                style={{ maxWidth: 280 }}
                value={avatarLink}
                onChange={(e) => setAvatarLink(e.target.value)}
                placeholder="https://..."
              />
            )}
          </div>

          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--teal)", marginTop: 18, marginBottom: 10 }}>
            SHAXSIY MA'LUMOTLAR
          </p>
          <div className="form-row-2">
            <div className="field">
              <label>Ism</label>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ismingiz" />
            </div>
            <div className="field">
              <label>Familiya</label>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiyangiz" />
            </div>
            <div className="field">
              <label>Yosh</label>
              <input type="number" min="5" max="100" value={age} onChange={(e) => setAge(e.target.value)} placeholder="20" />
            </div>
            <div className="field">
              <label>Jins</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--teal)", marginTop: 8, marginBottom: 10 }}>
            AKKAUNT VA ALOQA
          </p>
          <div className="field">
            <label>Foydalanuvchi nomi (username)</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="masalan: alisher_dev" />
          </div>
          <div className="form-row-2">
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@example.com" />
            </div>
            <div className="field">
              <label>Telefon raqam</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--teal)", marginTop: 8, marginBottom: 10 }}>
            XAVFSIZLIK
          </p>
          <div className="form-row-2">
            <div className="field">
              <label>Parol</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
              />
            </div>
            <div className="field">
              <label>Parolni tasdiqlash</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Qayta kiriting"
              />
            </div>
          </div>

          <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="auth-switch">
          Hisobingiz bormi? <Link to="/login">Kiring</Link>
        </p>
      </motion.div>
    </div>
  );
}
