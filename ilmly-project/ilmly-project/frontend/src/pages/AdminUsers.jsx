import React, { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadUsers() {
    setLoading(true);
    api.get("/admin/users").then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleToggleAdmin(userId) {
    try {
      await api.post(`/admin/users/${userId}/toggle-admin`);
      loadUsers();
    } catch (err) {
      alert(errMsg(err, "Holatni o'zgartirishda xatolik"));
    }
  }

  async function handleDeleteUser(userItem) {
    if (!confirm(`"${userItem.name}" foydalanuvchisini o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/admin/users/${userItem.id}`);
      loadUsers();
    } catch (err) {
      alert(errMsg(err, "O'chirishda xatolik"));
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ fontSize: "1.3rem" }}>Foydalanuvchilar</h2>
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-dim)" }}>Yuklanmoqda...</p>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.created_at?.slice(0, 10)}</td>
                  <td>{u.is_admin ? <span style={{ color: "var(--teal)" }}>Admin</span> : "Oddiy"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline" onClick={() => handleToggleAdmin(u.id)}>
                        {u.is_admin ? "Admindan olish" : "Admin qilish"}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(u)}>
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
