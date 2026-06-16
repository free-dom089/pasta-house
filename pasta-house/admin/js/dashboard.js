const state = {
  admin: null,
  products: [],
  orders: [],
  customers: [],
  activeSection: "overview"
};

const money = (amount) => `\u20A6${Number(amount || 0).toLocaleString("en-NG")}`;
const formatDate = (value) => value ? new Date(value).toLocaleString("en-NG") : "-";

const notice = document.querySelector("#dashboard-notice");
const productModal = document.querySelector("#product-modal");
const productForm = document.querySelector("#product-form");
const availableInput = document.querySelector("#product-available");
const availableFromWrap = document.querySelector("#available-from-wrap");
const availableFromInput = document.querySelector("#product-available-from");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showNotice(message, type = "error") {
  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.hidden = false;
  window.setTimeout(() => { notice.hidden = true; }, 4500);
}

function protectPage() {
  if (!AdminAPI.getToken()) {
    window.location.href = "login.html";
  }
}

async function loadAdmin() {
  const admin = await AdminAPI.data("/admin/me");
  state.admin = admin;
  document.querySelector("#admin-name").textContent = admin.username || "Admin";
}

async function loadProducts() {
  state.products = await AdminAPI.data("/products");
  renderProducts();
  renderStats();
}

async function loadOrders() {
  state.orders = await AdminAPI.data("/orders");
  renderOrders();
  renderStats();
}

async function loadCustomers() {
  state.customers = await AdminAPI.data("/customers-list");
  renderCustomers();
  renderStats();
}

function renderStats() {
  document.querySelector("#stat-products").textContent = state.products.length;
  document.querySelector("#stat-available").textContent = state.products.filter((p) => p.available !== false).length;
  document.querySelector("#stat-orders").textContent = state.orders.length;
  document.querySelector("#stat-paid").textContent = state.orders.filter((o) => o.paymentStatus === "paid").length;
  document.querySelector("#stat-customers").textContent = state.customers.length;
}

function availabilityLabel(product) {
  if (product.available !== false) return "Available";
  if (product.availableFrom) return `Unavailable until ${formatDate(product.availableFrom)}`;
  return "Unavailable";
}

function renderProducts() {
  const tbody = document.querySelector("#products-table");
  if (!state.products.length) {
    tbody.innerHTML = '<tr><td colspan="5">No products yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.products.map((product) => `
    <tr>
      <td>
        <span class="row-title">${escapeHtml(product.name)}</span>
        <span class="row-sub">${escapeHtml(product.description || "")}</span>
      </td>
      <td>${escapeHtml(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>
        <span class="pill ${product.available !== false ? "available" : "unavailable"}">
          ${escapeHtml(availabilityLabel(product))}
        </span>
      </td>
      <td>
        <div class="action-row">
          <button class="tiny-btn" data-action="edit" data-id="${product._id}">Edit</button>
          <button class="tiny-btn" data-action="toggle" data-id="${product._id}">
            ${product.available !== false ? "Mark Off" : "Mark On"}
          </button>
          <button class="tiny-btn danger" data-action="delete" data-id="${product._id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function orderItemsLabel(order) {
  const items = (order.items || []).map((item) => `${escapeHtml(item.name)} x${item.quantity}`).join(", ");
  const extras = (order.extras || []).map((extra) => escapeHtml(extra.name)).join(", ");
  return [items, extras ? `Extras: ${extras}` : ""].filter(Boolean).join("<br>");
}

function renderOrders() {
  const tbody = document.querySelector("#orders-table");
  if (!state.orders.length) {
    tbody.innerHTML = '<tr><td colspan="6">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.orders.map((order) => {
    const customerName = order.customer?.name || order.customerName || order.guestName || "Guest";
    const phone = order.customer?.phone || order.guestPhone || "";
    const email = order.customer?.email || order.guestEmail || "";
    return `
      <tr>
        <td>
          <span class="row-title">${escapeHtml(customerName)}</span>
          <span class="row-sub">${escapeHtml(phone)}</span>
          <span class="row-sub">${escapeHtml(email)}</span>
          <span class="row-sub">${escapeHtml(order.deliveryAddress || "")}</span>
        </td>
        <td>${orderItemsLabel(order)}</td>
        <td>${money(order.totalAmount)}</td>
        <td>
          <span class="pill ${order.paymentStatus}">${order.paymentStatus}</span>
          <span class="row-sub">${escapeHtml(order.paystackReference || "")}</span>
        </td>
        <td>
          <select data-action="status" data-id="${order._id}">
            ${["new", "confirmed", "preparing", "out_for_delivery", "completed"].map((status) => `
              <option value="${status}" ${order.orderStatus === status ? "selected" : ""}>${status.replaceAll("_", " ")}</option>
            `).join("")}
          </select>
        </td>
        <td>${formatDate(order.createdAt)}</td>
      </tr>
    `;
  }).join("");
}

function renderCustomers() {
  const tbody = document.querySelector("#customers-table");
  if (!state.customers.length) {
    tbody.innerHTML = '<tr><td colspan="6">No registered customers yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.customers.map((customer) => `
    <tr>
      <td><span class="row-title">${escapeHtml(customer.name)}</span></td>
      <td>${escapeHtml(customer.email)}</td>
      <td>${escapeHtml(customer.phone || "-")}</td>
      <td>${escapeHtml(customer.savedAddress || "-")}</td>
      <td>${customer.orderCount || 0}</td>
      <td>${formatDate(customer.createdAt)}</td>
    </tr>
  `).join("");
}

function switchSection(section) {
  state.activeSection = section;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  document.querySelectorAll(".panel-section").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${section}-section`);
  });
  document.querySelector("#page-title").textContent =
    section === "overview" ? "Dashboard" : section[0].toUpperCase() + section.slice(1);

  if (section === "customers") loadCustomers();
}

function updateAvailabilityField() {
  const available = availableInput.checked;
  availableFromWrap.hidden = available;
  if (available) availableFromInput.value = "";
}

function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function openProductModal(product = null) {
  productForm.reset();
  document.querySelector("#product-modal-title").textContent = product ? "Edit Product" : "Add Product";
  document.querySelector("#product-id").value = product?._id || "";
  document.querySelector("#product-name").value = product?.name || "";
  document.querySelector("#product-category").value = product?.category || "Main Dishes";
  document.querySelector("#product-price").value = product?.price || "";
  document.querySelector("#product-image").value = product?.image || "assets/food-1.jpg";
  document.querySelector("#product-description").value = product?.description || "";
  availableInput.checked = product ? product.available !== false : true;
  availableFromInput.value = toLocalInputValue(product?.availableFrom);
  updateAvailabilityField();
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
}

function availableFromValue() {
  if (availableInput.checked) return null;
  if (!availableFromInput.value) return null;
  return new Date(availableFromInput.value).toISOString();
}

async function saveProduct(event) {
  event.preventDefault();
  const id = document.querySelector("#product-id").value;
  const body = {
    name: document.querySelector("#product-name").value.trim(),
    category: document.querySelector("#product-category").value.trim(),
    price: Number(document.querySelector("#product-price").value),
    image: document.querySelector("#product-image").value.trim(),
    description: document.querySelector("#product-description").value.trim(),
    available: availableInput.checked,
    availableFrom: availableFromValue()
  };

  try {
    await AdminAPI.data(id ? `/products/${id}` : "/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    closeProductModal();
    await loadProducts();
    showNotice("Product saved successfully.", "success");
  } catch (error) {
    showNotice(error.message || "Unable to save product.");
  }
}

async function handleProductAction(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;

  const product = state.products.find((item) => item._id === control.dataset.id);
  if (!product) return;

  if (control.dataset.action === "edit") {
    openProductModal(product);
    return;
  }

  if (control.dataset.action === "toggle") {
    try {
      await AdminAPI.data(`/products/${product._id}`, {
        method: "PUT",
        body: JSON.stringify({ available: product.available === false, availableFrom: null })
      });
      await loadProducts();
      showNotice("Availability updated.", "success");
    } catch (error) {
      showNotice(error.message || "Unable to update availability.");
    }
    return;
  }

  if (control.dataset.action === "delete") {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await AdminAPI.data(`/products/${product._id}`, { method: "DELETE" });
      await loadProducts();
      showNotice("Product deleted.", "success");
    } catch (error) {
      showNotice(error.message || "Unable to delete product.");
    }
  }
}

async function handleOrderStatus(event) {
  const select = event.target.closest('select[data-action="status"]');
  if (!select) return;

  try {
    await AdminAPI.data(`/orders/${select.dataset.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ orderStatus: select.value })
    });
    await loadOrders();
    showNotice("Order status updated.", "success");
  } catch (error) {
    showNotice(error.message || "Unable to update order.");
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.section));
  });
  document.querySelector("#logout-btn").addEventListener("click", () => {
    AdminAPI.clearToken();
    window.location.href = "login.html";
  });
  document.querySelector("#new-product-btn").addEventListener("click", () => openProductModal());
  document.querySelector("#close-product-modal").addEventListener("click", closeProductModal);
  document.querySelector("#cancel-product-btn").addEventListener("click", closeProductModal);
  productForm.addEventListener("submit", saveProduct);
  availableInput.addEventListener("change", updateAvailabilityField);
  document.querySelector("#products-table").addEventListener("click", handleProductAction);
  document.querySelector("#orders-table").addEventListener("change", handleOrderStatus);
  document.querySelector("#refresh-orders-btn").addEventListener("click", loadOrders);
  document.querySelector("#refresh-customers-btn").addEventListener("click", loadCustomers);
}

document.addEventListener("DOMContentLoaded", async () => {
  protectPage();
  bindEvents();

  try {
    await Promise.all([loadAdmin(), loadProducts(), loadOrders(), loadCustomers()]);
  } catch (error) {
    showNotice(error.message || "Unable to load dashboard.");
  }
});
