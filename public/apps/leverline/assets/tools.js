/* Leverline tools: the balance instrument, ROI calculator, use-case filter and
   AI Opportunity Scan. The Engine section mirrors engine/*.py exactly and is
   tested against it (tests/test_js_parity.py). */
(function (root) {
  "use strict";

  // ═══ Engine (pure functions, no DOM) ═════════════════════════════════════
  function roundHalfUp(x, nd) { var f = Math.pow(10, nd || 0); return Math.floor(x * f + 0.5) / f; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function indexOf(list, id, dflt) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return dflt;
  }
  function labelOf(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }

  function scoreAssessment(answers, assessment) {
    var dims = {}, opp = [], sensitivity = null, answered = 0;
    assessment.dimensions.forEach(function (d) { dims[d.id] = []; });
    assessment.questions.forEach(function (q) {
      var raw = answers[q.id];
      if (raw === undefined || raw === null || raw === "") return;
      var v = parseInt(raw, 10);
      if (isNaN(v)) return;
      v = clamp(v, 0, 3);
      answered += 1;
      if (dims[q.dimension]) dims[q.dimension].push(v);
      else if (q.dimension === "opportunity") opp.push(v);
      else if (q.dimension === "constraint") sensitivity = v;
    });
    var dimScores = {}, present = [];
    assessment.dimensions.forEach(function (d) {
      var vals = dims[d.id];
      if (vals.length) {
        var s = vals.reduce(function (a, b) { return a + b; }, 0);
        dimScores[d.id] = roundHalfUp(s / (3 * vals.length) * 100);
        present.push(dimScores[d.id]);
      } else dimScores[d.id] = null;
    });
    var readiness = present.length ? roundHalfUp(present.reduce(function (a, b) { return a + b; }, 0) / present.length) : 0;
    var opportunity = opp.length ? roundHalfUp(opp.reduce(function (a, b) { return a + b; }, 0) / (3 * opp.length) * 100) : 0;
    var tier = assessment.tiers[0];
    assessment.tiers.forEach(function (t) { if (readiness >= t.min) tier = t; });
    var weakest = null;
    Object.keys(dimScores).forEach(function (k) {
      if (dimScores[k] === null) return;
      if (weakest === null || dimScores[k] < dimScores[weakest]) weakest = k;
    });
    return {
      readiness: readiness, dimensions: dimScores, opportunity: opportunity,
      sensitive: sensitivity !== null && sensitivity >= 2,
      tier: { name: tier.name, summary: tier.summary.split(/\s+/).join(" ").trim() },
      weakest_dimension: weakest, answered: answered, total_questions: assessment.questions.length
    };
  }

  var WAREHOUSES = ["snowflake", "databricks", "warehouse_other"];

  function rankOpportunities(profile, cat, topN) {
    var industry = null;
    cat.industries.forEach(function (i) { if (i.slug === profile.industry) industry = i; });
    var indRank = {};
    if (industry) industry.useCases.forEach(function (s, i) { indRank[s] = i; });
    var goals = (profile.goals || []).filter(Boolean);
    var stack = profile.data_stack || [];
    var readiness = (profile.readiness === null || profile.readiness === undefined) ? 50 : Number(profile.readiness);
    var teamIdx = indexOf(cat.teamSizes, profile.team_size, 1);
    var budgetIdx = indexOf(cat.budgets, profile.budget, 1);
    var sensitive = !!profile.sensitive;
    var hasWarehouse = WAREHOUSES.some(function (s) { return stack.indexOf(s) >= 0; });

    var results = cat.useCases.map(function (uc) {
      var sig = uc.signals, weights = sig.goals || {}, reasons = [], cautions = [];
      var sensitiveScore = 0;
      if (sensitive && sig.sensitive_boost) { sensitiveScore = 3; reasons.push("Keeps sensitive data under your control"); }

      var goalScore;
      if (goals.length) {
        goalScore = 0;
        var bestGoal = null, bestW = 1;
        goals.forEach(function (g) {
          var w = weights[g] || 0;
          goalScore += w;
          if (w > bestW) { bestGoal = g; bestW = w; }
        });
        if (bestGoal !== null) reasons.push("Matches your goal: " + labelOf(cat.goals, bestGoal).toLowerCase());
      } else goalScore = 1;

      var industryScore = 0.0;
      if (Object.prototype.hasOwnProperty.call(indRank, uc.slug)) {
        industryScore = Math.max(1.0, 3 - 0.5 * indRank[uc.slug]);
        reasons.push("A top use case for " + industry.name);
      }

      var stackScore = 0;
      var hits = (sig.stack_boost || []).filter(function (s) { return stack.indexOf(s) >= 0; });
      if (hits.length) { stackScore = 2; reasons.push("Builds on your " + labelOf(cat.dataStack, hits[0]).split(" (")[0]); }

      var wtv = uc.weeksToValue;
      var speed = wtv <= 4 ? 1.0 : (wtv <= 8 ? 0.5 : 0.0);
      if (wtv <= 4) reasons.push("Fast time to value (about " + wtv + " weeks)");

      var raw = goalScore * 2 + industryScore + stackScore + sensitiveScore + speed;
      var feas = 1.0, needs = sig.data_needs || "low";
      if (needs === "high" && readiness < 60 && !hasWarehouse) { feas = feas * 0.6; cautions.push("Needs stronger data foundations first"); }
      else if (needs === "medium" && readiness < 40) { feas = feas * 0.8; cautions.push("Some data preparation needed"); }
      if (teamIdx < (sig.min_team || 0)) { feas = feas * 0.5; cautions.push("Usually suits larger teams"); }
      if (budgetIdx < (sig.min_budget || 0)) { feas = feas * 0.7; cautions.push("Typically needs a larger budget"); }

      var score = raw * feas;
      return {
        slug: uc.slug, name: uc.name, short: uc.short, category: uc.category,
        score: score, score_display: roundHalfUp(score, 2), reasons: reasons.slice(0, 3), cautions: cautions,
        weeks_to_value: wtv, timeline: uc.timeline, investment: uc.investment
      };
    });
    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.weeks_to_value !== b.weeks_to_value) return a.weeks_to_value - b.weeks_to_value;
      return a.slug < b.slug ? -1 : (a.slug > b.slug ? 1 : 0);
    });
    if (results.length) {
      var top = results[0].score || 1;
      results.forEach(function (r) { r.relative = top ? roundHalfUp(100 * r.score / top) : 0; });
    }
    return topN ? results.slice(0, topN) : results;
  }

  function p(x) { return Number(x) / 100.0; }
  function annualImpact(model, v) {
    var g = function (k) { var n = Number(v[k]); return isFinite(n) ? n : 0; };
    switch (model) {
      case "time_savings": return g("people") * g("hours_per_week") * p(g("automation_rate")) * 52 * g("hourly_cost");
      case "missed_revenue": return g("missed_calls") * p(g("capture_pct")) * p(g("close_rate")) * g("avg_job_value") * 12;
      case "lead_conversion": return g("monthly_leads") * p(g("close_rate")) * p(g("uplift_pct")) * g("avg_deal_value") * 12;
      case "revenue_uplift": return g("monthly_revenue") * p(g("uplift_pct")) * 12;
      case "cost_reduction": return g("monthly_cost") * p(g("reduction_pct")) * 12;
      case "retention": return g("customers") * p(g("annual_churn_pct")) * p(g("reduction_pct")) * g("annual_value");
      case "inventory": return g("inventory_value") * p(g("reduction_pct")) * p(g("carrying_cost_pct"));
    }
    throw new Error("unknown ROI model " + model);
  }

  function roiDefaults(uc, cat) {
    var model = cat.roiModels[uc.roi.model], vals = {};
    model.inputs.forEach(function (i) { vals[i.id] = i["default"] !== undefined ? i["default"] : i.min; });
    if (model.kind === "revenue") vals.gross_margin_pct = cat.marginInput["default"];
    var d = uc.roi.defaults || {};
    Object.keys(d).forEach(function (k) { vals[k] = d[k]; });
    return vals;
  }

  function roiSummary(uc, cat, inputs) {
    var modelId = uc.roi.model, model = cat.roiModels[modelId];
    var vals = roiDefaults(uc, cat);
    if (inputs) Object.keys(inputs).forEach(function (k) {
      if (inputs[k] !== null && inputs[k] !== undefined && inputs[k] !== "") vals[k] = inputs[k];
    });
    var impact = annualImpact(modelId, vals);
    var isRevenue = model.kind === "revenue";
    var value = isRevenue ? impact * p(vals.gross_margin_pct !== undefined ? vals.gross_margin_pct : 100) : impact;
    var inv = uc.investment;
    var oneTime = (inv.low + inv.high) / 2;
    var monthly = (inv.monthly_low + inv.monthly_high) / 2;
    var netMonthly = value / 12 - monthly;
    var payback = netMonthly > 0 ? oneTime / netMonthly : null;
    var cost3 = oneTime + 36 * monthly;
    return {
      model: modelId, kind: model.kind || "savings", inputs: vals,
      annual_impact: impact, annual_value: value, conservative_value: value * 0.7,
      one_time_cost: oneTime, monthly_cost: monthly, payback_months: payback,
      roi_3yr: cost3 ? (3 * value - cost3) / cost3 : null,
      year_one_cost: oneTime + 12 * monthly,
      multiple_3yr: cost3 ? 3 * value / cost3 : null
    };
  }

  function recommendNextStep(readiness, budget, ranked, cat) {
    var budgetIdx = indexOf(cat.budgets, budget, 1);
    var prod = {};
    cat.productized.forEach(function (x) { if (x.use_case) prod[x.use_case] = x; });
    var top = ranked.slice(0, 3).map(function (r) { return r.slug; });
    var quick = null;
    for (var i = 0; i < top.length; i++) if (prod[top[i]]) { quick = prod[top[i]]; break; }
    var topQuick = top.length ? (prod[top[0]] || null) : null;
    var workshop = null;
    cat.productized.forEach(function (x) { if (x.id === "workshop") workshop = x; });
    function offer(id) { var o = cat.offers[id]; return { id: id, name: o.name, price_label: o.price_label }; }
    function pr(x) { return { id: x.id, name: x.name, price_label: x.price_label }; }
    var primary, alt, reason;
    if (readiness < 35) {
      primary = offer("assessment");
      alt = quick ? pr(quick) : (workshop ? pr(workshop) : null);
      reason = "Build a costed roadmap and the data foundations first, with one quick win alongside.";
    } else if (readiness < 55) {
      if (topQuick) { primary = pr(topQuick); alt = offer("assessment"); reason = "Your top opportunity has a fast, fixed-price option you can launch in weeks."; }
      else { primary = offer("assessment"); alt = offer("pilot"); reason = "Confirm the ROI on your top opportunities, then pilot the best one."; }
    } else if (budgetIdx >= 1) {
      primary = offer("pilot"); alt = topQuick ? pr(topQuick) : offer("assessment");
      reason = "You're ready to put a high-value use case into production now.";
    } else {
      primary = topQuick ? pr(topQuick) : offer("assessment"); alt = offer("pilot");
      reason = "Start with a low-cost win and expand once it pays back.";
    }
    return { primary: primary, alternative: alt, reason: reason };
  }

  function r2(x) { return roundHalfUp(x, 2); }
  function balanceGeometry(cost, value) {
    var c = Math.max(Number(cost) || 0, 0), v = Math.max(Number(value) || 0, 0);
    var ang;
    if (c <= 0 && v <= 0) ang = 0;
    else if (v <= 0) ang = -14;
    else if (c <= 0) ang = 14;
    else ang = clamp(9 * Math.log2(v / c), -14, 14);
    var mx = Math.max(c, v, 1);
    var side = function (a) { return Math.max(16, 92 * Math.sqrt(a / mx)); };
    var sc = side(c), sv = side(v);
    return {
      angle: r2(ang),
      cost: { x: r2(95 - sc / 2), y: r2(147 - sc), w: r2(sc), h: r2(sc) },
      value: { x: r2(425 - sv / 2), y: r2(147 - sv), w: r2(sv), h: r2(sv) }
    };
  }

  function money(n) { return "$" + roundHalfUp(Number(n) || 0).toLocaleString("en-US"); }
  function kfmt(n) {
    var trim = function (x) { var s = roundHalfUp(x, 1).toFixed(1); return s.slice(-2) === ".0" ? s.slice(0, -2) : s; };
    if (n >= 1000000) return "$" + trim(n / 1000000) + "M";
    if (n >= 1000) return "$" + trim(n / 1000) + "k";
    return "$" + roundHalfUp(n);
  }
  function rangeLabel(lo, hi, suffix) { return kfmt(lo) + "–" + kfmt(hi) + (suffix || ""); }
  function paybackLabel(mo) {
    if (mo === null || mo === undefined || !isFinite(mo)) return "Doesn't pay back on these numbers";
    if (mo < 1) return "Pays back in under a month";
    var n = roundHalfUp(mo);
    return "Pays back in about " + n + (n === 1 ? " month" : " months");
  }
  function multipleLabel(x) {
    if (x === null || x === undefined || !isFinite(x)) return "";
    return "3-year value is " + roundHalfUp(x, 1).toFixed(1) + "× the 3-year cost";
  }

  var Engine = {
    scoreAssessment: scoreAssessment, rankOpportunities: rankOpportunities, annualImpact: annualImpact,
    roiDefaults: roiDefaults, roiSummary: roiSummary, recommendNextStep: recommendNextStep,
    balanceGeometry: balanceGeometry, money: money, rangeLabel: rangeLabel,
    paybackLabel: paybackLabel, multipleLabel: multipleLabel, roundHalfUp: roundHalfUp
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = Engine; }
  root.LLEngine = Engine;
  if (typeof document === "undefined") return;

  // ═══ UI ═══════════════════════════════════════════════════════════════════
  var CAT = root.LL_CATALOG;
  var CFG = root.LL_CONFIG || {};
  var LL = (root.LL = root.LL || {});
  LL.extraLeadData = LL.extraLeadData || {};
  if (!CAT) return;
  var reduceMotion = false;
  try { reduceMotion = root.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* ignore */ }

  var UC = {};
  CAT.useCases.forEach(function (u) { UC[u.slug] = u; });
  function urlFor(path) { return (CFG.urlPrefix || "") + path + (CFG.indexSuffix || ""); }
  var params = null;
  try { params = new URLSearchParams(root.location.search); } catch (e) { params = null; }

  function setOut(scope, key, text) {
    scope.querySelectorAll('[data-out="' + key + '"]').forEach(function (el) { el.textContent = text; });
  }
  function drawBalance(svg, cost, value) {
    if (!svg) return;
    var g = balanceGeometry(cost, value);
    var arm = svg.querySelector("[data-arm]");
    if (arm) arm.style.transform = "rotate(" + g.angle + "deg)";
    [["cost", g.cost], ["value", g.value]].forEach(function (pair) {
      var rect = svg.querySelector('[data-w="' + pair[0] + '"]');
      if (!rect) return;
      rect.setAttribute("x", pair[1].x); rect.setAttribute("y", pair[1].y);
      rect.setAttribute("width", pair[1].w); rect.setAttribute("height", pair[1].h);
    });
    svg.setAttribute("aria-label", "Year-one value " + money(value) + " against year-one cost " + money(cost));
  }
  function renderReadout(scope, s, uc) {
    setOut(scope, "cost", money(s.year_one_cost));
    setOut(scope, "value", money(s.annual_value));
    setOut(scope, "payback", paybackLabel(s.payback_months));
    setOut(scope, "multiple", multipleLabel(s.multiple_3yr));
    setOut(scope, "conservative", money(s.conservative_value));
    if (uc) setOut(scope, "investment", rangeLabel(uc.investment.low, uc.investment.high));
    drawBalance(scope.querySelector("[data-balance]"), s.year_one_cost, s.annual_value);
  }
  function formulaNote(uc) {
    var m = CAT.roiModels[uc.roi.model];
    return "Formula: " + m.formula + (m.kind === "revenue" ? ", then × gross margin" : "") + ".";
  }

  // ── Hero instrument ──────────────────────────────────────────────────────
  document.querySelectorAll("[data-instrument]").forEach(function (box) {
    var examples = [];
    try { examples = JSON.parse(box.getAttribute("data-examples") || "[]"); } catch (e) { examples = []; }
    var link = box.querySelector('[data-out="calc-link"]');
    var base = link ? link.getAttribute("href").split("?")[0] : "";
    box.querySelectorAll("[data-example]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var ex = examples[Number(chip.getAttribute("data-example"))];
        if (!ex) return;
        box.querySelectorAll("[data-example]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        setOut(box, "project", ex.project);
        setOut(box, "basis", ex.basis);
        setOut(box, "cost", money(ex.year_one_cost));
        setOut(box, "value", money(ex.annual_value));
        setOut(box, "payback", paybackLabel(ex.payback_months));
        setOut(box, "multiple", multipleLabel(ex.multiple_3yr));
        drawBalance(box.querySelector("[data-balance]"), ex.year_one_cost, ex.annual_value);
        if (link) link.setAttribute("href", base + "?uc=" + encodeURIComponent(ex.slug));
      });
    });
  });

  // ── ROI calculators (embedded and full page) ─────────────────────────────
  function inputRow(uc, field, value) {
    var id = uc.slug + "-" + field.id;
    var row = document.createElement("div");
    row.className = "row";
    var label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = field.label;
    var wrap = document.createElement("div");
    wrap.className = "unit-input" + (field.unit === "$" ? " pre" : "");
    var input = document.createElement("input");
    input.className = "input"; input.id = id; input.name = field.id; input.type = "number";
    input.setAttribute("inputmode", "decimal");
    input.min = field.min; input.max = field.max; input.step = field.step; input.value = value;
    if (field.unit === "$") { var u1 = document.createElement("span"); u1.className = "u"; u1.textContent = "$"; wrap.appendChild(u1); }
    wrap.appendChild(input);
    if (field.unit && field.unit !== "$") { var u2 = document.createElement("span"); u2.className = "u"; u2.textContent = field.unit; wrap.appendChild(u2); }
    row.appendChild(label); row.appendChild(wrap);
    return row;
  }
  function fieldsFor(uc) {
    var m = CAT.roiModels[uc.roi.model];
    var f = m.inputs.slice();
    if (m.kind === "revenue") f.push(CAT.marginInput);
    return f;
  }

  document.querySelectorAll("[data-roi]").forEach(function (box) {
    var form = box.querySelector("[data-roi-inputs]");
    var select = box.querySelector("[data-roi-select]");
    var slug = box.getAttribute("data-roi-slug");
    var ucLink = box.querySelector('[data-out="uc-link"]');

    function values() {
      var v = {};
      form.querySelectorAll("input[name]").forEach(function (i) {
        var n = parseFloat(i.value);
        v[i.name] = isFinite(n) ? n : 0;
      });
      return v;
    }
    function recalc() {
      var uc = UC[slug];
      if (!uc) return;
      var s = roiSummary(uc, CAT, values());
      renderReadout(box, s, uc);
      LL.extraLeadData.roi = { use_case: slug, annual_value: Math.round(s.annual_value), inputs: s.inputs };
      LL.extraLeadData.roi_value = Math.round(s.annual_value);
      if (!LL.extraLeadData.use_cases || !LL.extraLeadData.use_cases.length) LL.extraLeadData.use_cases = [slug];
    }
    function rebuild(newSlug) {
      slug = newSlug;
      var uc = UC[slug];
      if (!uc) return;
      box.setAttribute("data-roi-slug", slug);
      var defaults = roiDefaults(uc, CAT);
      form.innerHTML = "";
      fieldsFor(uc).forEach(function (f) { form.appendChild(inputRow(uc, f, defaults[f.id])); });
      var note = box.querySelector("[data-roi-formula]");
      if (note) note.textContent = formulaNote(uc);
      if (ucLink) ucLink.setAttribute("href", urlFor("use-cases/" + slug + "/"));
      LL.extraLeadData.use_cases = [slug];
      recalc();
    }
    form.addEventListener("input", recalc);
    if (select) {
      select.addEventListener("change", function () {
        rebuild(select.value);
        try { root.history.replaceState(null, "", "?uc=" + encodeURIComponent(select.value)); } catch (e) { /* ignore */ }
      });
      var wanted = params && params.get("uc");
      if (wanted && UC[wanted] && wanted !== slug) { select.value = wanted; rebuild(wanted); return; }
    }
    recalc();
  });

  // ── Use-case filter ──────────────────────────────────────────────────────
  var filters = document.querySelector("[data-filters]");
  if (filters) {
    var count = filters.querySelector("[data-filter-count]");
    var empty = document.querySelector("[data-filter-empty]");
    filters.querySelectorAll("[data-goal]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var goal = chip.getAttribute("data-goal");
        filters.querySelectorAll("[data-goal]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        document.querySelectorAll("[data-ledger] .ledger-group").forEach(function (group) {
          var visible = 0;
          group.querySelectorAll("li[data-goals]").forEach(function (li) {
            var ok = !goal || (" " + li.getAttribute("data-goals") + " ").indexOf(" " + goal + " ") >= 0;
            li.hidden = !ok;
            if (ok) visible += 1;
          });
          group.hidden = visible === 0;
          shown += visible;
        });
        if (count) count.textContent = goal ? "Showing " + shown + " use cases that help you " + labelOf(CAT.goals, goal).toLowerCase() + "." : "Showing all " + CAT.useCases.length + " use cases.";
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  // ── AI Opportunity Scan ──────────────────────────────────────────────────
  var wiz = document.querySelector("[data-wizard]");
  if (wiz) {
    var steps = Array.prototype.slice.call(wiz.querySelectorAll("[data-step]"));
    var results = document.querySelector("[data-results]");
    var progress = wiz.querySelector("[data-progress]");
    var stepLabel = wiz.querySelector("[data-step-label]");
    var stepCount = wiz.querySelector("[data-step-count]");
    var dimLabels = {};
    CAT.assessment.dimensions.forEach(function (d) { dimLabels[d.id] = d.label; });
    var qDim = {};
    CAT.assessment.questions.forEach(function (q) { qDim[q.id] = q.dimension; });
    var answers = {};
    var current = 0;

    if (params && params.get("industry")) {
      var sel = wiz.querySelector("#a-industry");
      if (sel) sel.value = params.get("industry");
    }

    function show(i) {
      current = clamp(i, 0, steps.length - 1);
      steps.forEach(function (s, k) { s.hidden = k !== current; });
      var key = steps[current].getAttribute("data-step");
      var label = key === "profile" ? "About your business" : key === "final" ? "Systems and budget"
        : (qDim[key] === "opportunity" ? "Opportunity" : qDim[key] === "constraint" ? "Your data" : dimLabels[qDim[key]] || "");
      if (stepLabel) stepLabel.textContent = label;
      if (stepCount) stepCount.textContent = "Step " + (current + 1) + " of " + steps.length;
      if (progress) progress.style.width = Math.round((current / (steps.length - 1)) * 100) + "%";
      var h = steps[current].querySelector("h2");
      if (h && current > 0) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }
    function checked(scope, name) {
      return Array.prototype.slice.call(scope.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
    }

    // limit goals to three
    wiz.querySelectorAll('input[name="goals"]').forEach(function (box) {
      box.addEventListener("change", function () {
        if (checked(wiz, "goals").length > 3) box.checked = false;
      });
    });
    wiz.querySelectorAll("[data-next]").forEach(function (b) { b.addEventListener("click", function () { show(current + 1); }); });
    wiz.querySelectorAll("[data-back]").forEach(function (b) { b.addEventListener("click", function () { show(current - 1); }); });
    wiz.querySelectorAll(".option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.getAttribute("data-q");
        answers[q] = Number(btn.getAttribute("data-v"));
        wiz.querySelectorAll('.option[data-q="' + q + '"]').forEach(function (o) { o.setAttribute("aria-pressed", o === btn ? "true" : "false"); });
        setTimeout(function () { show(current + 1); }, reduceMotion ? 0 : 220);
      });
    });

    function offerLink(o) {
      if (o.id === "assessment" || o.id === "pilot" || o.id === "build") return urlFor("contact/") + "?package=" + o.id;
      var uc = null;
      CAT.productized.forEach(function (x) { if (x.id === o.id && x.use_case) uc = x.use_case; });
      return uc ? urlFor("use-cases/" + uc + "/") : urlFor("contact/") + "?package=" + o.id;
    }
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    }

    function finish() {
      var final = wiz.querySelector('[data-step="final"]');
      var profileForm = wiz.querySelector('[data-step="profile"]');
      var score = scoreAssessment(answers, CAT.assessment);
      var profile = {
        industry: profileForm.querySelector("#a-industry").value || null,
        team_size: profileForm.querySelector("#a-team").value,
        goals: checked(profileForm, "goals"),
        data_stack: checked(final, "data_stack"),
        budget: final.querySelector("#a-budget").value || null,
        readiness: score.readiness,
        sensitive: score.sensitive
      };
      var timeline = final.querySelector("#a-timeline").value;
      var ranked = rankOpportunities(profile, CAT);
      var top = ranked.slice(0, 3);
      var next = recommendNextStep(score.readiness, profile.budget, ranked, CAT);

      // gauge + tier (the arc animates once results are visible)
      var fill = results.querySelector("[data-gauge-fill]");
      var txt = results.querySelector("[data-gauge-text]");
      if (fill) fill.style.strokeDashoffset = "100";
      if (txt) txt.textContent = String(score.readiness);
      results.querySelector("[data-tier-name]").textContent = score.tier.name;
      results.querySelector("[data-tier-summary]").textContent = score.tier.summary;
      results.querySelector("[data-opp]").textContent = String(score.opportunity);
      var dims = results.querySelector("[data-dims]");
      dims.innerHTML = "";
      CAT.assessment.dimensions.forEach(function (d) {
        var v = score.dimensions[d.id] || 0;
        var row = el("div", "dim");
        row.appendChild(el("span", "", d.label));
        var bar = el("div", "bar"); var fillBar = el("span"); fillBar.style.width = v + "%"; bar.appendChild(fillBar);
        row.appendChild(bar);
        row.appendChild(el("span", "val", String(v)));
        dims.appendChild(row);
      });

      // opportunities
      var list = results.querySelector("[data-opps]");
      list.innerHTML = "";
      top.forEach(function (r) {
        var uc = UC[r.slug];
        var s = roiSummary(uc, CAT);
        var li = el("li");
        var h = el("h3"); var a = el("a", "", r.name); a.href = urlFor("use-cases/" + r.slug + "/"); h.appendChild(a); li.appendChild(h);
        var why = el("ul", "why");
        (r.reasons.length ? r.reasons : ["A strong general fit for businesses like yours"]).forEach(function (x) { why.appendChild(el("li", "", x)); });
        li.appendChild(why);
        if (r.cautions.length) li.appendChild(el("p", "caution", "Plan for: " + r.cautions.join("; ").toLowerCase()));
        var figs = el("div", "figs data");
        figs.appendChild(el("span", "", "~" + r.weeks_to_value + " weeks to value"));
        figs.appendChild(el("span", "", rangeLabel(r.investment.low, r.investment.high)));
        figs.appendChild(el("span", "", "Illustrative value " + money(s.annual_value) + "/yr"));
        li.appendChild(figs);
        list.appendChild(li);
      });

      // next step
      results.querySelector("[data-next-reason]").textContent = next.reason;
      var ns = results.querySelector("[data-next-step]");
      ns.innerHTML = "";
      [[next.primary, "Recommended", true], [next.alternative, "Also worth considering", false]].forEach(function (t) {
        if (!t[0]) return;
        var card = el("div", "offer" + (t[2] ? " is-primary" : ""));
        card.appendChild(el("span", "kicker", t[1]));
        card.appendChild(el("strong", "", t[0].name));
        card.appendChild(el("span", "data", t[0].price_label));
        var go = el("a", t[2] ? "btn btn-s" : "btn btn-quiet btn-s", t[2] ? "Get started" : "Learn more");
        go.href = offerLink(t[0]);
        var act = el("div", "actions"); act.appendChild(go); card.appendChild(act);
        ns.appendChild(card);
      });

      // attach context to the lead form on this page
      LL.extraLeadData = {
        readiness: score.readiness, opportunity: score.opportunity, sensitive: score.sensitive,
        industry: profile.industry || "", team_size: profile.team_size, budget: profile.budget || "",
        timeline: timeline, goals: profile.goals, data_stack: profile.data_stack,
        top_opportunities: top.map(function (r) { return r.slug; }), use_cases: top.map(function (r) { return r.slug; }),
        package: next.primary ? next.primary.id : "", answers: answers
      };

      wiz.hidden = true;
      results.hidden = false;
      if (fill) {
        var target = String(100 - score.readiness);
        if (reduceMotion) fill.style.strokeDashoffset = target;
        else requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.strokeDashoffset = target; }); });
      }
      var heading = results.querySelector("[data-tier-name]");
      heading.setAttribute("tabindex", "-1");
      try { results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); } catch (e) { results.scrollIntoView(); }
      try { heading.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      try { if (root.plausible) root.plausible("Scan completed", { props: { readiness: String(score.readiness) } }); } catch (e) { /* ignore */ }
    }

    var finishBtn = wiz.querySelector("[data-finish]");
    if (finishBtn) finishBtn.addEventListener("click", finish);
    var restart = results && results.querySelector("[data-restart]");
    if (restart) restart.addEventListener("click", function () {
      answers = {};
      wiz.querySelectorAll(".option").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      results.hidden = true; wiz.hidden = false; show(0);
      try { wiz.scrollIntoView({ block: "start" }); } catch (e) { /* ignore */ }
    });
    show(0);
  }
})(typeof window !== "undefined" ? window : globalThis);
