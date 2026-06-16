/* ============================================================
   PASTA HOUSE - API-backed frontend
   ============================================================ */

"use strict";

const CONFIG = {
  API_BASE: window.PH_CONFIG?.API_BASE || "http://localhost:5000/api",
  PAYSTACK_PUBLIC_KEY: window.PH_CONFIG?.PAYSTACK_PUBLIC_KEY || "",
  WA_NUMBER: window.PH_CONFIG?.WHATSAPP_NUMBER || "2348149589934"
};

const TOKEN_KEY = "ph_customer_token";

const ICONS = {
  whatsapp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.553 4.118 1.522 5.852L0 24l6.335-1.496A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.663-.487-5.21-1.34l-.374-.221-3.758.887.938-3.648-.244-.388A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>',
  zoom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

let MENU = [];
let EXTRAS = [];

const state = {
  currentOrder: { item: null, qty: 1, extras: [] },
  customer: null,
  lastOrder: null
};

const qs = (sel, ctx) => (ctx || document).querySelector(sel);
const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

function formatPrice(n) {
  return "\u20A6" + Number(n || 0).toLocaleString("en-NG");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function imageSrc(image) {
  if (!image) return "assets/logo.png";
  if (/^https?:\/\//i.test(image) || image.startsWith("assets/")) return image;
  return `assets/${image}`;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${CONFIG.API_BASE}${path}`, {
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

  return payload.data;
}

function normalizeProduct(product) {
  return {
    id: product._id || product.id,
    name: product.name,
    category: product.category || "",
    desc: product.description || "",
    price: Number(product.price || 0),
    img: imageSrc(product.image),
    available: product.available !== false,
    availableFrom: product.availableFrom || null
  };
}

async function loadProducts() {
  if (!qs("#menu-cards-grid") && !qs("#featured-cards-grid") && !qs("#extras-chips-grid") && !qs("#order-extras-grid")) {
    return;
  }

  await apiRequest("/products").then((products) => {
    const list = products.map(normalizeProduct);
    MENU = list.filter((product) => product.category.toLowerCase() !== "extras");
    EXTRAS = list.filter((product) => product.category.toLowerCase() === "extras");
  });
}

function showToast(msg, type) {
  try {
    const old = qs("#pasta-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.id = "pasta-toast";
    toast.className = "toast" + (type ? " " + type : "");
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("visible"));
    });
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    }, 3200);
  } catch (error) {
    console.warn(error);
  }
}

function ordinal(number) {
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return `${number}st`;
  if (mod10 === 2 && mod100 !== 12) return `${number}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${number}rd`;
  return `${number}th`;
}

function formatAvailableDate(value) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  const weekday = date.toLocaleDateString("en-NG", { weekday: "short" });
  const month = date.toLocaleDateString("en-NG", { month: "long" });
  const time = date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).replace(" ", "").toLowerCase();
  return `Available from ${weekday} ${ordinal(date.getDate())} ${month}, ${time}`;
}

function unavailableBadge(item) {
  if (item.available) return "";
  return `<div class="unavailable-badge">${escapeHtml(formatAvailableDate(item.availableFrom))}</div>`;
}

function orderButton(item) {
  if (!item.available) {
    return '<button class="btn btn-unavailable btn-sm" type="button" disabled>Unavailable</button>';
  }
  return `<button class="btn btn-gold btn-sm" data-order-item="${escapeHtml(item.id)}">Order Now</button>`;
}

function renderOrderExtras() {
  const container = qs("#order-extras-grid");
  if (!container) return;

  if (!EXTRAS.length) {
    container.innerHTML = '<p class="form-helper">No extras are available right now.</p>';
    return;
  }

  container.innerHTML = EXTRAS.map((extra) => {
    const unavailable = extra.available ? "" : " unavailable";
    const disabled = extra.available ? "" : " aria-disabled=\"true\"";
    return `<div class="modal-extra-item${unavailable}" data-extra-id="${escapeHtml(extra.id)}"${disabled}>
      <span>${escapeHtml(extra.name)}</span>
      <strong>${formatPrice(extra.price)}</strong>
    </div>`;
  }).join("");
}

function renderMenuRowCards() {
  const grid = qs("#menu-cards-grid");
  if (!grid) return;

  grid.classList.remove("menu-cards-grid");
  grid.classList.add("menu-row-list");

  if (!MENU.length) {
    grid.innerHTML = '<p class="section-sub">Menu is currently unavailable. Please check again shortly.</p>';
    return;
  }

  grid.innerHTML = MENU.map((item) => {
    const unavailable = item.available ? "" : " unavailable";
    return `<div class="menu-row-card${unavailable}">
      <div class="menu-row-thumb" data-lightbox-src="${escapeHtml(item.img)}" data-lightbox-alt="${escapeHtml(item.name)}" title="Click to preview" role="button" tabindex="0" aria-label="Preview ${escapeHtml(item.name)}">
        <img class="menu-row-thumb-img" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <div class="thumb-zoom-hint">${ICONS.zoom}</div>
        ${unavailableBadge(item)}
      </div>
      <div class="menu-row-body">
        <div class="menu-row-info">
          <div class="menu-row-title">${escapeHtml(item.name)}</div>
          <div class="menu-row-desc">${escapeHtml(item.desc)}</div>
        </div>
        <div class="menu-row-actions">
          <div class="menu-row-price">${formatPrice(item.price)}</div>
          ${orderButton(item)}
        </div>
      </div>
    </div>`;
  }).join("");

  bindLightboxTriggers(grid);
  initReveal();
}

function renderFeaturedCards() {
  const grid = qs("#featured-cards-grid");
  if (!grid) return;

  if (!MENU.length) {
    grid.innerHTML = '<p class="section-sub">Menu is currently unavailable. Please check again shortly.</p>';
    return;
  }

  grid.innerHTML = MENU.slice(0, 4).map((item) => {
    const unavailable = item.available ? "" : " unavailable";
    return `<div class="food-card${unavailable}">
      <div class="food-card-img">
        <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <div class="food-card-badge">${formatPrice(item.price)}</div>
        ${unavailableBadge(item)}
      </div>
      <div class="food-card-body">
        <div class="food-card-title">${escapeHtml(item.name)}</div>
        <p class="food-card-desc">${escapeHtml(item.desc)}</p>
        <div class="food-card-footer">
          <div class="food-card-price">${formatPrice(item.price)}</div>
          ${orderButton(item)}
        </div>
      </div>
    </div>`;
  }).join("");

  initReveal();
}

function renderExtrasChips() {
  const grid = qs("#extras-chips-grid");
  if (!grid) return;

  if (!EXTRAS.length) {
    grid.innerHTML = '<p class="section-sub">No extras are available right now.</p>';
    return;
  }

  grid.innerHTML = EXTRAS.map((extra) => {
    const unavailable = extra.available ? "" : " unavailable";
    return `<div class="extra-chip${unavailable}" data-extra-name="${escapeHtml(extra.name)}">
      ${!extra.available ? unavailableBadge(extra) : ""}
      <div class="extra-chip-name">${escapeHtml(extra.name)}</div>
      <div class="extra-chip-price">${formatPrice(extra.price)}</div>
    </div>`;
  }).join("");

  grid.addEventListener("click", (event) => {
    const chip = event.target.closest(".extra-chip");
    if (!chip || chip.classList.contains("unavailable")) return;
    if (window._openWAModal) {
      window._openWAModal(chip.dataset.extraName || "");
    }
  });

  initReveal();
}

function initNavbar() {
  const navbar = qs(".navbar");
  if (!navbar) return;

  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const path = location.pathname.split("/").pop() || "index.html";
  qsa(".nav-links a, .mobile-nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  const hamburger = qs(".hamburger");
  const mobileMenu = qs("#mobile-menu");
  const closeBtn = qs("#mobile-menu-close");
  const backdrop = qs("#mobile-backdrop");
  if (!hamburger || !mobileMenu) return;

  const openMenu = () => {
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    if (backdrop) {
      backdrop.style.display = "block";
      requestAnimationFrame(() => backdrop.classList.add("visible"));
    }
  };

  const closeMenu = () => {
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (backdrop) {
      backdrop.classList.remove("visible");
      setTimeout(() => {
        if (!backdrop.classList.contains("visible")) backdrop.style.display = "none";
      }, 500);
    }
  };

  hamburger.addEventListener("click", () => {
    if (mobileMenu.classList.contains("open")) closeMenu();
    else openMenu();
  });
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (backdrop) backdrop.addEventListener("click", closeMenu);
  qsa(".mobile-nav-links a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("open")) closeMenu();
  });
}

function initReveal() {
  const items = qsa(".reveal, .reveal-left, .reveal-right, .reveal-scale");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  items.forEach((item) => {
    if (!item.classList.contains("visible")) observer.observe(item);
  });
}

function initParallax() {
  const hero = qs(".hero-bg");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("scroll", () => {
    hero.style.transform = `translateY(${window.scrollY * 0.2}px)`;
  }, { passive: true });
}

function initHeroParallax() {
  const heroImg = qs(".hero-img-frame img");
  if (!heroImg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY < window.innerHeight) {
      heroImg.style.transform = `translateY(${window.scrollY * 0.07}px)`;
    }
  }, { passive: true });
}

function initCounters() {
  const counters = qsa("[data-count]");
  if (!counters.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      let current = 0;
      const step = Math.ceil(target / 50);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString() + suffix;
        if (current >= target) clearInterval(timer);
      }, 28);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));
}

function initWAModal() {
  const overlay = qs("#wa-modal-overlay");
  if (!overlay) return;

  const form = qs("#wa-form");
  const closeBtn = overlay.querySelector(".modal-close");

  const openWA = (prefilledOrder) => {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    const orderField = overlay.querySelector('[name="order"]');
    if (orderField && prefilledOrder) orderField.value = prefilledOrder;
    const firstInput = overlay.querySelector("input");
    if (firstInput) setTimeout(() => firstInput.focus(), 120);
  };

  const closeWA = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  window._openWAModal = openWA;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-wa-trigger]");
    if (trigger && !trigger.closest("#order-modal-overlay")) {
      event.preventDefault();
      openWA();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeWA);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeWA();
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.querySelector('[name="name"]')?.value.trim();
      const phone = form.querySelector('[name="phone"]')?.value.trim();
      const address = form.querySelector('[name="address"]')?.value.trim();
      const order = form.querySelector('[name="order"]')?.value.trim();

      if (!name || !phone || !address || !order) {
        showToast("Please fill in all fields", "error");
        return;
      }

      const message = [
        "*Pasta House Order*",
        "",
        `*Name:* ${name}`,
        `*Phone:* ${phone}`,
        `*Address:* ${address}`,
        `*Order:* ${order}`,
        "",
        "_Sent from Pasta House website_"
      ].join("\n");

      window.open(`https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
      closeWA();
      form.reset();
    });
  }
}

function updateTotal() {
  const item = state.currentOrder.item;
  const qty = state.currentOrder.qty;
  const basePrice = item ? item.price : 0;
  const extraTotal = state.currentOrder.extras.reduce((sum, id) => {
    const extra = EXTRAS.find((candidate) => String(candidate.id) === String(id));
    return sum + (extra ? extra.price : 0);
  }, 0);
  const total = (basePrice + extraTotal) * qty;
  const orderTotal = qs("#order-total");
  if (orderTotal) orderTotal.textContent = formatPrice(total);
  return total;
}

function prefillCustomerDetails() {
  if (!state.customer) return;
  const name = qs("#c-name");
  const email = qs("#c-email");
  const phone = qs("#c-phone");
  const address = qs("#c-address");
  if (name) name.value = state.customer.name || "";
  if (email) email.value = state.customer.email || "";
  if (phone) phone.value = state.customer.phone || "";
  if (address) address.value = state.customer.savedAddress || "";
}

function openOrder(itemId) {
  const item = MENU.find((candidate) => String(candidate.id) === String(itemId));
  if (!item) return;
  if (!item.available) {
    showToast("This item is currently unavailable", "error");
    return;
  }

  const overlay = qs("#order-modal-overlay");
  if (!overlay) return;

  state.currentOrder = { item, qty: 1, extras: [] };
  state.lastOrder = null;

  const dishImg = overlay.querySelector(".order-dish-img");
  const dishName = overlay.querySelector(".order-dish-name");
  const dishBasePrice = overlay.querySelector(".order-dish-base-price");
  const qtyDisplay = qs("#order-qty-display");
  const orderMain = qs("#order-main");
  const payStatus = qs("#payment-status");

  if (dishImg) {
    dishImg.src = item.img;
    dishImg.alt = item.name;
  }
  if (dishName) dishName.textContent = item.name;
  if (dishBasePrice) dishBasePrice.textContent = formatPrice(item.price);
  if (qtyDisplay) qtyDisplay.textContent = "1";

  qsa(".modal-extra-item").forEach((extra) => extra.classList.remove("selected"));
  if (orderMain) orderMain.style.display = "";
  if (payStatus) payStatus.classList.remove("visible");

  prefillCustomerDetails();
  updateTotal();

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeOrder() {
  const overlay = qs("#order-modal-overlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function selectedExtrasPayload(qty) {
  const payload = [];
  state.currentOrder.extras.forEach((id) => {
    for (let index = 0; index < qty; index += 1) {
      payload.push({ product: id });
    }
  });
  return payload;
}

function selectedExtrasText() {
  return state.currentOrder.extras
    .map((id) => EXTRAS.find((extra) => String(extra.id) === String(id))?.name)
    .filter(Boolean)
    .join(", ");
}

async function createOrder() {
  const item = state.currentOrder.item;
  const qty = state.currentOrder.qty;
  const guestName = qs("#c-name")?.value.trim();
  const guestEmail = qs("#c-email")?.value.trim();
  const guestPhone = qs("#c-phone")?.value.trim();
  const deliveryAddress = qs("#c-address")?.value.trim();

  if (!guestName || !guestEmail || !guestPhone || !deliveryAddress) {
    throw new Error("Please fill in your name, email, phone, and delivery address");
  }

  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      items: [{ product: item.id, quantity: qty }],
      extras: selectedExtrasPayload(qty),
      guestName,
      guestEmail,
      guestPhone,
      deliveryAddress,
      totalAmount: updateTotal()
    })
  });
}

async function initializePayment(order) {
  return apiRequest("/payments/initialize", {
    method: "POST",
    body: JSON.stringify({
      orderId: order._id,
      email: order.guestEmail,
      amount: order.totalAmount
    })
  });
}

async function verifyPayment(reference) {
  return apiRequest(`/payments/verify/${encodeURIComponent(reference)}`);
}

function buildWhatsAppSummary(paymentStatus) {
  const item = state.currentOrder.item;
  const qty = state.currentOrder.qty;
  const name = qs("#c-name")?.value.trim() || "-";
  const email = qs("#c-email")?.value.trim() || "-";
  const phone = qs("#c-phone")?.value.trim() || "-";
  const address = qs("#c-address")?.value.trim() || "-";
  const extras = selectedExtrasText();
  const orderId = state.lastOrder?.id ? `\n*Order ID:* ${state.lastOrder.id}` : "";

  return [
    "*Pasta House Order*",
    "",
    `*Name:* ${name}`,
    `*Email:* ${email}`,
    `*Phone:* ${phone}`,
    `*Address:* ${address}`,
    `*Order:* ${item?.name || "Selected item"} x${qty}`,
    extras ? `*Extras:* ${extras}` : "",
    `*Total:* ${formatPrice(updateTotal())}`,
    `*Payment:* ${paymentStatus}${orderId}`,
    "",
    "_Sent from Pasta House website_"
  ].filter(Boolean).join("\n");
}

function showPaymentStatus(status, message) {
  const payStatus = qs("#payment-status");
  const orderMain = qs("#order-main");
  if (!payStatus) return;

  if (orderMain) orderMain.style.display = "none";
  payStatus.classList.add("visible");

  const icon = payStatus.querySelector(".payment-status-icon");
  const title = payStatus.querySelector(".payment-status-title");
  const desc = payStatus.querySelector(".payment-status-desc");
  const waBtn = payStatus.querySelector(".payment-wa-btn");

  if (icon) {
    icon.innerHTML = status === "success"
      ? '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>'
      : '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  }
  if (title) title.textContent = status === "success" ? "Payment Successful" : "Continue on WhatsApp";
  if (desc) desc.textContent = message || "We could not complete online checkout. Continue on WhatsApp and we will help confirm your order.";
  if (waBtn) {
    waBtn.href = `https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(buildWhatsAppSummary(status === "success" ? "Paid online" : "Pending"))}`;
  }
}

function openPaystack(payment) {
  return new Promise((resolve, reject) => {
    const Inline = window.Paystack || window.PaystackPop;

    const callbacks = {
      onSuccess: (response) => resolve(response || { reference: payment.reference }),
      onCancel: () => reject(new Error("Payment cancelled")),
      onError: () => reject(new Error("Payment failed"))
    };

    try {
      if (Inline && typeof Inline === "function") {
        const popup = new Inline();
        if (typeof popup.resumeTransaction === "function") {
          popup.resumeTransaction(payment.accessCode, callbacks);
          return;
        }
      }

      if (Inline && typeof Inline.resumeTransaction === "function") {
        Inline.resumeTransaction(payment.accessCode, callbacks);
        return;
      }

      if (window.PaystackPop && typeof window.PaystackPop.setup === "function") {
        const handler = window.PaystackPop.setup({
          key: payment.publicKey || CONFIG.PAYSTACK_PUBLIC_KEY,
          email: qs("#c-email")?.value.trim(),
          amount: Number(payment.amount || updateTotal()) * 100,
          currency: payment.currency || "NGN",
          ref: payment.reference,
          callback: (response) => resolve(response || { reference: payment.reference }),
          onClose: () => reject(new Error("Payment cancelled"))
        });
        handler.openIframe();
        return;
      }

      if (payment.authorizationUrl) {
        window.open(payment.authorizationUrl, "_blank");
        reject(new Error("Payment opened in a new tab. Verify from Paystack and refresh confirmation."));
        return;
      }
    } catch (error) {
      reject(error);
      return;
    }

    reject(new Error("Payment gateway unavailable"));
  });
}

async function payNow() {
  const payBtn = qs("#pay-btn");
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.classList.add("is-loading");
  }

  try {
    showToast("Preparing checkout...", "success");
    const order = await createOrder();
    const payment = await initializePayment(order);
    state.lastOrder = { id: order._id, reference: payment.reference };

    const response = await openPaystack(payment);
    const reference = response.reference || payment.reference;
    const verification = await verifyPayment(reference);

    if (verification.paymentStatus !== "success") {
      throw new Error("Payment could not be verified");
    }

    window.location.href = `order-confirmation.html?orderId=${encodeURIComponent(order._id)}`;
  } catch (error) {
    showToast(error.message || "Unable to complete checkout", "error");
    showPaymentStatus("pending", "Online checkout did not complete. You can continue on WhatsApp with this order summary.");
  } finally {
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.classList.remove("is-loading");
    }
  }
}

function initOrderModal() {
  const overlay = qs("#order-modal-overlay");
  if (!overlay) return;

  window.openOrderModal = openOrder;

  const closeBtn = overlay.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeOrder);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOrder();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("open")) closeOrder();
  });

  const qtyDisplay = qs("#order-qty-display");
  const qtyMinus = qs("#qty-minus");
  const qtyPlus = qs("#qty-plus");
  const extrasGrid = qs("#order-extras-grid");
  const payBtn = qs("#pay-btn");

  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      if (state.currentOrder.qty > 1) {
        state.currentOrder.qty -= 1;
        if (qtyDisplay) qtyDisplay.textContent = String(state.currentOrder.qty);
        updateTotal();
      }
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      if (state.currentOrder.qty < 10) {
        state.currentOrder.qty += 1;
        if (qtyDisplay) qtyDisplay.textContent = String(state.currentOrder.qty);
        updateTotal();
      }
    });
  }

  if (extrasGrid) {
    extrasGrid.addEventListener("click", (event) => {
      const item = event.target.closest(".modal-extra-item");
      if (!item || item.classList.contains("unavailable")) return;
      const id = item.dataset.extraId;
      if (state.currentOrder.extras.includes(id)) {
        state.currentOrder.extras = state.currentOrder.extras.filter((extraId) => extraId !== id);
        item.classList.remove("selected");
      } else {
        state.currentOrder.extras.push(id);
        item.classList.add("selected");
      }
      updateTotal();
    });
  }

  if (payBtn) payBtn.addEventListener("click", payNow);
}

function initOrderButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-order-item]");
    if (!btn) return;
    event.preventDefault();
    openOrder(btn.dataset.orderItem);
  });
}

function initLightbox() {
  if (qs("#lightbox-overlay")) return;
  const lightbox = document.createElement("div");
  lightbox.id = "lightbox-overlay";
  lightbox.className = "lightbox-overlay";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image preview");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `<img class="lightbox-img" id="lightbox-img" src="" alt="" />
    <button class="lightbox-close" id="lightbox-close" aria-label="Close">${ICONS.close}</button>`;
  document.body.appendChild(lightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".lightbox-close")) {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
    }
  });
}

function openLightbox(src, alt) {
  initLightbox();
  const overlay = qs("#lightbox-overlay");
  const img = qs("#lightbox-img");
  if (!overlay || !img) return;
  img.src = src;
  img.alt = alt || "";
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
}

function bindLightboxTriggers(ctx) {
  qsa(".menu-row-thumb, [data-lightbox-src]", ctx || document).forEach((thumb) => {
    thumb.addEventListener("click", () => openLightbox(thumb.dataset.lightboxSrc, thumb.dataset.lightboxAlt));
    thumb.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(thumb.dataset.lightboxSrc, thumb.dataset.lightboxAlt);
      }
    });
  });
}

function initGallery() {
  const track = qs(".gallery-track");
  if (!track) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  track.style.animationPlayState = "running";
}

function initMenuTabs() {
  const tabs = qsa(".tab-btn");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((button) => {
        button.classList.toggle("active", button === tab);
        button.setAttribute("aria-selected", button === tab ? "true" : "false");
      });
      qsa("[data-tab-content]").forEach((section) => {
        section.style.display = section.dataset.tabContent === target ? "" : "none";
      });
    });
  });
}

function initSmoothScroll() {
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = qs(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

async function loadCustomer() {
  if (!getToken()) return;
  try {
    state.customer = await apiRequest("/customers/me");
  } catch (error) {
    state.customer = null;
    clearToken();
  }
}

function renderAuthNav() {
  const desktop = qs(".nav-cta");
  const mobileLinks = qs(".mobile-nav-links");
  if (!desktop && !mobileLinks) return;

  qsa(".ph-auth-nav").forEach((node) => node.remove());
  qsa(".ph-auth-mobile").forEach((node) => node.remove());

  const logout = () => {
    clearToken();
    state.customer = null;
    renderAuthNav();
    showToast("Logged out", "success");
  };

  if (desktop) {
    const wrapper = document.createElement("div");
    wrapper.className = "ph-auth-nav";
    if (state.customer) {
      wrapper.innerHTML = `<a class="auth-pill" href="account.html">${escapeHtml(state.customer.name || "Account")}</a>
        <button class="auth-logout" type="button">Logout</button>`;
      wrapper.querySelector(".auth-logout").addEventListener("click", logout);
    } else {
      wrapper.innerHTML = '<a class="auth-link" href="login.html">Login</a><a class="auth-pill" href="signup.html">Sign Up</a>';
    }
    desktop.appendChild(wrapper);
  }

  if (mobileLinks) {
    const account = document.createElement("li");
    account.className = "ph-auth-mobile";
    if (state.customer) {
      account.innerHTML = '<a href="account.html">Account</a>';
      const logoutItem = document.createElement("li");
      logoutItem.className = "ph-auth-mobile";
      logoutItem.innerHTML = '<a href="#">Logout</a>';
      logoutItem.querySelector("a").addEventListener("click", (event) => {
        event.preventDefault();
        logout();
      });
      mobileLinks.append(account, logoutItem);
    } else {
      account.innerHTML = '<a href="login.html">Login / Signup</a>';
      mobileLinks.appendChild(account);
    }
  }
}

window.PH = {
  apiRequest,
  getToken,
  setToken,
  clearToken,
  formatPrice,
  showToast
};

document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initReveal();
  initParallax();
  initHeroParallax();
  initCounters();
  initWAModal();
  initLightbox();
  initGallery();
  initMenuTabs();
  initSmoothScroll();
  initOrderModal();
  initOrderButtons();

  await loadCustomer();
  renderAuthNav();

  try {
    await loadProducts();
    renderOrderExtras();
    renderFeaturedCards();
    renderMenuRowCards();
    renderExtrasChips();
  } catch (error) {
    console.error(error);
    renderAuthNav();
    const message = "Menu is currently unavailable. Please refresh or try again shortly.";
    [qs("#featured-cards-grid"), qs("#menu-cards-grid"), qs("#extras-chips-grid")].forEach((container) => {
      if (container) container.innerHTML = `<p class="section-sub">${message}</p>`;
    });
    showToast(message, "error");
  }
});
