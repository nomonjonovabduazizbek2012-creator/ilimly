import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import CourseCard from "../components/CourseCard";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="container">
        <div className="hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-eyebrow">Onlayn ta'lim platformasi</div>
            <h1>
              Yangi kasbni <br /> uyingizdan turib o'rganing
            </h1>
            <p className="lead">
              Dasturlash, dizayn va zamonaviy texnologiyalar bo'yicha amaliy kurslar.
              O'z tezligingizda o'rganing, amaliy loyihalar bilan mustahkamlang.
            </p>
            <div className="hero-actions">
              <a href="#courses" className="btn btn-primary">
                Kurslarni ko'rish
              </a>
              <a href="/register" className="btn btn-outline">
                Bepul ro'yxatdan o'tish
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <b>{courses.length || "6"}+</b>
                <span>Faol kurslar</span>
              </div>
              <div className="hero-stat">
                <b>1200+</b>
                <span>O'quvchilar</span>
              </div>
              <div className="hero-stat">
                <b>4.8</b>
                <span>O'rtacha baho</span>
              </div>
            </div>
          </motion.div>

          <div className="hero-visual">
            <motion.div
              className="float-card"
              initial={{ opacity: 0, x: 40, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: -14, rotateX: 6 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{ top: 10, right: 30 }}
            >
              <span className="tag">React kurs</span>
              <h4>Komponentlar asosida qurish</h4>
              <div className="bar">
                <div className="bar-fill" style={{ width: "72%" }} />
              </div>
            </motion.div>

            <motion.div
              className="float-card"
              initial={{ opacity: 0, x: 60, y: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 30, y: 160, rotateY: 10, rotateX: -6 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ top: 20, right: -10 }}
            >
              <span className="tag">Python kurs</span>
              <h4>Algoritmlar va asoslar</h4>
              <div className="bar">
                <div className="bar-fill" style={{ width: "45%" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container" id="courses">
        <div className="section">
          <div className="section-head">
            <div>
              <h2>Barcha kurslar</h2>
              <p>O'zingizga mos yo'nalishni tanlang va bugunoq boshlang.</p>
            </div>
            <div className="field" style={{ margin: 0, minWidth: 240 }}>
              <input
                placeholder="Kurs qidirish..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--ink-dim)" }}>Hech narsa topilmadi.</p>
          ) : (
            <div className="course-grid">
              {filtered.map((c, i) => (
                <CourseCard course={c} key={c.id} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="section about-grid">
          <div>
            <span style={{ color: "var(--teal)", fontSize: "0.8rem", fontWeight: 700 }}>BIZ HAQIMIZDA</span>
            <h2 style={{ marginTop: 10, fontSize: "1.9rem" }}>Ilmly qanday va nima uchun yaratilgan?</h2>
            <p style={{ marginTop: 16, color: "var(--ink-dim)", lineHeight: 1.8 }}>
              Ilmly — 2024-yilda O'zbekistonlik dasturchilar va o'qituvchilar guruhi tomonidan
              asos solingan onlayn ta'lim platformasi. Bizning maqsadimiz — dasturlashni
              o'rganishni istagan har bir kishiga sifatli, tushunarli va amaliy bilim berish,
              til yoki geografik chegaralardan qat'i nazar.
            </p>
            <p style={{ marginTop: 14, color: "var(--ink-dim)", lineHeight: 1.8 }}>
              Boshida bir nechta bepul video darslardan boshlangan loyihamiz, bugungi kunda
              minglab o'quvchini birlashtirgan to'liq platformaga aylandi. Har bir kurs
              real ish tajribasiga ega mutaxassislar tomonidan tayyorlanadi va doimiy
              yangilanib boriladi — texnologiya sohasi tez o'zgargani uchun bizning
              darslarimiz ham hech qachon eskirmaydi.
            </p>
            <p style={{ marginTop: 14, color: "var(--ink-dim)", lineHeight: 1.8 }}>
              Platformada siz nafaqat video ko'rasiz — balki amaliy vazifalar bajarasiz,
              o'zingiz yozgan kodni shu yerning o'zida (kod muharririmizda) sinab ko'rasiz,
              hamjamiyat bilan fikr almashasiz va kursni tugatib sertifikat olasiz.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 26 }}>
              <div>
                <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--gold-soft)" }}>2024</b>
                <span style={{ color: "var(--ink-dim)", fontSize: "0.85rem" }}>Asos solingan yil</span>
              </div>
              <div>
                <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--teal)" }}>1200+</b>
                <span style={{ color: "var(--ink-dim)", fontSize: "0.85rem" }}>O'quvchilar soni</span>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
            <h4 style={{ marginBottom: 16 }}>Nimalarni o'rganasiz?</h4>
            {[
              "Dasturlash asoslari — o'zgaruvchilar, sikllar, funksiyalar",
              "Zamonaviy freymvorklar (React, Flask) bilan ishlash",
              "Ma'lumotlar bazasi va API loyihalash",
              "Git, deploy va real loyiha qurish jarayoni",
              "Jamoada ishlash va kod o'qish madaniyati",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ color: "var(--teal)" }}>✓</span>
                <span style={{ color: "var(--ink-dim)", fontSize: "0.92rem", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}

            <h4 style={{ marginTop: 22, marginBottom: 12 }}>Jamoamiz</h4>
            <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem", lineHeight: 1.7 }}>
              Loyiha ustida backend, frontend va ta'lim metodikasi bo'yicha mutaxassislardan
              iborat kichik, ammo tajribali jamoa ishlaydi. Har bir kurs bir necha bosqichda
              sinovdan o'tkaziladi va faqat shundan keyin platformaga qo'shiladi.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section">
          <div className="section-head">
            <div>
              <span style={{ color: "var(--teal)", fontSize: "0.8rem", fontWeight: 700 }}>NEGA ILMLY?</span>
              <h2 style={{ marginTop: 8 }}>
                Oddiy o'rganish. <span style={{ color: "var(--teal)" }}>Kuchli natija.</span>
              </h2>
              <p style={{ marginTop: 10 }}>
                O'quvchini faqat video ko'rishga emas, haqiqiy dasturchi kabi fikrlashga o'rgatamiz.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {[
              { icon: "💻", color: "#34d399", bg: "rgba(52,211,153,0.12)", title: "Real coding", text: "Har bir mavzu real kod yozish va amaliy vazifalar orqali mustahkamlanadi." },
              { icon: "🧩", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", title: "Tizimli ta'lim", text: "Boshlang'ichdan professional darajagacha bosqichma-bosqich yo'l." },
              { icon: "🚀", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", title: "Portfolio", text: "Kurs davomida yaratgan loyihalaringiz portfolioingiz uchun tayyor bo'ladi." },
              { icon: "💡", color: "#facc15", bg: "rgba(250,204,21,0.12)", title: "Tushunarli darslar", text: "Murakkab tushunchalarni sodda va tushunarli usulda o'rganasiz." },
              { icon: "⌨️", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", title: "Developer mindset", text: "Faqat sintaksis emas, muammoni yechish va professional fikrlashni o'rganasiz." },
              { icon: "💬", color: "#f87171", bg: "rgba(248,113,113,0.12)", title: "Jamoa", text: "Savollar, fikrlar va tajriba almashish uchun o'quvchilar hamjamiyati." },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 26,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    marginBottom: 16,
                  }}
                >
                  {f.icon}
                </div>
                <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
                <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem", lineHeight: 1.6 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer">© 2026 Ilmly. Barcha huquqlar himoyalangan.</div>
    </div>
  );
}
