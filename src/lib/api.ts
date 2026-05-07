const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("admin_token") || localStorage.getItem("user_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ── Admin ────────────────────────────────────────────
export async function adminLogin(password: string) {
  const data = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  localStorage.setItem("admin_token", data.token);
  return data;
}

export function adminLogout() {
  localStorage.removeItem("admin_token");
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem("admin_token");
}

export async function getRestaurantConfig() {
  return request("/api/admin/config");
}

export async function setRestaurantConfig(is_open: boolean) {
  return request("/api/admin/config", {
    method: "PUT",
    body: JSON.stringify({ is_open }),
  });
}

// ── Menu ─────────────────────────────────────────────
export async function getMenu() {
  return request("/api/menu");
}

export async function getAllMenu() {
  return request("/api/menu/all");
}

export async function createMenuItem(item: Record<string, unknown>) {
  return request("/api/menu", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateMenuItem(id: string, item: Record<string, unknown>) {
  return request(`/api/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export async function deleteMenuItem(id: string) {
  return request(`/api/menu/${id}`, { method: "DELETE" });
}

// ── Orders ───────────────────────────────────────────
export async function placeOrder(order: Record<string, unknown>) {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getOrdersByPhone(phone: string) {
  return request(`/api/orders?phone=${encodeURIComponent(phone)}`);
}

export async function getAllOrders() {
  return request("/api/orders/all");
}

export async function updateOrderStatus(id: string, status: string) {
  return request(`/api/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function getOrder(id: string) {
  return request(`/api/orders/${id}`);
}

// ── User ─────────────────────────────────────────────
export async function userLogin(credentials: Record<string, any>) {
  const data = await request("/api/user/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  localStorage.setItem("user_token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function userSignup(userData: Record<string, any>) {
  const data = await request("/api/user/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  localStorage.setItem("user_token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export function userLogout() {
  localStorage.removeItem("user_token");
  localStorage.removeItem("user");
}

export async function forgotPassword(phone: string) {
  return request("/api/user/forgot-password", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function resetPassword(phone: string, newPassword: string) {
  return request("/api/user/reset-password", {
    method: "POST",
    body: JSON.stringify({ phone, newPassword }),
  });
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export async function getUserProfile() {
  return request("/api/user/profile");
}

// ── OTP ──────────────────────────────────────────────
export async function sendOtp(phone: string) {
  return request("/api/otp/send", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, otp: string) {
  return request("/api/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
}
