(function () {
  "use strict";

  const TOKEN_KEY = "ph_customer_token";
  const notice = document.querySelector("#signup-notice");
  const form = document.querySelector("#signup-form");

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
      const name = document.querySelector("#signup-name").value.trim();
      const email = document.querySelector("#signup-email").value.trim();
      const phone = document.querySelector("#signup-phone").value.trim();
      const password = document.querySelector("#signup-password").value;
      const confirm = document.querySelector("#signup-confirm").value;

      if (password !== confirm) {
        throw new Error("Passwords do not match");
      }

      const payload = await request("/customers/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password })
      });

      localStorage.setItem(TOKEN_KEY, payload.token);
      showNotice("Account created. Welcome to Pasta House.", "success");
      window.location.href = "index.html";
    } catch (error) {
      showNotice(error.message || "Unable to create account");
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
