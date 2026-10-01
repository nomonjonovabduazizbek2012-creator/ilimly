import React, { useEffect, useState } from "react";
import api, { errMsg } from "../api";

const PLAN_LABELS = { monthly: "Oylik (20,000 so'm)", yearly: "Yillik (300,000 so'm)", lifetime: "Umrbod" };

export default function AdminPremium() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    Promise.all([api.get("/admin/premium-requests"), api.get("/admin/premium-users")])
      .then(([r, u]) => {
        setRequests(r.data);
        setUsers(u.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  async function handleApprove(id, duration) {
    try {
      await api.post(`/admin/premium-requests/${id}/approve`, { duration });
      loadData();
    } catch (err) {
      alert(errMsg(err, "Faollashtirishda xatolik"));
    }
  }

  async function handleReject(id) {
    if (!confirm("Bu so'rovni rad etmoqchimisiz?")) return;
    try {
      await api.post(`/admin/premium-requests/${id}/reject`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "Rad etishda xatolik"));
    }
  }

  async function handleRemove(userId) {
    if (!confirm("Bu foydalanuvchini premiumdan chiqarmoqchimisiz?")) return;
    try {
      await api.post(`/admin/premium-users/${userId}/remove`);
      loadData();
    } catch (err) {
      alert(errMsg(err, "Chiqarishda xatolik"));
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ fontSize: "1.3rem" }}>Premium</h2>
      </div>

      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <h4>Kutilayotgan so'rovlar {requests.length > 0 && `(${requests.length})`}</h4>
        {loading ? (
          <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>Hozircha so'rov yo'q.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Reja</th>
                <th>Chek</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.user_name}
                    <div style={{ color: "var(--ink-dim)", fontSize: "0.78rem" }}>{r.user_email}</div>
                  </td>
                  <td>{PLAN_LABELS[r.plan] || r.plan}</td>
                  <td>
                    {r.proof_image ? (
                      <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setViewImage(r.proof_image)}>
                        Ko'rish
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-primary" onClick={() => handleApprove(r.id, "month")}>
                        1 oylik
                      </button>
                      <button className="btn btn-outline" onClick={() => handleApprove(r.id, "year")}>
                        1 yillik
                      </button>
                      <button className="btn btn-outline" onClick={() => handleApprove(r.id, "lifetime")}>
                        Umrbod
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
        )}
      </div>

      <div className="admin-panel">
        <h4>Faol Premium foydalanuvchilar</h4>
        {users.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>Hozircha premium foydalanuvchi yo'q.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.plan === "lifetime" ? (
                      <span style={{ color: "var(--teal)" }}>● Umrbod</span>
                    ) : u.active ? (
                      <span style={{ color: "var(--teal)" }}>● {u.expires_at?.slice(0, 10)} gacha</span>
                    ) : (
                      <span style={{ color: "var(--danger)" }}>● Muddati tugagan</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleRemove(u.id)}>
                      Chiqarish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewImage && (
        <div className="modal-backdrop" onClick={() => setViewImage(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3>To'lov skrinshoti</h3>
            <img src={viewImage} alt="chek" style={{ width: "100%", borderRadius: 10 }} />
            <button className="btn btn-outline btn-block" style={{ marginTop: 16 }} onClick={() => setViewImage(null)}>
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
