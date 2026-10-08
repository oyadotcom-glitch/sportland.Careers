/**
 * SmartCount – מדידה ושיוך (Attribution)
 * - טוען GTM / GA4 / Google Ads / Meta Pixel רק אם הוגדר מזהה ב-config.js
 * - שומר UTM, GCLID ומזהי קליקים נוספים (first touch + last touch)
 * - חושף SmartTracking.lead() שנקרא רק אחרי שליחת טופס מוצלחת
 */
(function () {
  "use strict";

  var cfg = (window.SMARTCOUNT_CONFIG && window.SMARTCOUNT_CONFIG.tracking) || {};
  var STORAGE_KEY = "sc_attribution";
  var PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
    "gclid", "gbraid", "wbraid", "fbclid", "msclkid"
  ];

  window.dataLayer = window.dataLayer || [];

  /* ---------- Attribution ---------- */

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var maxAge = (cfg.attributionDays || 90) * 864e5;
      if (!data.savedAt || Date.now() - data.savedAt > maxAge) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeStore(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable – attribution stays in memory only */ }
  }

  function captureAttribution() {
    var query = new URLSearchParams(window.location.search);
    var current = {};
    var hasParams = false;
    PARAMS.forEach(function (key) {
      var value = query.get(key);
      if (value) {
        current[key] = value.slice(0, 300);
        hasParams = true;
      }
    });

    var stored = readStore() || {};
    var touch = {
      params: current,
      landingPage: window.location.href.split("#")[0],
      referrer: document.referrer || "",
      at: new Date().toISOString()
    };

    if (!stored.first) stored.first = touch;
    if (hasParams || !stored.last) stored.last = touch;
    stored.savedAt = Date.now();
    writeStore(stored);
    return stored;
  }

  var attribution = captureAttribution();

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  /** שדות השיוך שנשלחים יחד עם הליד */
  function getAttributionFields() {
    var last = (attribution.last && attribution.last.params) || {};
    var first = (attribution.first && attribution.first.params) || {};
    var fields = {};
    PARAMS.forEach(function (key) {
      fields[key] = last[key] || first[key] || "";
    });
    fields.first_touch = attribution.first || null;
    fields.last_touch = attribution.last || null;
    fields.fbp = getCookie("_fbp");
    fields.fbc = getCookie("_fbc") || (fields.fbclid ? "fb.1." + Date.now() + "." + fields.fbclid : "");
    return fields;
  }

  /* ---------- Loaders ---------- */

  function loadScript(src) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  if (cfg.gtmId) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(cfg.gtmId));
  }

  if (cfg.ga4Id || cfg.googleAdsId) {
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    if (cfg.ga4Id) window.gtag("config", cfg.ga4Id);
    if (cfg.googleAdsId) window.gtag("config", cfg.googleAdsId);
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id || cfg.googleAdsId));
  }

  if (cfg.metaPixelId) {
    /* Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", cfg.metaPixelId);
    window.fbq("track", "PageView");
  }

  /* ---------- Events ---------- */

  function event(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
  }

  /**
   * לקרוא רק אחרי שהשרת אישר שהליד נשמר.
   * GTM: טריגר Custom Event בשם "generate_lead" (המשתנים lead_id ו-business_type זמינים ב-dataLayer).
   */
  function lead(details) {
    details = details || {};
    event("generate_lead", {
      lead_id: details.leadId,
      business_type: details.businessType
    });

    if (window.gtag) {
      if (cfg.ga4Id) {
        window.gtag("event", "generate_lead", { business_type: details.businessType });
      }
      if (cfg.googleAdsId && cfg.googleAdsLeadLabel) {
        window.gtag("event", "conversion", {
          send_to: cfg.googleAdsId + "/" + cfg.googleAdsLeadLabel,
          transaction_id: details.leadId
        });
      }
    }

    if (window.fbq && cfg.metaPixelId) {
      // eventID מאפשר דה-דופליקציה מול Conversions API בצד השרת
      window.fbq("track", "Lead", { content_category: details.businessType }, { eventID: details.leadId });
    }
  }

  window.SmartTracking = {
    event: event,
    lead: lead,
    getAttributionFields: getAttributionFields
  };
})();
