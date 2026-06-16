(function () {
  "use strict";

  const API_BASE = window.PH_CONFIG?.API_BASE || window.PH_API_BASE || "http://localhost:5000/api";
  const TOKEN_KEY = "ph_admin_token";

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  async function request(path, options = {}) {
    const token = getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      if (response.status === 401) clearToken();
      throw new Error(payload.message || "Request failed");
    }

    return payload;
  }

  window.AdminAPI = {
    API_BASE,
    getToken,
    setToken,
    clearToken,
    request,
    data: async (path, options) => (await request(path, options)).data
  };
})();
