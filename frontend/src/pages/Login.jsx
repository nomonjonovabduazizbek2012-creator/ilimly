import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.is_admin ? "/admin" : "/");
    } catch (err) {
      setError(errMsg(err, "Kirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>Xush kelibsiz</h2>
        <p className="sub">Hisobingizga kiring va o'rganishda davom eting</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siz@example.com"
            />
          </div>
          <div className="field">
            <label>Parol</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </form>

        <p className="auth-switch">
          Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
        </p>
      </motion.div>
    </div>
  );
}
