(function () {
  "use strict";

  const form = document.querySelector("#admin-login-form");
  const notice = document.querySelector("#login-notice");

  function showNotice(message, type = "error") {
    if (!notice) return;
    notice.textContent = message;
    notice.className = `notice ${type}`;
    notice.hidden = false;
  }

  if (AdminAPI.getToken()) {
    window.location.href = "dashboard.html";
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;

    try {
      const payload = await AdminAPI.request("/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: document.querySelector("#username").value.trim(),
          password: document.querySelector("#password").value
        })
      });

      AdminAPI.setToken(payload.token);
      showNotice("Login successful.", "success");
      window.location.href = "dashboard.html";
    } catch (error) {
      showNotice(error.message || "Unable to log in");
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
