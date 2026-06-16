(function () {
  "use strict";

  const API_BASE = window.PH_CONFIG?.API_BASE || "http://localhost:5000/api";
  const TOKEN_KEY = "ph_customer_token";
  const money = (amount) => `\u20A6${Number(amount || 0).toLocaleString("en-NG")}`;

  const qs = (selector) => document.querySelector(selector);

  const request = async (path) => {
    const response = await fetch(`${API_BASE}${path}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Request failed");
    }
    return payload.data;
  };

  const statusClass = (status) => String(status || "").replaceAll("_", "-");

  const renderOrder = (order) => {
    qs("#confirmation-title").textContent = "Order Confirmed";
    qs("#confirmation-copy").textContent = "Your order has been received. Pasta House will continue preparing once payment is confirmed.";

    const lines = (order.items || [])
      .map((item) => `<div class="order-line"><strong>${item.name}</strong><br>${item.quantity} x ${money(item.price)}</div>`)
      .join("");
    const extras = (order.extras || [])
      .map((extra) => `<div class="order-line"><strong>${extra.name}</strong><br>${money(extra.price)}</div>`)
      .join("");

    qs("#order-summary").innerHTML = `
      <div class="summary-meta">
        <div><span>Order</span><strong>${order._id}</strong></div>
        <div><span>Total</span><strong>${money(order.totalAmount)}</strong></div>
        <div><span>Payment</span><strong><span class="status-badge ${order.paymentStatus}">${order.paymentStatus}</span></strong></div>
        <div><span>Status</span><strong><span class="status-badge ${statusClass(order.orderStatus)}">${String(order.orderStatus || "new").replaceAll("_", " ")}</span></strong></div>
      </div>
      <div class="order-lines">
        ${lines}
        ${extras}
      </div>
      <div class="summary-actions">
        <a class="btn btn-gold btn-md" href="menu.html">Back to Menu</a>
        ${localStorage.getItem(TOKEN_KEY) ? '<a class="btn btn-dark btn-md" href="account.html">View Account</a>' : '<a class="btn btn-dark btn-md" href="login.html">Log In</a>'}
      </div>`;
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (!orderId) {
      qs("#confirmation-title").textContent = "Order Not Found";
      qs("#confirmation-copy").textContent = "No order ID was provided.";
      return;
    }

    try {
      const order = await request(`/orders/${encodeURIComponent(orderId)}`);
      renderOrder(order);
    } catch (error) {
      qs("#confirmation-title").textContent = "Unable to Load Order";
      qs("#confirmation-copy").textContent = error.message || "Please contact Pasta House with your payment reference.";
    }
  });
})();
