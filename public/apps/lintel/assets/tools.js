/* Lintel tools: the same decisions as engine/ (Python), in the browser.
 *
 * Core functions are pure and take the catalog first. tests/test_js_parity.py
 * runs them in Node against engine/ and fails if any result differs.
 * The UI section binds them to the page through data- attributes.
 */
(function (root) {
  "use strict";

  // ── Shared helpers (engine/util.py) ──────────────────────────────────────
  function roundHalfUp(x, n) { var f = Math.pow(10, n || 0); return Math.floor(x * f + 0.5) / f; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function roundTo(x, step) { return roundHalfUp(x / step) * step; }
  function money(n) { return "$" + Math.floor(Number(n) + 0.5).toLocaleString("en-US"); }
  function squash(s) { return String(s).split(/\s+/).filter(Boolean).join(" "); }
  function byId(list, key) { var o = {}; (list || []).forEach(function (x) { o[x[key || "id"]] = x; }); return o; }
  function assign(a, b) { var o = {}; Object.keys(a || {}).forEach(function (k) { o[k] = a[k]; }); Object.keys(b || {}).forEach(function (k) { o[k] = b[k]; }); return o; }
  function indexOf(cat, listName, id, dflt) {
    var list = cat.taxonomy[listName] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return dflt;
  }
  function label(cat, listName, id) {
    var list = cat.taxonomy[listName] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }

  // ── Estimator (engine/estimator.py) ──────────────────────────────────────
  function homeMultiplier(cat, home) {
    var adj = cat.homeAdjustments;
    var h = assign(cat.typicalHome, home || {});
    var m = 1.0;
    ["age", "floors", "walls", "attic_access"].forEach(function (key) {
      var src = key === "age" ? "home_age" : key;
      var v = adj[key][String(h[src])];
      m *= v === undefined ? 1.0 : Number(v);
    });
    return m;
  }

  function mergeItems(items) {
    var order = [], q = {};
    (items || []).forEach(function (it) {
      if (!(it.device in q)) { order.push(it.device); q[it.device] = 0; }
      q[it.device] += Number(it.qty);
    });
    return order.filter(function (d) { return q[d] > 0; }).map(function (d) { return { device: d, qty: q[d] }; });
  }

  function quote(cat, items, home, customerSupplied, upgradesCount) {
    var lab = cat.labor, dev = byId(cat.devices);
    if (upgradesCount === undefined || upgradesCount === null) upgradesCount = 1;
    var mult = homeMultiplier(cat, home);
    var lines = [], equipment = 0, equipmentCost = 0, ourHours = 0;
    var tradeHours = { electrician: 0, plumber: 0 };
    mergeItems(items).forEach(function (it) {
      var d = dev[it.device], q = it.qty;
      var eq = customerSupplied ? 0 : d.price * q;
      equipment += eq;
      equipmentCost += customerSupplied ? 0 : d.cost * q;
      var hrs = d.hours * q * mult;
      if (d.trade in tradeHours) tradeHours[d.trade] += hrs; else ourHours += hrs;
      lines.push({ device: d.id, name: d.name, qty: q, equipment: eq, hours: hrs, trade: d.trade });
    });
    var ourLabor = ourHours * lab.rate;
    if (customerSupplied) ourLabor *= 1 + lab.customer_supplied_pct / 100;
    var bundle = 0;
    if (upgradesCount >= 2) { bundle = ourLabor * lab.bundle_labor_discount_pct / 100; ourLabor -= bundle; }
    var trades = [], tradeLabor = 0;
    [["electrician", "electrician_rate"], ["plumber", "plumber_rate"]].forEach(function (t) {
      if (tradeHours[t[0]] > 0) {
        var hrs = tradeHours[t[0]] + lab.trade_trip_hours;
        var cost = hrs * lab[t[1]] * (1 + lab.coordination_pct / 100);
        tradeLabor += cost;
        trades.push({ trade: t[0], hours: hrs, labor: cost });
      }
    });
    var subtotal = equipment + ourLabor + tradeLabor;
    var total = (items && items.length) ? Math.max(subtotal, lab.minimum_job) : 0;
    var spread = lab.estimate_spread_pct / 100;
    // Same order as Python: our_hours + sum(trade hours)
    var installHours = ourHours + trades.reduce(function (s, t) { return s + t.hours; }, 0);
    return {
      lines: lines, multiplier: mult, equipment: equipment, equipment_margin: equipment - equipmentCost,
      our_hours: ourHours, our_labor: ourLabor, bundle_discount: bundle, trades: trades, trade_labor: tradeLabor,
      total: total, low: total * (1 - spread), high: total * (1 + spread), install_hours: installHours,
      install_days: installHours ? Math.max(1, Math.ceil(installHours / 7 - 1e-9)) : 0
    };
  }

  function packageFromPrice(cat, pkg) {
    var q = quote(cat, pkg.items, cat.typicalHome, false, (pkg.use_cases || []).length);
    return roundTo(q.total, cat.roundTo);
  }
  function upgradePrice(cat, upgrade, home) { return quote(cat, upgrade.setup, home || cat.typicalHome); }

  // ── Savings (engine/savings.py) ──────────────────────────────────────────
  var HARD_MODELS = ["energy", "water", "insurance", "avoided", "rental"];
  function annualValue(model, v) {
    var g = function (k) { var x = v[k]; return Number(x || 0) || 0; };
    var p = function (x) { return x / 100; };
    if (model === "energy") return g("annual_spend") * p(g("savings_pct"));
    if (model === "water") return p(g("claim_chance_pct")) * g("avg_claim") * p(g("prevented_pct")) + g("annual_premium") * p(g("discount_pct"));
    if (model === "insurance") return g("annual_premium") * p(g("discount_pct"));
    if (model === "time") return g("hours_per_week") * 52 * g("hour_value");
    if (model === "avoided") return g("avoided_cost") * p(g("chance_pct")) / (g("years") || 1);
    if (model === "rental") return g("stays_per_year") * g("hours_saved") * g("hour_value") + g("nights") * g("energy_per_night");
    throw new Error("unknown savings model " + model);
  }
  function defaultsFor(cat, upgrade) {
    var model = cat.taxonomy.savings_models[upgrade.savings.model];
    var vals = {};
    model.inputs.forEach(function (i) { vals[i.id] = i.min; });
    var d = upgrade.savings.defaults || {};
    Object.keys(d).forEach(function (k) { vals[k] = d[k]; });
    return vals;
  }
  function savingsSummary(cat, upgrade, inputs, price) {
    var model = upgrade.savings.model;
    var vals = defaultsFor(cat, upgrade);
    if (inputs) Object.keys(inputs).forEach(function (k) {
      if (inputs[k] !== null && inputs[k] !== undefined && inputs[k] !== "") vals[k] = inputs[k];
    });
    var value = annualValue(model, vals);
    var hard = HARD_MODELS.indexOf(model) >= 0;
    var cost = (price === undefined || price === null) ? upgradePrice(cat, upgrade).total : price;
    var yearly = hard ? value : 0;
    var hoursBack = model === "time" ? (Number(vals.hours_per_week || 0) || 0) * 52 : 0;
    return {
      model: model, hard: hard, inputs: vals, annual_value: value, yearly_dollars: yearly, hours_back: hoursBack,
      price: cost, payback_years: yearly > 0 ? cost / yearly : null, ten_year_net: hard ? 10 * yearly - cost : null
    };
  }
  function packageValue(cat, pkg) {
    var ups = byId(cat.upgrades, "slug"), dollars = 0, hours = 0;
    (pkg.use_cases || []).forEach(function (slug) {
      var s = savingsSummary(cat, ups[slug], null, 0);
      dollars += s.yearly_dollars; hours += s.hours_back;
    });
    return { yearly_dollars: dollars, hours_back: hours };
  }

  // ── Compatibility (engine/compatibility.py) ──────────────────────────────
  function ruleMatches(cat, rule, items, ctx) {
    var when = rule.when || {}, dev = byId(cat.devices);
    var ids = items.filter(function (it) { return it.qty > 0; }).map(function (it) { return it.device; });
    var protocols = {}, trades = {};
    ids.forEach(function (i) { (dev[i].protocols || []).forEach(function (p) { protocols[p] = 1; }); trades[dev[i].trade] = 1; });
    var some = function (list, test) { return list.some(test); };
    if (when.any_device && !some(when.any_device, function (d) { return ids.indexOf(d) >= 0; })) return false;
    if (when.no_device && some(when.no_device, function (d) { return ids.indexOf(d) >= 0; })) return false;
    if (when.any_protocol && !some(when.any_protocol, function (p) { return protocols[p]; })) return false;
    if (when.any_trade && !some(when.any_trade, function (t) { return trades[t]; })) return false;
    if (when.ecosystem && when.ecosystem.indexOf(ctx.ecosystem || "none") < 0) return false;
    if (when.home_age && when.home_age.indexOf(ctx.home_age) < 0) return false;
    if (when.flag && (ctx.flags || []).indexOf(when.flag) < 0) return false;
    return true;
  }
  function resolvePlan(cat, items, ctx) {
    ctx = ctx || {};
    var plan = mergeItems(items), added = [];
    for (var pass = 0; pass < 5; pass++) {
      var changed = false;
      cat.compatibility.forEach(function (rule) {
        if (rule.level !== "needs" || !ruleMatches(cat, rule, plan, ctx)) return;
        var add = rule.add;
        if (plan.some(function (it) { return it.device === add.device; })) return;
        plan.push({ device: add.device, qty: add.qty });
        added.push({ id: rule.id, message: squash(rule.message), device: add.device });
        changed = true;
      });
      if (!changed) break;
    }
    var notes = cat.compatibility.filter(function (r) { return r.level !== "needs" && ruleMatches(cat, r, plan, ctx); })
      .map(function (r) { return { id: r.id, level: r.level, message: squash(r.message) }; });
    return { items: plan, added: added, notes: notes };
  }

  // ── Smart Home Scan (engine/scan.py) ─────────────────────────────────────
  function answerValue(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    var n = parseInt(raw, 10);
    if (isNaN(n)) return null;
    return clamp(n, 0, 3);
  }
  function crosses(f, v) { return ("max" in f && v <= f.max) || ("min" in f && v >= f.min); }
  function scoreScan(scan, answers) {
    var dims = {}, need = [], flags = [], answered = 0;
    scan.dimensions.forEach(function (d) { dims[d.id] = []; });
    scan.questions.forEach(function (q) {
      var v = answerValue(answers[q.id]);
      if (v === null) return;
      answered++;
      if (q.dimension in dims) dims[q.dimension].push(v);
      else if (q.dimension === "need") need.push(v);
      (q.flags || []).forEach(function (f) { if (crosses(f, v) && flags.indexOf(f.id) < 0) flags.push(f.id); });
    });
    var sum = function (a) { return a.reduce(function (s, x) { return s + x; }, 0); };
    var dimScores = {}, present = [];
    scan.dimensions.forEach(function (d) {
      var vals = dims[d.id];
      dimScores[d.id] = vals.length ? roundHalfUp(sum(vals) / (3 * vals.length) * 100) : null;
      if (dimScores[d.id] !== null) present.push(dimScores[d.id]);
    });
    var readiness = present.length ? roundHalfUp(sum(present) / present.length) : 0;
    var needScore = need.length ? roundHalfUp(sum(need) / (3 * need.length) * 100) : 0;
    var tier = scan.tiers[0];
    scan.tiers.forEach(function (t) { if (readiness >= t.min) tier = t; });
    return { readiness: readiness, dimensions: dimScores, need: needScore, flags: flags,
      tier: { name: tier.name, summary: squash(tier.summary) }, answered: answered };
  }
  function answerBoosts(scan, answers) {
    var out = {};
    scan.questions.forEach(function (q) {
      var v = answerValue(answers[q.id]);
      if (v === null) return;
      (q.boosts || []).forEach(function (b) {
        if (!crosses(b, v)) return;
        var reason = "You answered: " + q.options[v];
        Object.keys(b.upgrades).forEach(function (slug) { (out[slug] = out[slug] || []).push([Number(b.upgrades[slug]), reason]); });
      });
    });
    return out;
  }
  var OLD_AGES = ["1960-1989", "pre-1960"];
  var CONDO_LIMITED = ["energy-management", "smart-irrigation", "security-cameras-local", "new-construction-prewire"];
  function rankUpgrades(cat, profile, answers, topN) {
    answers = answers || {};
    var goals = (profile.goals || []).filter(Boolean);
    var event = profile.life_event || "none";
    var budgetIdx = indexOf(cat, "budgets", profile.budget, 1);
    var seg = null;
    for (var i = 0; i < cat.segments.length; i++) if (cat.segments[i].life_event === event) { seg = cat.segments[i]; break; }
    var segRank = {};
    if (seg) seg.upgrades.forEach(function (s, j) { segRank[s] = j; });
    var boosts = answerBoosts(cat.scan, answers);
    var old = OLD_AGES.indexOf(profile.home_age) >= 0;
    var renting = profile.owns === "rent", condo = profile.home_type === "condo";
    var dev = byId(cat.devices);
    var results = cat.upgrades.map(function (u) {
      var sig = u.signals, reasons = [], cautions = [], weights = sig.goals || {};
      var goalScore;
      if (goals.length) {
        goalScore = 0; var best = null, bestW = 1;
        goals.forEach(function (g) { var w = weights[g] || 0; goalScore += w; if (w > bestW) { best = g; bestW = w; } });
        if (best !== null) reasons.push("Matches your goal: " + label(cat, "goals", best).toLowerCase());
      } else goalScore = 1.0;
      var evW = Number((sig.life_events || {})[event] || 0);
      var evScore = evW + (u.slug in segRank ? Math.max(0, 1.5 - 0.5 * segRank[u.slug]) : 0);
      if (evW >= 2) reasons.push("A priority for: " + label(cat, "life_events", event).toLowerCase());
      var boostScore = 0;
      (boosts[u.slug] || []).forEach(function (b) { boostScore += b[0]; if (reasons.indexOf(b[1]) < 0) reasons.push(b[1]); });
      var oldScore = 0;
      if (old && sig.old_home_boost) { oldScore = 1.5; reasons.push("Older homes benefit most"); }
      var hours = upgradePrice(cat, u).install_hours;
      var speed = hours <= 4 ? 1.0 : (hours <= 8 ? 0.5 : 0.0);
      var raw = goalScore * 2 + evScore + boostScore + oldScore + speed;
      var feas = 1.0;
      if (budgetIdx < (sig.min_budget || 0)) { feas = feas * 0.6; cautions.push("Usually above your budget"); }
      if (condo && CONDO_LIMITED.indexOf(u.slug) >= 0) { feas = feas * 0.5; cautions.push("Often limited by HOA or building rules"); }
      var trades = u.setup.map(function (it) { return dev[it.device].trade; });
      if (renting && (trades.indexOf("electrician") >= 0 || trades.indexOf("plumber") >= 0)) { feas = feas * 0.7; cautions.push("Needs your landlord's approval"); }
      if (sig.only_for && sig.only_for.indexOf(event) < 0) feas = feas * 0.25;
      return { slug: u.slug, name: u.name, short: u.short, category: u.category, score: raw * feas,
        reasons: reasons.slice(0, 3), cautions: cautions, install_hours: hours };
    });
    results.sort(function (a, b) {
      if (a.score !== b.score) return b.score - a.score;
      if (a.install_hours !== b.install_hours) return a.install_hours - b.install_hours;
      return a.slug < b.slug ? -1 : (a.slug > b.slug ? 1 : 0);
    });
    var top = results.length ? results[0].score : 0;
    results.forEach(function (r) { r.relative = top ? roundHalfUp(100 * r.score / top) : 0; });
    return topN ? results.slice(0, topN) : results;
  }
  function recommend(cat, profile, ranked, flags) {
    flags = flags || [];
    var bySlug = {};
    ranked.forEach(function (r) { bySlug[r.slug] = r.score; });
    var best = null, bestScore = -1;
    cat.packages.forEach(function (p) {
      var s = (p.use_cases || []).reduce(function (a, slug) { return a + (bySlug[slug] || 0); }, 0);
      if (s > bestScore) { best = p; bestScore = s; }
    });
    var addon = null;
    if (flags.indexOf("weak_wifi") >= 0 && best.id !== "connected-foundation") addon = byId(cat.packages)["connected-foundation"] || null;
    var items = best.items.concat(addon ? addon.items : []);
    var home = {};
    ["home_age", "floors", "walls", "attic_access"].forEach(function (k) { if (profile[k]) home[k] = profile[k]; });
    home = assign(cat.typicalHome, home);
    var plan = resolvePlan(cat, items, { ecosystem: profile.ecosystem, home_age: home.home_age, flags: flags });
    var n = (best.use_cases || []).length + (addon ? (addon.use_cases || []).length : 0);
    var q = quote(cat, plan.items, home, false, n);
    return {
      package: { id: best.id, name: best.name, tagline: best.tagline },
      addon: addon ? { id: addon.id, name: addon.name } : null,
      estimate: { total: q.total, low: q.low, high: q.high, install_days: q.install_days, trades: q.trades.map(function (t) { return t.trade; }) },
      added: plan.added, notes: plan.notes, next_step: q.total >= 1500 ? "design_visit" : "book_install"
    };
  }

  // ── Room-by-room planner (engine/rooms.py) ───────────────────────────────
  function roomCounts(cat, counts) {
    var out = {};
    cat.rooms.rooms.forEach(function (r) {
      var raw = (counts || {})[r.id];
      if (raw === undefined) raw = r["default"];
      var n = parseInt(raw, 10);
      if (isNaN(n)) n = r["default"];
      out[r.id] = Math.max(0, Math.min(r.max, n));
    });
    return out;
  }
  function roomPlan(cat, counts, optionIds) {
    var rooms = roomCounts(cat, counts);
    var chosen = cat.rooms.options.filter(function (o) { return (optionIds || []).indexOf(o.id) >= 0; });
    var whole = {}, wholeOrder = [], per = {}, perOrder = [];
    chosen.forEach(function (o) {
      var w = o.whole_home || {};
      Object.keys(w).forEach(function (d) {
        if (!(d in whole)) { wholeOrder.push(d); whole[d] = 0; }
        whole[d] = Math.max(whole[d], Number(w[d]));
      });
      var pr = o.per_room || {};
      Object.keys(pr).forEach(function (room) {
        var n = rooms[room] || 0;
        Object.keys(pr[room]).forEach(function (d) {
          if (!(d in per)) { perOrder.push(d); per[d] = 0; }
          per[d] += Number(pr[room][d]) * n;
        });
      });
    });
    var order = [];
    wholeOrder.concat(perOrder).forEach(function (d) { if (order.indexOf(d) < 0) order.push(d); });
    var items = [];
    order.forEach(function (d) {
      var q = (whole[d] || 0) + Math.ceil((per[d] || 0) - 1e-9);
      if (q > 0) items.push({ device: d, qty: q });
    });
    return { items: items, upgrades: chosen.map(function (o) { return o.upgrade; }), rooms: rooms };
  }

  var core = {
    roundHalfUp: roundHalfUp, roundTo: roundTo, money: money, homeMultiplier: homeMultiplier, mergeItems: mergeItems,
    quote: quote, packageFromPrice: packageFromPrice, upgradePrice: upgradePrice, annualValue: annualValue,
    defaultsFor: defaultsFor, savingsSummary: savingsSummary, packageValue: packageValue, resolvePlan: resolvePlan,
    scoreScan: scoreScan, answerBoosts: answerBoosts, rankUpgrades: rankUpgrades, recommend: recommend,
    roomCounts: roomCounts, roomPlan: roomPlan
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = core; return; }
  root.LintelTools = core;

  // ═════════════════════════════════════════════════════════════════════════
  // UI
  // ═════════════════════════════════════════════════════════════════════════
  var CAT = root.LINTEL_CATALOG;
  if (!CAT || typeof document === "undefined") return;
  var CFG = root.LL_CONFIG || {};
  var BASE = (CFG.base || "/").replace(/\/?$/, "/");
  var DEV = byId(CAT.devices), UPG = byId(CAT.upgrades, "slug"), PKG = byId(CAT.packages);
  var LL = (root.LL = root.LL || {});
  LL.extraLeadData = LL.extraLeadData || {};

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function setText(sel, text, ctx) { $$(sel, ctx).forEach(function (e) { e.textContent = text; }); }
  function qs() { try { return new URLSearchParams(root.location.search); } catch (e) { return null; } }
  var store = {
    get: function (k) { try { return JSON.parse(root.localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  function hrs(n) { return n >= 10 ? Math.round(n) + " hrs" : (Math.round(n * 10) / 10) + " hrs"; }
  function range(lo, hi) { return money(roundTo(lo, 10)) + "–" + money(roundTo(hi, 10)); }
  function tradeLabel(t) { return t === "electrician" ? "Licensed electrician" : (t === "plumber" ? "Licensed plumber" : t); }

  // ── Hero floor plan ──────────────────────────────────────────────────────
  $$("[data-floorplan]").forEach(function (fp) {
    var chips = $$("[data-fp-pkg]", fp);
    function update() {
      var on = chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; }).map(function (c) { return c.getAttribute("data-fp-pkg"); });
      $$("[data-fp-dev]", fp).forEach(function (m) { m.classList.toggle("on", on.indexOf(m.getAttribute("data-pkg")) >= 0); });
      chips.forEach(function (c) { var id = c.getAttribute("data-fp-pkg"); fp.classList.toggle("pkg-" + id, on.indexOf(id) >= 0); });
      var price = 0, dollars = 0, hours = 0, count = 0;
      on.forEach(function (id) {
        var p = PKG[id]; if (!p) return;
        price += packageFromPrice(CAT, p);
        var v = packageValue(CAT, p); dollars += v.yearly_dollars; hours += v.hours_back;
        count += p.items.reduce(function (s, it) { return s + (DEV[it.device].price > 0 ? it.qty : 0); }, 0);
      });
      setText("[data-fp-price]", on.length ? money(price) : "$0", fp);
      setText("[data-fp-save]", money(dollars), fp);
      setText("[data-fp-hours]", Math.round(hours) + "", fp);
      setText("[data-fp-count]", String(count), fp);
      fp.classList.toggle("is-empty", !on.length);
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
        update();
      });
    });
    update();
  });

  // ── Category filters (upgrades hub) ──────────────────────────────────────
  $$("[data-filter-group]").forEach(function (group) {
    var target = $(group.getAttribute("data-filter-group"));
    if (!target) return;
    $$("[data-filter]", group).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        $$("[data-filter]", group).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$("[data-card-cat]", target).forEach(function (card) { card.hidden = !(f === "all" || card.getAttribute("data-card-cat") === f); });
      });
    });
  });

  // ── Smart Home Scan wizard ───────────────────────────────────────────────
  $$("[data-scan]").forEach(function (form) {
    var steps = $$(".scan-step", form), idx = 0;
    var results = $("[data-scan-results]");
    form.classList.add("is-wizard");
    function show(i) {
      idx = clamp(i, 0, steps.length - 1);
      steps.forEach(function (s, j) { s.hidden = j !== idx; });
      var bar = $("[data-scan-progress] span", form);
      if (bar) bar.style.width = Math.round(100 * idx / (steps.length - 1)) + "%";
      setText("[data-scan-count]", (idx + 1) + " of " + steps.length, form);
      var back = $("[data-scan-back]", form), next = $("[data-scan-next]", form), fin = $("[data-scan-finish]", form);
      if (back) back.hidden = idx === 0;
      if (next) next.hidden = idx === steps.length - 1;
      if (fin) fin.hidden = idx !== steps.length - 1;
    }
    function values() {
      var fd = new FormData(form), answers = {}, profile = { goals: [] };
      CAT.scan.questions.forEach(function (q) { if (fd.get(q.id) !== null) answers[q.id] = fd.get(q.id); });
      profile.goals = fd.getAll("goals");
      ["life_event", "home_type", "home_age", "owns", "budget", "ecosystem", "zip", "floors"].forEach(function (k) { if (fd.get(k)) profile[k] = String(fd.get(k)); });
      return { answers: answers, profile: profile };
    }
    form.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.name === "goals" && t.checked && $$("input[name=goals]:checked", form).length > 3) { t.checked = false; return; }
      if (t.type === "radio" && t.closest(".scan-step.is-question") && idx < steps.length - 1) setTimeout(function () { show(idx + 1); }, 220);
    });
    var nextB = $("[data-scan-next]", form), backB = $("[data-scan-back]", form);
    if (nextB) nextB.addEventListener("click", function () { show(idx + 1); });
    if (backB) backB.addEventListener("click", function () { show(idx - 1); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = values();
      var sc = scoreScan(CAT.scan, v.answers);
      var ranked = rankUpgrades(CAT, v.profile, v.answers);
      var rec = recommend(CAT, v.profile, ranked, sc.flags);
      renderScan(results, v, sc, ranked.slice(0, 5), rec);
      store.set("ll_scan", { t: Date.now(), readiness: sc.readiness, package: rec.package.id, total: rec.estimate.total,
        top: ranked.slice(0, 3).map(function (r) { return r.slug; }), profile: v.profile });
      form.hidden = true;
      results.hidden = false;
      results.scrollIntoView({ behavior: "smooth", block: "start" });
      try { if (root.plausible) root.plausible("Scan complete"); } catch (e) { /* ignore */ }
    });
    var again = $("[data-scan-restart]");
    if (again) again.addEventListener("click", function () { results.hidden = true; form.hidden = false; show(0); });
    show(0);
  });

  function renderScan(box, v, sc, top, rec) {
    var out = $("[data-scan-output]", box);
    out.innerHTML = "";
    var dims = h("div", { class: "dims" });
    CAT.scan.dimensions.forEach(function (d) {
      var s = sc.dimensions[d.id];
      dims.appendChild(h("div", { class: "dim" }, [
        h("span", { class: "dim-label", text: d.label }),
        h("span", { class: "meter" }, [h("span", { style: "width:" + (s === null ? 0 : s) + "%" })]),
        h("span", { class: "dim-val", text: s === null ? "–" : String(s) })
      ]));
    });
    out.appendChild(h("section", { class: "panel scan-score" }, [
      h("div", { class: "ring", style: "--v:" + sc.readiness }, [h("strong", { text: String(sc.readiness) }), h("span", { text: "of 100" })]),
      h("div", {}, [h("p", { class: "eyebrow", text: "Smart home readiness" }), h("h2", { text: sc.tier.name }), h("p", { text: sc.tier.summary }), dims])
    ]));
    var list = h("ol", { class: "rank-list" });
    top.forEach(function (r) {
      var li = h("li", { class: "rank" }, [
        h("div", { class: "rank-head" }, [h("a", { href: BASE + "upgrades/" + r.slug + "/", text: r.name }), h("span", { class: "meter s" }, [h("span", { style: "width:" + r.relative + "%" })])]),
        h("p", { class: "small", text: r.short })
      ]);
      if (r.reasons.length) li.appendChild(h("ul", { class: "why" }, r.reasons.map(function (x) { return h("li", { text: x }); })));
      r.cautions.forEach(function (c) { li.appendChild(h("p", { class: "caution small", text: c })); });
      list.appendChild(li);
    });
    out.appendChild(h("section", { class: "panel" }, [h("p", { class: "eyebrow", text: "Your top upgrades" }), list]));
    var e = rec.estimate;
    var pk = h("section", { class: "panel rec" }, [
      h("p", { class: "eyebrow", text: "Recommended first project" }),
      h("h2", { text: rec.package.name + (rec.addon ? " + " + rec.addon.name : "") }),
      h("p", { text: rec.package.tagline }),
      h("p", { class: "big-price" }, [h("strong", { text: range(e.low, e.high) }), h("span", { text: " installed, about " + e.install_days + " day" + (e.install_days === 1 ? "" : "s") })])
    ]);
    if (e.trades.length) pk.appendChild(h("p", { class: "small", text: "Includes " + e.trades.map(tradeLabel).join(" and ").toLowerCase() + " work, billed through us." }));
    var notes = rec.added.map(function (a) { return a.message; }).concat(rec.notes.filter(function (n) { return n.level !== "info"; }).map(function (n) { return n.message; }));
    if (notes.length) pk.appendChild(h("ul", { class: "notes" }, notes.map(function (n) { return h("li", { text: n }); })));
    var visit = rec.next_step === "design_visit";
    pk.appendChild(h("div", { class: "actions" }, [
      h("a", { class: "btn", href: "#scan-lead", text: visit ? "Book a design visit" : "Book this install" }),
      h("a", { class: "btn btn-quiet", href: BASE + "plan/?opts=" + optsForPackage(rec.package.id).join(","), text: "Adjust it in the planner" })
    ]));
    if (visit) pk.appendChild(h("p", { class: "small muted", text: "The $199 visit is credited to any project over $1,500 booked within 60 days." }));
    out.appendChild(pk);
    LL.extraLeadData = {
      source: "scan", readiness: sc.readiness, need: sc.need, flags: sc.flags, top_upgrades: top.map(function (r) { return r.slug; }),
      package: rec.package.id, estimate_total: Math.round(e.total), goals: v.profile.goals, life_event: v.profile.life_event,
      home_type: v.profile.home_type, home_age: v.profile.home_age, owns: v.profile.owns, budget: v.profile.budget,
      ecosystem: v.profile.ecosystem, zip: v.profile.zip
    };
    var leadPkg = $("#scan-lead input[name=package]");
    if (leadPkg) leadPkg.value = visit ? "design_visit" : rec.package.id;
    var zip = $("#scan-lead input[name=zip]");
    if (zip && v.profile.zip) zip.value = v.profile.zip;
  }
  function optsForPackage(id) {
    var p = PKG[id]; if (!p) return [];
    return CAT.rooms.options.filter(function (o) { return (p.use_cases || []).indexOf(o.upgrade) >= 0; }).map(function (o) { return o.id; });
  }

  // ── Savings calculator ───────────────────────────────────────────────────
  $$("[data-savings]").forEach(function (box) {
    var sel = $("[data-sav-upgrade]", box), wrap = $("[data-sav-inputs]", box), priceIn = $("[data-sav-price]", box);
    var p = qs();
    if (p && p.get("u") && UPG[p.get("u")]) sel.value = p.get("u");
    function build() {
      var u = UPG[sel.value], model = CAT.taxonomy.savings_models[u.savings.model], vals = defaultsFor(CAT, u);
      wrap.innerHTML = "";
      model.inputs.forEach(function (i) {
        var id = "sav-" + i.id;
        var inp = h("input", { id: id, type: "number", inputmode: "decimal", min: i.min, max: i.max, step: i.step, value: vals[i.id], "data-sav-in": i.id });
        wrap.appendChild(h("div", { class: "field" }, [h("label", { "for": id, text: i.label + (i.unit ? " (" + i.unit + ")" : "") }), inp]));
      });
      priceIn.value = Math.round(upgradePrice(CAT, u).total);
      setText("[data-sav-formula]", model.formula, box);
      setText("[data-sav-note]", u.savings.note ? squash(u.savings.note) : "", box);
      var more = $("[data-sav-link]", box);
      if (more) { more.href = BASE + "upgrades/" + u.slug + "/"; more.textContent = "About " + u.name; }
      calc();
    }
    function calc() {
      var u = UPG[sel.value], inputs = {};
      $$("[data-sav-in]", wrap).forEach(function (i) { if (i.value !== "") inputs[i.getAttribute("data-sav-in")] = Number(i.value); });
      var price = priceIn.value === "" ? null : Number(priceIn.value);
      var s = savingsSummary(CAT, u, inputs, price);
      setText("[data-sav-dollars]", money(s.yearly_dollars), box);
      setText("[data-sav-hours]", s.hours_back ? Math.round(s.hours_back) + " hrs" : "–", box);
      setText("[data-sav-payback]", s.payback_years === null ? "No hard-dollar payback" : (s.payback_years > 30 ? "Over 30 years" : (Math.round(s.payback_years * 10) / 10) + " years"), box);
      setText("[data-sav-net]", s.ten_year_net === null ? "–" : money(s.ten_year_net), box);
      setText("[data-sav-kind]", s.hard ? "Counts toward payback" : "Time saved is shown separately and doesn't count toward payback", box);
      box.classList.toggle("is-time", !s.hard);
    }
    sel.addEventListener("change", build);
    wrap.addEventListener("input", calc);
    priceIn.addEventListener("input", calc);
    build();
  });

  // ── Room-by-room planner ─────────────────────────────────────────────────
  $$("[data-planner]").forEach(function (box) {
    var overrides = {};
    var p = qs();
    if (p && p.get("opts")) {
      var want = p.get("opts").split(",");
      $$("[data-opt]", box).forEach(function (c) { c.checked = want.indexOf(c.value) >= 0; });
    }
    function state() {
      var counts = {};
      $$("[data-room-input]", box).forEach(function (i) { counts[i.getAttribute("data-room-input")] = i.value; });
      var opts = $$("[data-opt]", box).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var home = {};
      $$("[data-home]", box).forEach(function (s) { home[s.getAttribute("data-home")] = s.value; });
      var eco = $("[data-ctx=ecosystem]", box);
      var own = $("[data-own-devices]", box);
      return { counts: counts, opts: opts, home: home, ecosystem: eco ? eco.value : "none", own: !!(own && own.checked) };
    }
    function compute() {
      var s = state();
      var base = roomPlan(CAT, s.counts, s.opts);
      var items = base.items.map(function (it) { return { device: it.device, qty: it.device in overrides ? overrides[it.device] : it.qty }; });
      Object.keys(overrides).forEach(function (d) { if (!base.items.some(function (it) { return it.device === d; })) items.push({ device: d, qty: overrides[d] }); });
      var plan = resolvePlan(CAT, items, { ecosystem: s.ecosystem, home_age: s.home.home_age, flags: [] });
      var q = quote(CAT, plan.items, s.home, s.own, base.upgrades.length);
      return { s: s, base: base, plan: plan, q: q };
    }
    function render() {
      var r = compute(), q = r.q;
      var tb = $("[data-plan-lines]", box);
      tb.innerHTML = "";
      var addedIds = r.plan.added.map(function (a) { return a.device; });
      q.lines.forEach(function (ln) {
        var minus = h("button", { type: "button", class: "step", "aria-label": "One fewer " + ln.name, "data-dec": ln.device, text: "−" });
        var plus = h("button", { type: "button", class: "step", "aria-label": "One more " + ln.name, "data-inc": ln.device, text: "+" });
        tb.appendChild(h("tr", { class: addedIds.indexOf(ln.device) >= 0 ? "is-added" : "" }, [
          h("td", {}, [h("span", { text: ln.name }), ln.trade === "electrician" || ln.trade === "plumber" ? h("span", { class: "tag", text: ln.trade }) : null]),
          h("td", { class: "qty" }, [minus, h("span", { text: String(ln.qty) }), plus]),
          h("td", { class: "num", text: ln.equipment ? money(ln.equipment) : (DEV[ln.device].price ? "yours" : "labor") })
        ]));
      });
      if (!q.lines.length) tb.appendChild(h("tr", {}, [h("td", { colspan: "3", class: "muted", text: "Choose at least one upgrade to see a price." })]));
      setText("[data-plan-total]", money(q.total), box);
      setText("[data-plan-range]", q.total ? range(q.low, q.high) : "–", box);
      setText("[data-plan-days]", q.install_days ? q.install_days + " day" + (q.install_days === 1 ? "" : "s") : "–", box);
      setText("[data-plan-equipment]", money(q.equipment), box);
      setText("[data-plan-labor]", money(q.our_labor), box);
      setText("[data-plan-trades]", q.trades.length ? q.trades.map(function (t) { return t.trade.charAt(0).toUpperCase() + t.trade.slice(1) + " " + money(t.labor); }).join(" · ") : "None needed", box);
      setText("[data-plan-bundle]", q.bundle_discount ? "−" + money(q.bundle_discount) : "–", box);
      var notes = $("[data-plan-notes]", box);
      notes.innerHTML = "";
      r.plan.added.forEach(function (a) { notes.appendChild(h("li", { class: "needs", text: "Added: " + a.message })); });
      r.plan.notes.forEach(function (n) { notes.appendChild(h("li", { class: n.level, text: n.message })); });
      notes.parentNode.hidden = !notes.children.length;
      var items = r.plan.items.map(function (it) { return it.device + ":" + it.qty; });
      LL.extraLeadData = { source: "planner", estimate_total: Math.round(q.total), plan_items: items, upgrades: r.base.upgrades,
        home_age: r.s.home.home_age, ecosystem: r.s.ecosystem, rooms: r.base.rooms };
      store.set("ll_plan", { t: Date.now(), total: q.total, items: items, upgrades: r.base.upgrades });
    }
    box.addEventListener("input", function (ev) { if (ev.target.matches("[data-room-input], [data-opt], [data-home], [data-ctx], [data-own-devices]")) render(); });
    box.addEventListener("change", function (ev) { if (ev.target.matches("select, input[type=checkbox]")) render(); });
    box.addEventListener("click", function (ev) {
      var t = ev.target.closest("button"); if (!t) return;
      var dev = t.getAttribute("data-inc") || t.getAttribute("data-dec");
      if (dev) {
        var cur = compute().q.lines.filter(function (l) { return l.device === dev; })[0];
        var n = (cur ? cur.qty : 0) + (t.hasAttribute("data-inc") ? 1 : -1);
        overrides[dev] = Math.max(0, n);
        render();
        return;
      }
      var room = t.getAttribute("data-room-step");
      if (room) {
        var inp = $("[data-room-input=" + room + "]", box);
        inp.value = clamp(Number(inp.value || 0) + Number(t.getAttribute("data-delta")), Number(inp.min), Number(inp.max));
        render();
        return;
      }
      if (t.hasAttribute("data-plan-add")) {
        var sel = $("[data-plan-add-device]", box);
        if (sel && sel.value) { var c = compute().q.lines.filter(function (l) { return l.device === sel.value; })[0]; overrides[sel.value] = (c ? c.qty : 0) + 1; render(); }
        return;
      }
      if (t.hasAttribute("data-plan-reset")) { overrides = {}; render(); return; }
      if (t.hasAttribute("data-plan-preset")) {
        var want = t.getAttribute("data-plan-preset").split(",");
        $$("[data-opt]", box).forEach(function (c) { c.checked = want.indexOf(c.value) >= 0; });
        overrides = {}; render();
      }
    });
    render();
  });

  // ── Rebate finder ────────────────────────────────────────────────────────
  $$("[data-rebates]").forEach(function (box) {
    var up = $("[data-reb-upgrade]", box), st = $("[data-reb-state]", box);
    function run() {
      var u = up ? up.value : "", s = st ? st.value.trim().toUpperCase() : "", shown = 0;
      $$("[data-program]", box).forEach(function (p) {
        var ups = (p.getAttribute("data-upgrades") || "").split(" ").filter(Boolean);
        var states = (p.getAttribute("data-states") || "").split(" ").filter(Boolean);
        var ok = (!u || ups.indexOf(u) >= 0) && (!s || !states.length || states.indexOf(s) >= 0);
        p.hidden = !ok; if (ok) shown++;
      });
      var empty = $("[data-reb-empty]", box);
      if (empty) empty.hidden = shown > 0;
      var tips = $$("[data-reb-tip]", box);
      tips.forEach(function (t) { var ids = t.getAttribute("data-reb-tip").split(" "); t.hidden = !!u && ids.indexOf(u) < 0; });
    }
    if (up) up.addEventListener("change", run);
    if (st) st.addEventListener("input", run);
    run();
  });

  // Prefill the contact form with the last scan or plan, so we see the context
  var contact = $("[data-lead-form][data-source=contact]");
  if (contact) {
    var scan = store.get("ll_scan"), plan = store.get("ll_plan"), fresh = 1000 * 60 * 60 * 24 * 14;
    var ctxBox = $("[data-lead-context]");
    var bits = [];
    if (scan && Date.now() - scan.t < fresh) {
      LL.extraLeadData = { source: "contact", readiness: scan.readiness, top_upgrades: scan.top, package: scan.package,
        estimate_total: Math.round(scan.total), life_event: scan.profile.life_event, home_age: scan.profile.home_age,
        home_type: scan.profile.home_type, owns: scan.profile.owns, budget: scan.profile.budget, zip: scan.profile.zip };
      bits.push("your Smart Home Scan (readiness " + scan.readiness + ")");
    }
    if (plan && Date.now() - plan.t < fresh) {
      LL.extraLeadData.plan_items = plan.items;
      LL.extraLeadData.estimate_total = LL.extraLeadData.estimate_total || Math.round(plan.total);
      bits.push("your plan (" + money(plan.total) + ")");
    }
    if (ctxBox && bits.length) { ctxBox.textContent = "We'll include " + bits.join(" and ") + " with your note."; ctxBox.hidden = false; }
  }
})(typeof window !== "undefined" ? window : this);
