/* Leverline site behavior: navigation, attribution (?ref= and UTM capture),
   lead and referral forms. No dependencies. */
(function () {
  "use strict";

  var CFG = window.LL_CONFIG || {};
  var LL = (window.LL = window.LL || {});
  LL.extraLeadData = LL.extraLeadData || {};

  // ── Storage that never throws (private windows, blocked storage) ─────────
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  function readJSON(k) {
    var raw = store.get(k);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-nav-toggle]");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  // ── Attribution: referral codes and campaign parameters ──────────────────
  var REF_RE = /^[A-Za-z]{2,6}-[A-Za-z2-9]{4}$/;
  var refDays = CFG.refDays || 90;
  var params = null;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }

  (function capture() {
    var now = Date.now();
    if (params) {
      var ref = params.get("ref");
      if (ref && REF_RE.test(ref)) {
        ref = ref.toUpperCase();
        store.set("ll_ref", JSON.stringify({ code: ref, t: now }));
        try { document.cookie = "ll_ref=" + encodeURIComponent(ref) + ";max-age=" + refDays * 86400 + ";path=/;SameSite=Lax"; } catch (e) { /* ignore */ }
      }
      var utm = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "msclkid"].forEach(function (k) {
        var v = params.get(k);
        if (v) utm[k] = v.slice(0, 120);
      });
      if (Object.keys(utm).length) {
        utm.t = now;
        utm.landing = window.location.pathname;
        store.set("ll_utm", JSON.stringify(utm));
      }
    }
    if (!store.get("ll_first")) {
      store.set("ll_first", JSON.stringify({
        t: now,
        landing: window.location.pathname,
        referrer: document.referrer ? document.referrer.slice(0, 200) : ""
      }));
    }
  })();

  LL.getRef = function () {
    var o = readJSON("ll_ref");
    if (o && o.code && Date.now() - o.t < refDays * 86400000) return o.code;
    var m = document.cookie.match(/(?:^|;\s*)ll_ref=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  };

  // ?package=pilot on contact / pricing links fills the hidden field
  if (params && params.get("package")) {
    var pkg = params.get("package").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
    document.querySelectorAll('input[name="package"]').forEach(function (el) { if (!el.value) el.value = pkg; });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function api(path) {
    var base = (CFG.apiBase || "").replace(/\/+$/, "");
    return base ? base + path : "";
  }
  function setStatus(form, text, kind) {
    var el = form.querySelector(".form-status");
    if (!el) return;
    el.textContent = text || "";
    el.className = "form-status" + (kind ? " is-" + kind : "");
  }
  function copyButton(text) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-quiet btn-s";
    b.textContent = "Copy";
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1800); };
      var fallback = function () {
        var pre = b.closest(".fallback") && b.closest(".fallback").querySelector("pre, .copyable");
        if (pre && window.getSelection) {
          var r = document.createRange(); r.selectNodeContents(pre);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          b.textContent = "Selected. Press copy";
        }
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
      } catch (e) { fallback(); }
    });
    return b;
  }
  function showFallback(form, subject, body, intro) {
    var box = form.querySelector(".fallback");
    if (!box) return;
    box.innerHTML = "";
    var p = document.createElement("p");
    p.className = "small";
    p.textContent = intro;
    var addr = document.createElement("p");
    addr.innerHTML = "Send it to <strong class=\"copyable\"></strong>";
    addr.querySelector("strong").textContent = CFG.contactEmail || "";
    var pre = document.createElement("pre");
    pre.textContent = body;
    var row = document.createElement("div");
    row.className = "actions";
    row.appendChild(copyButton(body));
    if (CFG.contactEmail) {
      var a = document.createElement("a");
      a.className = "link small";
      a.href = "mailto:" + CFG.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      a.textContent = "Open in your email app";
      row.appendChild(a);
    }
    box.appendChild(p);
    box.appendChild(addr);
    box.appendChild(pre);
    box.appendChild(row);
    box.hidden = false;
  }
  function formToObject(form) {
    var out = {};
    new FormData(form).forEach(function (v, k) {
      v = typeof v === "string" ? v.trim() : v;
      if (out[k] === undefined) out[k] = v;
      else out[k] = [].concat(out[k], v);
    });
    return out;
  }
  function describe(data) {
    var lines = [];
    var labels = { name: "Name", email: "Email", company: "Company", role: "Role", website: "Website", industry: "Industry",
      team_size: "Team size", budget: "Budget", timeline: "Timing", package: "Interested in", use_cases: "Use case",
      readiness: "AI readiness score", opportunity: "Opportunity score", message: "Message" };
    Object.keys(labels).forEach(function (k) {
      var v = data[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
      lines.push(labels[k] + ": " + (Array.isArray(v) ? v.join(", ") : v));
    });
    if (data.top_opportunities && data.top_opportunities.length) lines.push("Top opportunities: " + data.top_opportunities.join(", "));
    if (data.roi && data.roi.use_case) lines.push("ROI estimate: " + data.roi.use_case + ", about $" + Math.round(data.roi.annual_value || 0).toLocaleString("en-US") + " a year");
    if (data.ref) lines.push("Referral code: " + data.ref);
    lines.push("Page: " + data.page);
    return lines.join("\n");
  }

  // ── Lead forms ───────────────────────────────────────────────────────────
  document.querySelectorAll("[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = formToObject(form);
      if (data.company_website) { setStatus(form, "Thanks. We'll be in touch.", "ok"); return; } // honeypot
      delete data.company_website;
      if (!data.name || !EMAIL_RE.test(data.email || "")) {
        setStatus(form, "Add your name and a valid email address so we can reply.", "error");
        return;
      }
      var extra = LL.extraLeadData || {};
      Object.keys(extra).forEach(function (k) {
        var cur = data[k];
        if (cur === undefined || cur === "" || (Array.isArray(cur) && !cur.length)) data[k] = extra[k];
      });
      if (typeof data.use_cases === "string") data.use_cases = data.use_cases ? data.use_cases.split(",") : [];
      data.ref = LL.getRef();
      data.utm = readJSON("ll_utm") || {};
      data.first_touch = readJSON("ll_first") || {};
      data.page = window.location.pathname;

      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      var first = String(data.name).split(" ")[0];
      var subject = "AI inquiry from " + (data.company || data.name);
      var body = describe(data);

      var url = api("/api/leads");
      if (!url) {
        setStatus(form, "", "");
        showFallback(form, subject, body, "Online submissions aren't connected yet. Copy your details below and email them to us; we'll reply within one business day.");
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setStatus(form, "Sending…", "");
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, body: j }; }); })
        .then(function (r) {
          if (!r.ok || !r.body || r.body.ok === false) throw new Error((r.body && r.body.error) || "Request failed");
          form.querySelectorAll("input:not([type=hidden]), textarea, select").forEach(function (el) { el.disabled = true; });
          var msg = "Thanks, " + first + ". We'll reply within " + (r.body.sla || "one business day") + ".";
          setStatus(form, msg, "ok");
          var booking = (r.body.next && r.body.next.booking_url) || CFG.bookingUrl;
          if (booking) {
            var a = document.createElement("a");
            a.className = "btn btn-s"; a.href = booking; a.target = "_blank"; a.rel = "noopener";
            a.textContent = "Pick a time now";
            form.querySelector(".form-status").appendChild(document.createTextNode(" "));
            form.querySelector(".form-status").appendChild(a);
          }
          if (btn) { btn.textContent = "Sent"; }
          try { if (window.plausible) window.plausible("Lead", { props: { source: data.source || "" } }); } catch (e) { /* ignore */ }
          try { if (window.gtag) window.gtag("event", "generate_lead", { source: data.source || "" }); } catch (e) { /* ignore */ }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          setStatus(form, "We couldn't send that automatically.", "error");
          showFallback(form, subject, body, "Copy your details below and email them to us instead; we'll reply within one business day.");
        });
    });
  });

  // ── Referral sign-up ─────────────────────────────────────────────────────
  document.querySelectorAll("[data-referral-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = formToObject(form);
      if (data.company_website) return;
      delete data.company_website;
      if (!data.name || !EMAIL_RE.test(data.email || "")) {
        setStatus(form, "Add your name and a valid email address.", "error");
        return;
      }
      var body = "Please set me up as a referral partner.\nName: " + data.name + "\nEmail: " + data.email + (data.company ? "\nCompany: " + data.company : "");
      var url = api("/api/referrals");
      if (!url) {
        showFallback(form, "Referral partner sign-up", body, "Automatic sign-up isn't connected yet. Email us and we'll send your personal link within one business day.");
        return;
      }
      setStatus(form, "Creating your link…", "");
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (res) { return res.json().then(function (j) { if (!res.ok || !j.ok) throw new Error(j.error || "failed"); return j; }); })
        .then(function (j) {
          setStatus(form, "Your link is ready. Share it anywhere.", "ok");
          var box = form.querySelector(".fallback");
          box.innerHTML = "";
          var p = document.createElement("p");
          p.innerHTML = "Code <strong class=\"copyable\"></strong>";
          p.querySelector("strong").textContent = j.code;
          var pre = document.createElement("pre");
          pre.textContent = j.link;
          var row = document.createElement("div");
          row.className = "actions";
          row.appendChild(copyButton(j.link));
          box.appendChild(p); box.appendChild(pre); box.appendChild(row);
          box.hidden = false;
        })
        .catch(function () {
          setStatus(form, "We couldn't create your link automatically.", "error");
          showFallback(form, "Referral partner sign-up", body, "Email us and we'll send your personal link within one business day.");
        });
    });
  });
})();
