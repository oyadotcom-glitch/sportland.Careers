/**
 * SmartCount – התנהגות הדף
 * המלצות (קרוסלה), טופס לידים, CTA צף, אנימציות כניסה.
 */
(function () {
  "use strict";

  var CONFIG = window.SMARTCOUNT_CONFIG || {};
  var tracking = window.SmartTracking || { event: function () {}, lead: function () {}, getAttributionFields: function () { return {}; } };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ================= Testimonials ================= */

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function starsHtml(rating) {
    var r = Math.round(Number(rating));
    if (!r || r < 1 || r > 5) return "";
    var out = '<div class="stars" role="img" aria-label="דירוג ' + r + ' מתוך 5">';
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24" class="' + (i <= r ? "on" : "off") + '" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
    }
    return out + "</div>";
  }

  function initTestimonials() {
    var section = document.getElementById("testimonials");
    var data = CONFIG.testimonials || {};
    var items = data.items || [];
    if (!section || !items.length) return;

    // תוכן דמה לעולם לא מוצג באוויר
    var isProduction = CONFIG.site && CONFIG.site.env === "production";
    if (data.isDemo && isProduction) return;

    var track = section.querySelector("[data-carousel-track]");
    var dots = section.querySelector("[data-carousel-dots]");
    var prev = section.querySelector("[data-carousel-prev]");
    var next = section.querySelector("[data-carousel-next]");

    track.innerHTML = items.map(function (t, i) {
      return (
        '<figure class="t-card" role="group" aria-roledescription="שקופית" aria-label="המלצה ' + (i + 1) + " מתוך " + items.length + '">' +
          (data.isDemo ? '<span class="demo-tag">תוכן דמה · לא לפרסום</span>' : "") +
          starsHtml(t.rating) +
          '<svg class="quote-mark" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14C0 6 4.5 1.3 12 0l1.3 3.6C9 5 7 7.6 6.8 11H12v13zm19 0V14c0-8 4.5-12.7 12-14l1.3 3.6C28 5 26 7.6 25.8 11H31v13z"/></svg>' +
          "<blockquote><p>" + escapeHtml(t.text) + "</p></blockquote>" +
          '<figcaption><span class="t-avatar" aria-hidden="true">' + escapeHtml(String(t.name || "").charAt(0)) + "</span>" +
          "<span><b>" + escapeHtml(t.name) + "</b><small>" + escapeHtml(t.business) + "</small></span></figcaption>" +
        "</figure>"
      );
    }).join("");

    if (data.isDemo) section.querySelector("[data-demo-banner]").hidden = false;
    section.hidden = false;

    var cards = Array.prototype.slice.call(track.children);
    var dotBtns = [];

    // נקודה לכל עמדת גלילה אפשרית (ולא לכל כרטיס), לפי מספר הכרטיסים שנכנסים במסך
    function buildDots() {
      var stops = Math.max(1, Math.round(maxScroll() / step()) + 1);
      if (dotBtns.length === stops) return;
      dots.innerHTML = "";
      dotBtns = [];
      for (var i = 0; i < stops; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dot-btn";
        b.setAttribute("aria-label", "מעבר להמלצה " + (i + 1));
        b.addEventListener("click", scrollToIndex.bind(null, i));
        dots.appendChild(b);
        dotBtns.push(b);
      }
    }

    // ב-RTL scrollLeft שלילי בדפדפנים מודרניים – עובדים עם ערך מוחלט
    function position() { return Math.abs(track.scrollLeft); }
    function maxScroll() { return track.scrollWidth - track.clientWidth; }
    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }
    function scrollToIndex(i) {
      var target = Math.min(i * step(), maxScroll());
      track.scrollTo({ left: -target, behavior: reduceMotion ? "auto" : "smooth" });
    }
    function currentIndex() {
      if (position() >= maxScroll() - 4) return dotBtns.length - 1;
      return Math.round(position() / step());
    }
    function update() {
      buildDots();
      var idx = currentIndex();
      dotBtns.forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
        if (i === idx) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
      prev.disabled = position() <= 4;
      next.disabled = position() >= maxScroll() - 4;
      // כשכל הכרטיסים נכנסים במסך – אין צורך בפקדים
      section.querySelector(".carousel-controls").hidden = maxScroll() <= 4;
    }

    next.addEventListener("click", function () { scrollToIndex(currentIndex() + 1); });
    prev.addEventListener("click", function () { scrollToIndex(Math.max(currentIndex() - 1, 0)); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); next.click(); }
      if (e.key === "ArrowRight") { e.preventDefault(); prev.click(); }
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ================= CTA → preselect business type ================= */

  function initCtas() {
    var select = document.getElementById("f-type");
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest('a[href="#lead"]');
      if (!link) return;
      tracking.event("cta_click", { cta_location: link.getAttribute("data-cta") || "" });
      var type = link.getAttribute("data-business-type");
      if (type && select) {
        select.value = type;
        clearError(select);
      }
    });
  }

  /* ================= Lead form ================= */

  var form = document.getElementById("lead-form");
  var statusEl = form && form.querySelector("[data-form-status]");
  var submitBtn = form && form.querySelector("[data-submit]");
  var started = false;

  var validators = {
    fullName: function (v) {
      v = v.trim();
      if (!v) return "נא למלא שם מלא";
      if (v.length < 2) return "השם קצר מדי";
      return "";
    },
    phone: function (v) {
      var digits = v.replace(/[\s\-().]/g, "").replace(/^\+972/, "0").replace(/^972/, "0");
      if (!digits) return "נא למלא מספר טלפון";
      if (!/^0(5\d{8}|[2-46-9]\d{7}|7\d{8})$/.test(digits)) return "נא להזין מספר טלפון ישראלי תקין";
      return "";
    },
    businessType: function (v) { return v ? "" : "נא לבחור את סוג העסק"; }
  };

  function errorEl(input) { return document.getElementById(input.getAttribute("aria-describedby")); }

  function setError(input, msg) {
    input.setAttribute("aria-invalid", "true");
    input.closest(".field").classList.add("has-error");
    var el = errorEl(input);
    if (el) el.textContent = msg;
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    var field = input.closest(".field");
    if (field) field.classList.remove("has-error");
    var el = errorEl(input);
    if (el) el.textContent = "";
  }

  function validateField(input) {
    var fn = validators[input.name];
    if (!fn) return true;
    var msg = fn(input.value, input);
    if (msg) { setError(input, msg); return false; }
    clearError(input);
    return true;
  }

  function normalizePhone(v) {
    return v.replace(/[\s\-().]/g, "").replace(/^\+972/, "0").replace(/^972/, "0");
  }

  function makeLeadId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "sc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
    form.setAttribute("aria-busy", on ? "true" : "false");
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (type ? " is-" + type : "");
  }

  function sendLead(payload) {
    var cfg = CONFIG.lead || {};
    if (!cfg.endpoint) {
      return Promise.reject({ code: "not_configured" });
    }
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, cfg.timeoutMs || 15000) : null;

    return fetch(cfg.endpoint, {
      method: "POST",
      // text/plain נמנע מבקשת preflight – נדרש ל-Google Apps Script
      headers: Object.assign({ "Content-Type": cfg.contentType || "application/json" }, cfg.headers || {}),
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw { code: "http_" + res.status };
      return res.text();
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw { code: err && err.name === "AbortError" ? "timeout" : "network" };
    }).then(function (text) {
      // אם השרת מחזיר JSON עם ok – הוא חייב להיות true (Apps Script מחזיר 200 גם בשגיאה)
      var data = null;
      try { data = JSON.parse(text); } catch (e) { /* תשובה שאינה JSON – מסתמכים על סטטוס 2xx */ }
      if (data && data.ok === false) throw { code: "rejected_" + (data.error || "unknown") };
      if (cfg.requireOk && !(data && data.ok === true)) throw { code: "unconfirmed" };
      return data;
    });
  }

  function onSuccess(payload) {
    tracking.lead({ leadId: payload.leadId, businessType: payload.businessType });

    var mode = (CONFIG.lead && CONFIG.lead.successMode) || "inline";
    if (mode !== "inline") {
      window.location.href = mode;
      return;
    }

    var thanks = document.querySelector("[data-thank-you]");
    var firstName = payload.fullName.trim().split(/\s+/)[0];
    thanks.querySelector("[data-thank-name]").textContent = firstName ? " " + firstName : "";
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus({ preventScroll: true });
    thanks.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function initForm() {
    if (!form) return;

    form.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      tracking.event("lead_form_start");
    });

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!validators[el.name]) return;
      el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") validateField(el); });
      el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", function () {
        if (el.getAttribute("aria-invalid") === "true") validateField(el);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showStatus("");

      var firstInvalid = null;
      Object.keys(validators).forEach(function (name) {
        var el = form.elements[name];
        if (!validateField(el) && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showStatus("יש לתקן את השדות המסומנים", "error");
        return;
      }

      // Honeypot – בוט מילא שדה נסתר: לא שולחים ולא מדווחים המרה
      if (form.elements.company.value) return;

      var payload = {
        leadId: makeLeadId(),
        brand: "SmartCount",
        fullName: form.elements.fullName.value.trim(),
        phone: normalizePhone(form.elements.phone.value),
        businessType: form.elements.businessType.value,
        businessTypeLabel: form.elements.businessType.selectedOptions[0].text,
        notes: form.elements.notes.value.trim(),
        // ההסכמה ניתנת בלחיצה על כפתור השליחה – נשמר הנוסח שהוצג לפונה
        consent: true,
        consentText: document.getElementById("consent-note").textContent.replace(/\s+/g, " ").trim(),
        submittedAt: new Date().toISOString(),
        pageUrl: window.location.href.split("#")[0],
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
        attribution: tracking.getAttributionFields()
      };

      setLoading(true);
      showStatus("שולחים את הפרטים…");

      sendLead(payload).then(function () {
        setLoading(false);
        showStatus("");
        onSuccess(payload);
      }).catch(function (err) {
        setLoading(false);
        var code = (err && err.code) || "unknown";
        tracking.event("lead_submit_error", { error_code: code });
        if (code === "not_configured") {
          console.warn("[SmartCount] lead.endpoint אינו מוגדר ב-config.js – הליד לא נשלח.", payload);
          showStatus("הטופס עדיין לא מחובר למערכת קליטת הפניות, ולכן הפרטים לא נשלחו.", "error");
        } else {
          showStatus("לא הצלחנו לשלוח את הפרטים כרגע. נא לנסות שוב בעוד רגע.", "error");
        }
      });
    });
  }

  /* ================= Floating CTA (mobile) ================= */

  function initFloatingCta() {
    var bar = document.querySelector("[data-floating-cta]");
    var hero = document.querySelector(".hero");
    var lead = document.getElementById("lead");
    if (!bar || !hero || !lead || !("IntersectionObserver" in window)) return;

    var heroVisible = true;
    var leadVisible = false;
    var link = bar.querySelector("a");

    function update() {
      var show = !heroVisible && !leadVisible;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
      link.tabIndex = show ? 0 : -1;
    }

    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.05 }).observe(hero);

    new IntersectionObserver(function (entries) {
      leadVisible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.01 }).observe(lead);
  }

  /* ================= Header shadow + reveal ================= */

  function initHeader() {
    var header = document.querySelector(".site-header");
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add("is-in"); });
      return;
    }
    document.documentElement.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  initTestimonials();
  initCtas();
  initForm();
  initFloatingCta();
  initHeader();
  initReveal();
})();
