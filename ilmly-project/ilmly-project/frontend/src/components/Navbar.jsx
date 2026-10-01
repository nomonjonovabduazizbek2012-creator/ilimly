import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.is_admin) {
      api
        .get("/admin/stats")
        .then((res) => setPendingCount(res.data.pending_requests || 0))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-dot" />
          Ilmly
        </Link>

        <div className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Kurslar
          </Link>
          <Link to="/fikrlar" className={location.pathname === "/fikrlar" ? "active" : ""}>
            Fikrlar
          </Link>
          <Link to="/premium" className={location.pathname === "/premium" ? "active" : ""} style={{ color: "var(--gold-soft)" }}>
            💎 Premium
          </Link>
          {user && (
            <Link to="/playground" className={location.pathname === "/playground" ? "active" : ""}>
              Kod muharriri
            </Link>
          )}
          {user && (
            <Link to="/my-courses" className={location.pathname === "/my-courses" ? "active" : ""}>
              Mening kurslarim
            </Link>
          )}
          {user?.is_admin && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""} style={{ position: "relative" }}>
              Admin panel
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -16,
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "1px 6px",
                    lineHeight: 1.4,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
        </div>

        <div className="nav-user">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline">
                Kirish
              </Link>
              <Link to="/register" className="btn btn-primary">
                Ro'yxatdan o'tish
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="avatar-badge"
                title={user.name}
                style={{
                  position: "relative",
                  ...(user.avatar
                    ? { background: `url(${user.avatar}) center/cover`, color: "transparent" }
                    : {}),
                }}
              >
                {!user.avatar && initials}
                {user.premium?.active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "var(--teal)",
                      border: "2px solid var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                    }}
                  >
                    {user.badge || "💎"}
                  </span>
                )}
              </Link>
              <button className="btn btn-outline" onClick={handleLogout}>
                Chiqish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
