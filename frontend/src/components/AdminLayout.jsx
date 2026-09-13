import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const NAV = [
  { to: "/admin", label: "Bosh sahifa", icon: "🏠", exact: true },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: "👥" },
  { to: "/admin/manage", label: "Kurslar", icon: "📘" },
  { to: "/fikrlar", label: "Komentariylar", icon: "💬" },
  { to: "/admin/settings", label: "Sozlamalar", icon: "⚙️" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function isActive(item) {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="admin-layout">
      <aside className="admin-side-nav">
        <div className="admin-side-logo">
          <span style={{ fontSize: "1.3rem" }}>🎓</span>
          <div>
            <b>Ilmly</b>
            <span>Admin</span>
          </div>
        </div>
        <nav>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={isActive(item) ? "active" : ""}>
              <span className="ic">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="admin-side-logout" onClick={handleLogout}>
          ↩️ Chiqish
        </button>
      </aside>

      <div className="admin-main-area">
        <div className="admin-topbar">
          <input className="admin-search" placeholder="🔍 Qidirish..." />
          <div className="admin-topbar-user">
            <div className="avatar-badge" style={user?.avatar ? { background: `url(${user.avatar}) center/cover`, color: "transparent" } : undefined}>
              {!user?.avatar && initials}
            </div>
            <div>
              <b>{user?.name}</b>
              <span>Administrator</span>
            </div>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
