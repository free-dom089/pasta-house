(function () {
  "use strict";

  const TOKEN_KEY = "ph_customer_token";
  const API_BASE = window.PH_CONFIG?.API_BASE || "http://localhost:5000/api";
  const notice = document.querySelector("#account-notice");
  const ordersList = document.querySelector("#orders-list");

  const money = (amount) => `\u20A6${Number(amount || 0).toLocaleString("en-NG")}`;
  const dateLabel = (value) => value ? new Date(value).toLocaleString("en-NG") : "-";

  const token = () => localStorage.getItem(TOKEN_KEY);
  const redirectIfNeeded = () => {
    if (!token()) window.location.href = "login.html";
  };

  const showNotice = (message, type = "error") => {
    if (!notice) return;
    notice.textContent = message;
    notice.className = `account-notice visible ${type}`;
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "login.html";
      }
      throw new Error(payload.message || "Request failed");
    }
    return payload.data;
  };

  const renderProfile = (customer) => {
    document.querySelector("#account-name").value = customer.name || "";
    document.querySelector("#account-phone").value = customer.phone || "";
    document.querySelector("#account-address").value = customer.savedAddress || "";
    document.querySelector("#account-email").textContent = customer.email || "";
  };

  const statusClass = (status) => String(status || "").replaceAll("_", "-");

  const renderOrders = (orders) => {
    if (!ordersList) return;
    if (!orders.length) {
      ordersList.innerHTML = '<p class="form-helper">No orders yet. Your loaded pasta history will appear here.</p>';
      return;
    }

    ordersList.innerHTML = orders.map((order) => {
      const lines = (order.items || [])
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", ");
      const extras = (order.extras || [])
        .map((extra) => extra.name)
        .join(", ");

      return `<article class="history-card">
        <div class="history-card-head">
          <span class="history-title">${dateLabel(order.createdAt)}</span>
          <span class="status-badge ${statusClass(order.orderStatus)}">${String(order.orderStatus || "new").replaceAll("_", " ")}</span>
        </div>
        <p>${lines}${extras ? `<br>Extras: ${extras}` : ""}</p>
        <p><strong>${money(order.totalAmount)}</strong> <span class="status-badge ${order.paymentStatus}">${order.paymentStatus}</span></p>
      </article>`;
    }).join("");
  };

  document.addEventListener("DOMContentLoaded", async () => {
    redirectIfNeeded();

    try {
      const customer = await request("/customers/me");
      renderProfile(customer);
      const orders = await request("/customers/me/orders");
      renderOrders(orders);
    } catch (error) {
      showNotice(error.message || "Unable to load account");
    }

    const form = document.querySelector("#account-form");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        try {
          const customer = await request("/customers/me", {
            method: "PUT",
            body: JSON.stringify({
              name: document.querySelector("#account-name").value.trim(),
              phone: document.querySelector("#account-phone").value.trim(),
              savedAddress: document.querySelector("#account-address").value.trim()
            })
          });
          renderProfile(customer);
          showNotice("Profile saved.", "success");
        } catch (error) {
          showNotice(error.message || "Unable to save profile");
        } finally {
          if (button) button.disabled = false;
        }
      });
    }
  });
})();
