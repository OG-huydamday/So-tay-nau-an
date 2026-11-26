/* global URL, location, AbortController, setTimeout, fetch, clearTimeout */
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
async function request(endpoint, options = {}) {
  if (
    !endpoint.startsWith("/") ||
    endpoint.startsWith("//") ||
    new URL(endpoint, location.href).origin !== location.origin
  )
    throw new Error("Đường dẫn dịch vụ đăng nhập chưa hợp lệ.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: "same-origin",
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const message = typeof error?.message === "string" && response.status < 500
        ? error.message
        : "Dịch vụ đăng nhập đang bận. Bạn thử lại sau nhé.";
      throw new Error(message);
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError)
      throw new Error("Chưa thể kết nối máy chủ. Vui lòng thử lại.");
    if (error instanceof SyntaxError)
      throw new Error("Máy chủ chưa trả về dữ liệu đăng nhập hợp lệ.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request("/api/auth/me")
      .then(data => { if (active) setSession(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function authenticate(endpoint, body) {
    const data = await request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!data?.user || typeof data.user !== "object") {
      throw new Error("Máy chủ chưa trả về thông tin tài khoản hợp lệ.");
    }
    setSession(data);
  }
  function login(email, password) {
    return authenticate(import.meta.env.VITE_LOGIN_PATH || "/api/auth/login", { email, password });
  }
  function register(name, email, password) {
    return authenticate("/api/auth/register", { name, email, password });
  }
  async function logout() {
    const csrf = document.cookie.split(";").map(cookie => cookie.trim()).find(cookie => cookie.startsWith("csrf="));
    await request("/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": csrf?.slice("csrf=".length) || "" },
    });
    setSession(null);
  }
  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
