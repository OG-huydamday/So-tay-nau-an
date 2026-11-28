import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../p3/auth";
import "./admin.css";

const ADMIN_LINKS = [
  { to: "/quan-tri/cong-thuc", label: "Duyệt công thức" },
  { to: "/quan-tri/danh-gia", label: "Đánh giá & Xếp hạng" },
];

export function getCsrfToken() {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrf="));
  return match ? match.slice("csrf=".length) : "";
}

export async function adminFetch(url, { method = "GET", body, signal } = {}) {
  const headers = {};
  if (method !== "GET" && method !== "HEAD") {
    headers["X-CSRF-Token"] = getCsrfToken();
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await globalThis.fetch(url, {
    method,
    credentials: "same-origin",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const err = new Error(data?.message || "Yêu cầu quản trị chưa thành công.");
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}

export function AdminShell({ title, className = "", children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const isAdmin = session?.user?.role === "admin";

  if (loading) {
    return (
      <section className="wrap section">
        <p role="status">Đang kiểm tra quyền truy cập…</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="wrap section">
        <h1>{title}</h1>
        <p>
          Bạn cần{" "}
          <Link to="/dang-nhap" state={{ returnTo: location.pathname }}>
            đăng nhập
          </Link>{" "}
          bằng tài khoản quản trị viên.
        </p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="wrap section">
        <h1>Không có quyền truy cập</h1>
        <p role="alert" className="error">
          Chỉ quản trị viên mới được phép truy cập khu vực quản trị.
        </p>
        <Link className="btn" to="/">
          ← Về trang chủ
        </Link>
      </section>
    );
  }

  return (
    <section className={`wrap section admin-page ${className}`.trim()}>
      <h1>{title}</h1>
      <nav className="admin-subnav" aria-label="Khu vực quản trị">
        {ADMIN_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </section>
  );
}
