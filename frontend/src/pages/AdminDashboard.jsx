import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import api from "../api";

const STAT_CARDS = [
  { key: "users_count", label: "Jami foydalanuvchilar", icon: "👤", cls: "stat-blue" },
  { key: "courses_count", label: "Jami kurslar", icon: "📗", cls: "stat-green" },
  { key: "lessons_count", label: "Jami darslar", icon: "🎬", cls: "stat-purple" },
  { key: "comments_count", label: "Jami komentariylar", icon: "💬", cls: "stat-orange" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <div style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</div>;

  return (
    <div>
      <motion.div
        className="admin-welcome"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h2>Xush kelibsiz, Admin! 👋</h2>
          <p>Ilmly platformasining admin paneliga xush kelibsiz.</p>
        </div>
        <span className="admin-quote">"Bilim — eng katta boylik."</span>
      </motion.div>

      <div className="admin-stat-grid">
        {STAT_CARDS.map((c, i) => (
          <motion.div
            className={`admin-stat-tile ${c.cls}`}
            key={c.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <div className="admin-stat-icon">{c.icon}</div>
            <div>
              <b>{data[c.key]}</b>
              <span>{c.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <h4>Foydalanuvchilar o'sishi <span style={{ color: "var(--ink-dim)", fontWeight: 400, fontSize: "0.8rem" }}>(so'nggi 7 kun)</span></h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.growth}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--ink-dim)" fontSize={12} />
              <YAxis stroke="var(--ink-dim)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="var(--teal)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--teal)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-panel">
          <h4>So'nggi faoliyat</h4>
          {data.recent_activity.length === 0 ? (
            <p style={{ color: "var(--ink-dim)", fontSize: "0.88rem" }}>Hozircha faoliyat yo'q.</p>
          ) : (
            data.recent_activity.map((a) => (
              <div className="activity-row" key={`${a.kind}-${a.id}`}>
                <span className="activity-ic">{a.kind === "comment" ? "💬" : "📝"}</span>
                <div>
                  <b>{a.user_name}</b>{" "}
                  {a.kind === "comment" ? "komentariy yozdi" : `"${a.content}" kursiga ariza yubordi`}
                  {a.kind === "comment" && <div className="activity-sub">{a.content}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: 20 }}>
        <h4>So'nggi foydalanuvchilar</h4>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Foydalanuvchi</th>
              <th>Email</th>
              <th>Ro'yxatdan o'tgan sana</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_users.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.created_at?.slice(0, 10)}</td>
                <td>
                  <span style={{ color: u.is_admin ? "var(--teal)" : "var(--gold-soft)" }}>
                    ● {u.is_admin ? "Admin" : "Talaba"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
