/* global URL, location, AbortController, setTimeout, fetch, clearTimeout */
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  async function login(email, password) {
    const endpoint = import.meta.env.VITE_LOGIN_PATH || "/api/auth/login";
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      const data = await response.json();
      if (!data.user || typeof data.user !== "object")
        throw new Error("Phản hồi đăng nhập chưa đúng định dạng đã cấu hình.");
      setSession({ user: data.user });
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
  return (
    <AuthContext.Provider value={{ session, login }}>
      {children}
    </AuthContext.Provider>
  );
}
