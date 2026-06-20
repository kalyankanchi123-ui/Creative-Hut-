/* =========================================================
   Creative Hut — candle.js
   ========================================================= */

const CONFIG = {
  email: "info@creativehut.com",
  currency: "$",
  businessName: "Creative Hut",
  web3formsKey: "4a110cb9-93be-4696-89ea-b16f0b8cca06",
};

/* 4 Flavours × 3 Models × 2 Sizes = 24 products
   Each flavour has an `images` array — exactly 3 photos shown in a swipeable
   mini-carousel on the product card. Replace the placeholder filenames with
   real photos for that flavour. */
const FLAVOURS = [
  {
    id: "lemon",
    name: "Lemon",
    scent: "Fresh lemon, zesty citrus, clean air",
    images: ["Lemon 1.png", "Lemon 2.png"],
    color: ["#e8a0b0", "#c0607a"],
    models: ["Classic", "Bloom", "Deluxe"],
    sizes: [
      { label: "Small", price: 6 },
      { label: "Large", price: 12 },
    ],
  },
  {
    id: "pink hawaiian",
    name: "Pink Hawaiian",
    scent: "Tropical pineapple, sweet coconut, floral notes",
    images: ["Pink Hawaiian 1.jpeg", "Pink Hawaiian 2.jpeg"],
    color: ["#e8d09a", "#b8903a"],
    models: ["Classic", "Bloom", "Deluxe"],
    sizes: [
      { label: "Small", price: 6 },
      { label: "Large", price: 12 },
    ],
  },
  {
    id: "sandalwood rose",
    name: "Sandalwood Rose",
    scent: "Warm sandalwood, delicate rose, soft musk",
    images: ["Sandalwood 1.png", "Sandalwood 2.png"],
    color: ["#90cce0", "#3a7a9a"],
    models: ["Classic", "Bloom", "Deluxe"],
    sizes: [
      { label: "Small", price: 6 },
      { label: "Large", price: 12 },
    ],
  },
  {
    id: "vanilla",
    name: "Vanilla",
    scent: "Warm vanilla, caramel, soft sandalwood",
    images: ["Vanilla 1.jpeg", "Vanilla 2.jpeg"],
    color: ["#b09070", "#6a4828"],
    models: ["Classic", "Bloom", "Deluxe"],
    sizes: [
      { label: "Small", price: 6 },
      { label: "Large", price: 12 },
    ],
  },
];

const fmt = (n) => `${CONFIG.currency}${n}`;
const order = new Map();

/* ---------- Coupon config ---------- */
const COUPONS = {
  "3FOR15": {
    description: "3 for $15",
    // Every group of 3 small ($6) candles → $15 instead of $18 → save $3 per group
    apply: () => {
      const smallCount = countSmallCandles();
      const groups = Math.floor(smallCount / 3);
      return groups * 3;
    },
  },
};

let appliedCoupon = null; // { code, description, savings } or null

function countSmallCandles() {
  let c = 0;
  order.forEach((e) => { if (e.product.price === 6) c += e.qty; });
  return c;
}

/* ---------- Render product cards ---------- */
const grid = document.getElementById("productGrid");

function renderProducts() {
  let html = "";

  FLAVOURS.forEach((flavour) => {
    const cardId = `${flavour.id}-0`;
    const defaultSize = flavour.sizes[0];

    html += `<div class="flavour-section flavour-section--single">
      <article class="product-card" data-flavour="${escapeHtml(flavour.id)}" data-model="0">
        <div class="product-swatch has-photo product-carousel" data-carousel="${cardId}">
          <div class="carousel-track">
            ${flavour.images.map((img, ii) => `
              <img class="product-photo carousel-slide ${ii === 0 ? "active" : ""}" data-index="${ii}" src="${escapeHtml(img)}" alt="${escapeHtml(flavour.name)} candle photo ${ii + 1}" loading="lazy" />
            `).join("")}
          </div>
          ${flavour.images.length > 1 ? `
            <button class="carousel-arrow carousel-prev" type="button" aria-label="Previous photo">&#8592;</button>
            <button class="carousel-arrow carousel-next" type="button" aria-label="Next photo">&#8594;</button>
            <div class="carousel-dots">
              ${flavour.images.map((_, ii) => `<span class="carousel-dot ${ii === 0 ? "active" : ""}" data-index="${ii}"></span>`).join("")}
            </div>
          ` : ""}
        </div>
        <div class="product-body">
          <h4 class="product-name">${escapeHtml(flavour.name)}</h4>
          <p class="product-scent">${escapeHtml(flavour.scent)}</p>
          <div class="size-selector" data-card="${cardId}">
            ${flavour.sizes.map((s, si) => `
              <label class="size-option ${si === 0 ? "selected" : ""}">
                <input type="radio" name="size-${cardId}" value="${si}" ${si === 0 ? "checked" : ""} />
                <span>${escapeHtml(s.label)}</span>
                <span class="size-price">${fmt(s.price)}</span>
              </label>
            `).join("")}
          </div>
          <div class="product-foot">
            <span class="product-price" id="price-${cardId}">${fmt(defaultSize.price)}</span>
            <button class="add-btn" data-card="${cardId}" data-flavour="${escapeHtml(flavour.id)}" data-model="0" data-size="0">Add to order</button>
          </div>
        </div>
      </article>
    </div>`;
  });

  grid.innerHTML = html;

  // Image carousels
  grid.querySelectorAll(".product-carousel").forEach((carousel) => {
    const slides = carousel.querySelectorAll(".carousel-slide");
    const dots = carousel.querySelectorAll(".carousel-dot");
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    if (slides.length <= 1) return;

    let current = 0;
    const goTo = (idx) => {
      current = (idx + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      dots.forEach((d, i) => d.classList.toggle("active", i === current));
    };

    prevBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); goTo(current - 1); });
    nextBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); goTo(current + 1); });
    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        goTo(Number(dot.dataset.index));
      });
    });

    // Swipe support
    let touchStartX = 0;
    carousel.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 40) goTo(current - 1);
      else if (dx < -40) goTo(current + 1);
    }, { passive: true });
  });

  // Size selector interactions
  grid.querySelectorAll(".size-selector").forEach((selector) => {
    const cardId = selector.dataset.card;
    const radios = selector.querySelectorAll("input[type=radio]");
    const priceEl = document.getElementById(`price-${cardId}`);
    const addBtn = grid.querySelector(`.add-btn[data-card="${cardId}"]`);

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        selector.querySelectorAll(".size-option").forEach((opt) => opt.classList.remove("selected"));
        radio.closest(".size-option").classList.add("selected");

        const flavourId = addBtn.dataset.flavour;
        const flavour = FLAVOURS.find((f) => f.id === flavourId);
        const sizeIdx = Number(radio.value);
        priceEl.textContent = fmt(flavour.sizes[sizeIdx].price);
        addBtn.dataset.size = sizeIdx;
      });
    });
  });

  // Add-to-order buttons
  grid.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flavour = FLAVOURS.find((f) => f.id === btn.dataset.flavour);
      const size = flavour.sizes[Number(btn.dataset.size)];
      const product = {
        name: `${flavour.name} (${size.label})`,
        scent: flavour.scent,
        price: size.price,
      };
      addToOrder(product);
      btn.classList.add("added");
      btn.textContent = "Added ✓";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.textContent = "Add to order";
      }, 1100);
      trayToggle.classList.remove("nudge");
      void trayToggle.offsetWidth;
      trayToggle.classList.add("nudge");
    });
  });
}

/* ---------- Order logic ---------- */
function addToOrder(product) {
  const entry = order.get(product.name);
  if (entry) entry.qty += 1;
  else order.set(product.name, { product, qty: 1 });
  updateUI();
}

function changeQty(name, delta) {
  const entry = order.get(name);
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) order.delete(name);
  if (window._revalidateCoupon) window._revalidateCoupon();
  updateUI();
}

function orderCount() {
  let c = 0;
  order.forEach((e) => (c += e.qty));
  return c;
}

function orderSubtotal() {
  let t = 0;
  order.forEach((e) => (t += e.qty * e.product.price));
  return t;
}

function couponSavings() {
  if (!appliedCoupon) return 0;
  return COUPONS[appliedCoupon.code].apply();
}

function orderTotal() {
  return Math.max(0, orderSubtotal() - couponSavings());
}

/* ---------- Update everything on screen ---------- */
const trayItems = document.getElementById("trayItems");
const trayTotalEl = document.getElementById("trayTotal");
const countTop = document.getElementById("orderCountTop");
const sendEmailBtn = document.getElementById("sendEmail");

function updateUI() {
  const count = orderCount();
  countTop.textContent = count;

  if (order.size === 0) {
    trayItems.innerHTML = `<p class="tray-empty">Nothing added yet. Tap "Add to order" on a candle to start.</p>`;
    sendEmailBtn.disabled = true;
  } else {
    trayItems.innerHTML = "";
    order.forEach((e) => {
      const row = document.createElement("div");
      row.className = "tray-row";
      row.innerHTML = `
        <div class="tray-row-info">
          <div class="tray-row-name">${escapeHtml(e.product.name)}</div>
          <div class="tray-row-scent">${escapeHtml(e.product.scent)}</div>
        </div>
        <div class="qty">
          <button aria-label="Remove one">−</button>
          <span>${e.qty}</span>
          <button aria-label="Add one">+</button>
        </div>
        <div class="tray-row-price">${fmt(e.qty * e.product.price)}</div>
      `;
      const [minus, plus] = row.querySelectorAll(".qty button");
      minus.addEventListener("click", () => changeQty(e.product.name, -1));
      plus.addEventListener("click", () => changeQty(e.product.name, +1));
      trayItems.appendChild(row);
    });
    sendEmailBtn.disabled = false;
  }

  // Update total / subtotal / discount display
  const subtotal = orderSubtotal();
  const savings  = couponSavings();
  const total    = orderTotal();

  const subtotalRow   = document.getElementById("traySubtotalRow");
  const discountRow   = document.getElementById("trayDiscountRow");
  const subtotalEl    = document.getElementById("traySubtotal");
  const discountEl    = document.getElementById("trayDiscount");
  const couponBadgeEl = document.getElementById("couponBadge");

  if (appliedCoupon && savings > 0) {
    subtotalRow.style.display   = "flex";
    discountRow.style.display   = "flex";
    subtotalEl.textContent      = fmt(subtotal);
    discountEl.textContent      = "−" + fmt(savings);
    couponBadgeEl.textContent   = appliedCoupon.code;
  } else {
    subtotalRow.style.display = "none";
    discountRow.style.display = "none";
  }

  trayTotalEl.textContent = fmt(total);
}

/* ---------- Build the order message ---------- */
function buildMessage() {
  const lines = [`Hi ${CONFIG.businessName}! I'd like to order:`, ""];
  order.forEach((e) => {
    lines.push(`• ${e.qty} × ${e.product.name} — ${fmt(e.qty * e.product.price)}`);
  });
  lines.push("", `Estimated total: ${fmt(orderTotal())}`, "", "My name: ____", "Pickup or delivery? ____");
  return lines.join("\n");
}

/* ---------- Send order by email ---------- */
sendEmailBtn.addEventListener("click", () => {
  const summary = document.getElementById("orderSummary");
  let lines = "<strong>Your order:</strong><br>";
  order.forEach((e) => {
    lines += `${escapeHtml(e.qty + " × " + e.product.name)} — ${fmt(e.qty * e.product.price)}<br>`;
  });
  if (appliedCoupon && couponSavings() > 0) {
    lines += `<br>Subtotal: ${fmt(orderSubtotal())}`;
    lines += `<br>Discount (${escapeHtml(appliedCoupon.code)}): −${fmt(couponSavings())}`;
  }
  lines += `<br><strong>Estimated total: ${fmt(orderTotal())}</strong>`;
  summary.innerHTML = lines;
  document.getElementById("orderFormOverlay").classList.add("is-open");
  document.getElementById("ofName").focus();
});

document.getElementById("orderFormClose").addEventListener("click", () => {
  document.getElementById("orderFormOverlay").classList.remove("is-open");
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("ofName").value.trim();
  const email = document.getElementById("ofEmail").value.trim();
  const phone = document.getElementById("ofPhone").value.trim();
  const delivery = document.getElementById("ofDelivery").value;
  const notes = document.getElementById("ofNotes").value.trim();
  const status = document.getElementById("ofStatus");

  if (!name) { status.textContent = "Please enter your name."; status.className = "form-status error"; return; }
  if (!email) { status.textContent = "Please enter your email."; status.className = "form-status error"; return; }

  const submitBtn = document.querySelector("#orderForm button[type='submit']");
  submitBtn.disabled = true;
  status.textContent = "Sending…";
  status.className = "form-status";

  let orderLines = "";
  order.forEach((e) => { orderLines += `• ${e.qty} × ${e.product.name} — ${fmt(e.qty * e.product.price)}\n`; });

  const couponLine = (appliedCoupon && couponSavings() > 0)
    ? `\nCoupon (${appliedCoupon.code}): −${fmt(couponSavings())}\nSubtotal: ${fmt(orderSubtotal())}`
    : "";

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: `New candle order from ${name} — ${fmt(orderTotal())}`,
        from_name: `${CONFIG.businessName} website`,
        name, email,
        message: `ORDER DETAILS:\n${orderLines}${couponLine}\nEstimated total: ${fmt(orderTotal())}\n\nPickup/Delivery: ${delivery}\nPhone: ${phone || "Not provided"}\nNotes: ${notes || "None"}`,
      }),
    });
    const result = await res.json();
    if (result.success) {
      status.textContent = "Order sent! We'll get back to you soon.";
      status.className = "form-status ok";
      document.getElementById("orderForm").reset();
      order.clear();
      updateUI();
      setTimeout(() => {
        document.getElementById("orderFormOverlay").classList.remove("is-open");
        closeTray();
      }, 2500);
    } else {
      status.textContent = "Something went wrong. Please try again.";
      status.className = "form-status error";
    }
  } catch (err) {
    status.textContent = "Network error. Please try again.";
    status.className = "form-status error";
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Footer contact link ---------- */
document.getElementById("footerEmail").href = `mailto:${CONFIG.email}`;

/* ---------- Contact form ---------- */
const contactForm = document.getElementById("contactForm");
const cfStatus = document.getElementById("cfStatus");

function buildContactMessage() {
  const name = document.getElementById("cfName").value.trim();
  const email = document.getElementById("cfEmail").value.trim();
  const phone = document.getElementById("cfPhone").value.trim();
  const message = document.getElementById("cfMessage").value.trim();
  return { name, email, phone, message };
}

function contactIsValid({ name, message }) {
  if (!name) { setStatus("Please add your name.", "error"); return false; }
  if (!message) { setStatus("Please add a short message.", "error"); return false; }
  return true;
}

function contactBodyText({ name, email, phone, message }) {
  const lines = [`Name: ${name}`];
  if (email) lines.push(`Email: ${email}`);
  if (phone) lines.push(`Phone: ${phone}`);
  lines.push("", message);
  return lines.join("\n");
}

function setStatus(msg, type) {
  cfStatus.textContent = msg;
  cfStatus.classList.remove("ok", "error");
  if (type) cfStatus.classList.add(type);
}

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = buildContactMessage();
  if (!contactIsValid(data)) return;

  const keyIsSet = CONFIG.web3formsKey && !CONFIG.web3formsKey.startsWith("PASTE");

  if (!keyIsSet) {
    const subject = encodeURIComponent(`New message from ${data.name}`);
    const body = encodeURIComponent(contactBodyText(data));
    window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
    setStatus("Opening your email app to send…");
    return;
  }

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  setStatus("Sending…");

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: `New message from ${data.name} — ${CONFIG.businessName} website`,
        from_name: `${CONFIG.businessName} website`,
        name: data.name,
        email: data.email || CONFIG.email,
        phone: data.phone || "(not provided)",
        message: data.message,
        botcheck: document.getElementById("cfBotcheck")?.checked || "",
      }),
    });
    const result = await res.json();
    if (result.success) {
      setStatus("Thanks! Your message has been sent.", "ok");
      contactForm.reset();
    } else {
      setStatus("Sorry, that didn't send. Please try again in a moment.", "error");
    }
  } catch (err) {
    setStatus("Network problem. Please try again in a moment.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Tray open / close ---------- */
const tray = document.getElementById("tray");
const backdrop = document.getElementById("trayBackdrop");
const trayToggle = document.getElementById("trayToggle");

function openTray() {
  tray.classList.add("is-open");
  backdrop.classList.add("is-open");
  trayToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeTray() {
  tray.classList.remove("is-open");
  backdrop.classList.remove("is-open");
  trayToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

trayToggle.addEventListener("click", () => {
  if (order.size === 0) {
    trayToggle.classList.remove("nudge");
    void trayToggle.offsetWidth;
    trayToggle.classList.add("nudge");
    return;
  }
  openTray();
});

document.getElementById("trayClose").addEventListener("click", closeTray);
backdrop.addEventListener("click", closeTray);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && tray.classList.contains("is-open")) closeTray(); });

/* ---------- Mobile menu ---------- */
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

function setMenu(open) {
  siteNav.classList.toggle("is-open", open);
  navToggle.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle.addEventListener("click", () => setMenu(!siteNav.classList.contains("is-open")));
siteNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- Coupon code ---------- */
(function () {
  const input    = document.getElementById("couponInput");
  const applyBtn = document.getElementById("couponApply");
  const statusEl = document.getElementById("couponStatus");

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "coupon-status" + (type ? " " + type : "");
  }

  function tryApply() {
    const code = input.value.trim().toUpperCase();
    if (!code) { setStatus("Please enter a coupon code.", "error"); return; }

    if (appliedCoupon && appliedCoupon.code === code) {
      setStatus("This coupon is already applied.", "info");
      return;
    }

    if (COUPONS[code]) {
      const smallCount = countSmallCandles();
      if (smallCount < 3) {
        setStatus("Add at least 3 small candles to use this code.", "error");
        return;
      }
      appliedCoupon = { code, description: COUPONS[code].description };
      const savings = couponSavings();
      setStatus(`✓ Code applied! You save $${savings}.`, "ok");
      applyBtn.textContent = "Remove";
      input.disabled = true;
      updateUI();
    } else {
      setStatus("Invalid coupon code. Try again.", "error");
    }
  }

  function tryRemove() {
    appliedCoupon = null;
    input.value = "";
    input.disabled = false;
    applyBtn.textContent = "Apply";
    setStatus("", "");
    updateUI();
  }

  applyBtn.addEventListener("click", () => {
    if (applyBtn.textContent === "Remove") tryRemove();
    else tryApply();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryApply();
  });

  // Re-validate coupon whenever cart changes (in case candles are removed)
  const _origUpdateUI = updateUI;
  // We patch changeQty/addToOrder to re-check validity after qty changes
  const _origChangeQty = changeQty;
  window._revalidateCoupon = function () {
    if (!appliedCoupon) return;
    const smallCount = countSmallCandles();
    if (smallCount < 3) {
      appliedCoupon = null;
      input.value = "";
      input.disabled = false;
      applyBtn.textContent = "Apply";
      setStatus("Coupon removed: not enough candles.", "error");
    }
  };
})();

/* ---------- Offer banner dismiss ---------- */
const offerBanner = document.getElementById("offerBanner");
const offerClose  = document.getElementById("offerClose");
if (offerClose) {
  offerClose.addEventListener("click", () => {
    offerBanner.setAttribute("hidden", "");
  });
}

/* ---------- Slideshow (infinite loop — no reverse scroll) ---------- */
(function () {
  const track    = document.getElementById("slideshowTrack");
  const dotsEl   = document.getElementById("slideDots");
  const prevBtn  = document.getElementById("slidePrev");
  const nextBtn  = document.getElementById("slideNext");
  if (!track) return;

  const realSlides = Array.from(track.querySelectorAll(".slide"));
  const total      = realSlides.length;
  let current      = 0; // 0-based index into real slides
  let isTransitioning = false;
  let timer;

  // Clone first and last slide and wrap around the real ones
  // Layout: [clone-of-last] [slide0] [slide1] … [slideN] [clone-of-first]
  const cloneLast  = realSlides[total - 1].cloneNode(true);
  const cloneFirst = realSlides[0].cloneNode(true);
  track.insertBefore(cloneLast, realSlides[0]);
  track.appendChild(cloneFirst);

  // Start at visual position 1 (= real slide 0), no animation
  track.style.transition = "none";
  track.style.transform  = `translateX(-100%)`;

  // Build dots (one per real slide)
  realSlides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "slide-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => { if (!isTransitioning) jumpTo(i); });
    dotsEl.appendChild(dot);
  });

  function updateDots() {
    dotsEl.querySelectorAll(".slide-dot").forEach((d, i) =>
      d.classList.toggle("active", i === current)
    );
  }

  function slideTo(visualPos, animate) {
    track.style.transition = animate
      ? "transform 0.5s cubic-bezier(0.45, 0, 0.2, 1)"
      : "none";
    track.style.transform  = `translateX(-${visualPos * 100}%)`;
  }

  function jumpTo(idx) {
    current = idx;
    slideTo(current + 1, true);
    updateDots();
    resetTimer();
  }

  function step(dir) {
    if (isTransitioning) return;
    isTransitioning = true;
    const visualPos = current + 1 + dir;
    slideTo(visualPos, true);

    track.addEventListener("transitionend", function onEnd() {
      track.removeEventListener("transitionend", onEnd);
      isTransitioning = false;

      if (dir === 1 && current === total - 1) {
        current = 0;
        slideTo(1, false);
      } else if (dir === -1 && current === 0) {
        current = total - 1;
        slideTo(total, false);
      } else {
        current += dir;
      }
      updateDots();
    });
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => step(1), 1500);
  }

  prevBtn.addEventListener("click", () => { step(-1); resetTimer(); });
  nextBtn.addEventListener("click", () => { step(1);  resetTimer(); });

  // Pause on hover
  const slideshow = document.getElementById("slideshow");
  slideshow.addEventListener("mouseenter", () => clearInterval(timer));
  slideshow.addEventListener("mouseleave", resetTimer);

  // Touch / swipe support
  let touchStartX = 0;
  track.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { step(diff > 0 ? 1 : -1); resetTimer(); }
  });

  updateDots();
  resetTimer();
})();

/* ---------- Start ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
renderProducts();
updateUI();