import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const PLANS = [
  { key: "free", title: "Oddiy", price: "0 so'm", period: "", features: ["Bepul kurslarga kirish", "Fikrlar bo'limi", "Kod muharriri"] },
  { key: "monthly", title: "Premium", price: "20,000 so'm", period: "/oyiga", features: ["Barcha video darslar", "Ustuvor yordam", "Sertifikat"] },
  { key: "yearly", title: "Premium", price: "300,000 so'm", period: "/yiliga", features: ["Barcha video darslar", "Ustuvor yordam", "2 oy bepul (chegirma)"] },
  { key: "lifetime", title: "Umrbod", price: "1,000,000 so'm", period: "bir martalik", features: ["Umrbod kirish huquqi", "Barcha kelajakdagi kurslar", "VIP yordam"] },
];

export default function Premium() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [step, setStep] = useState("plans"); // 'plans' | 'pay'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/premium/card-number").then((res) => setCardNumber(res.data.card_number));
    if (user) {
      api.get("/premium/status").then((res) => setStatus(res.data));
    }
  }, [user]);

  function choosePlan(plan) {
    if (plan.key === "free") return;
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedPlan(plan);
    setStep("pay");
    setError("");
    setSuccess("");
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProof(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!proof) {
      setError("Iltimos, to'lov skrinshotini yuklang");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/premium/request", { plan: selectedPlan.key, proof_image: proof });
      setSuccess("So'rovingiz yuborildi! Admin tekshirib, premiumni faollashtiradi.");
      setStep("plans");
    } catch (err) {
      setError(errMsg(err, "Yuborishda xatolik"));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "pay" && selectedPlan) {
    return (
      <div className="container section" style={{ maxWidth: 560 }}>
        <button className="back-link" onClick={() => setStep("plans")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          ← Rejalarga qaytish
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 30, marginTop: 16 }}
        >
          <h2 style={{ fontSize: "1.4rem", marginBottom: 6 }}>{selectedPlan.title} — {selectedPlan.price}</h2>
          <p style={{ color: "var(--ink-dim)", marginBottom: 24 }}>
            Quyidagi kartaga to'lovni amalga oshiring va skrinshot (chek) yuklang.
          </p>

          <div
            style={{
              background: "linear-gradient(135deg, var(--gold), var(--teal))",
              borderRadius: 14,
              padding: 24,
              marginBottom: 24,
              color: "#0a0e0c",
            }}
          >
            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}>KARTA RAQAMI</div>
            <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "0.05em" }}>
              {cardNumber}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="field">
            <label>To'lov skrinshoti (chek)</label>
            <label className="file-input-label">
              {proof ? "Rasm tanlandi ✓" : "Rasm yuklash uchun bosing"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {proof && (
              <div className="image-preview">
                <img src={proof} alt="chek" />
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Yuborilmoqda..." : "Tanlagan premiumingizni yuboring"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <h2>Premium</h2>
          <p>O'zingizga mos rejani tanlang va barcha imkoniyatlarni oching.</p>
        </div>
      </div>

      {status?.active && (
        <div
          style={{
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.3)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: "var(--teal)",
          }}
        >
          ✓ Sizda faol Premium bor{status.plan === "lifetime" ? " (Umrbod)" : ` — ${new Date(status.expires_at.replace(" ", "T") + "Z").toLocaleDateString("uz-UZ")} gacha amal qiladi`}
        </div>
      )}
      {status?.expired && (
        <div
          style={{
            background: "rgba(226,100,92,0.12)",
            border: "1px solid rgba(226,100,92,0.3)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: "var(--danger)",
            fontWeight: 600,
          }}
        >
          ⏰ Premium vaqtingiz tugadi. Qayta faollashtirish uchun rejalardan birini tanlang.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
        {PLANS.map((p) => (
          <div
            key={p.key}
            style={{
              background: "var(--bg-card)",
              border: p.key === "yearly" ? "2px solid var(--gold)" : "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 26,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {p.key === "yearly" && (
              <span style={{ color: "var(--gold-soft)", fontSize: "0.75rem", fontWeight: 700, marginBottom: 8 }}>
                ★ ENG FOYDALI
              </span>
            )}
            <h3 style={{ fontSize: "1.1rem" }}>{p.title}</h3>
            <div style={{ margin: "14px 0" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700 }}>{p.price}</span>
              <span style={{ color: "var(--ink-dim)", fontSize: "0.85rem" }}> {p.period}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", flex: 1 }}>
              {p.features.map((f) => (
                <li key={f} style={{ color: "var(--ink-dim)", fontSize: "0.9rem", marginBottom: 8 }}>
                  ✓ {f}
                </li>
              ))}
            </ul>
            <button
              className={p.key === "free" ? "btn btn-outline" : "btn btn-primary"}
              onClick={() => choosePlan(p)}
              disabled={p.key === "free"}
            >
              {p.key === "free" ? "Joriy reja" : "Tanlash"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
