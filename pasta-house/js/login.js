(function () {
  "use strict";

  const TOKEN_KEY = "ph_customer_token";
  const notice = document.querySelector("#login-notice");
  const form = document.querySelector("#login-form");

  const showNotice = (message, type = "error") => {
    if (!notice) return;
    notice.textContent = message;
    notice.className = `auth-notice visible ${type}`;
  };

  const apiBase = () => window.PH_CONFIG?.API_BASE || "http://localhost:5000/api";

  const request = async (path, options = {}) => {
    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Request failed");
    }
    return payload;
  };

  if (localStorage.getItem(TOKEN_KEY)) {
    window.location.href = "account.html";
    return;
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;

    try {
      const email = document.querySelector("#login-email").value.trim();
      const password = document.querySelector("#login-password").value;
      const payload = await request("/customers/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem(TOKEN_KEY, payload.token);
      showNotice("Login successful. Taking you back to the menu.", "success");
      window.location.href = "index.html";
    } catch (error) {
      showNotice(error.message || "Unable to log in");
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
