// Deterministic cloud port of engine.py. Dollar inputs; Decimal arithmetic; cents at output.
import Decimal from "decimal.js";
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export const DEFAULTS = {
  target_ratio: 0.75,
  rehab_contingency_pct: 0.15,
  purchase_closing_pct: 0.03,
  refi_closing_pct: 0.03,
  holding_months: 4,
  holding_monthly: 550,
  ltv: 0.7,
  annual_rate: 0.085,
  loan_years: 30,
  min_dscr: 1.2,
  min_cashflow: 250,
  vacancy_pct: 0.05,
  management_pct: 0.08,
  repairs_pct: 0.08,
  capex_pct: 0.07,
  sale_cost_pct: 0.09,
  other_monthly: 60,
  tax_monthly: 185,
  insurance_monthly: 130,
};
export function num(v, fallback = 0) {
  try {
    const x = new Decimal(v === null || v === undefined ? "NaN" : String(v));
    return x.isFinite() ? x : new Decimal(fallback);
  } catch {
    return new Decimal(fallback);
  }
}
export const truth = (v) =>
  ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
export const cash = (v) =>
  v === null ? null : num(v).toDecimalPlaces(2).toNumber();
const max = (...v) => Decimal.max(...v),
  min = (...v) => Decimal.min(...v);
export function monthlyPayment(principal, rate, years) {
  const p = max(0, num(principal)),
    r = max(0, num(rate)).div(12),
    n = max(1, num(years, 30).mul(12).trunc());
  return r.isZero()
    ? p.div(n)
    : p.mul(r).div(new Decimal(1).sub(new Decimal(1).add(r).pow(n.neg())));
}
export function validateSettings(data = {}) {
  const s = {};
  for (const [k, v] of Object.entries({ ...DEFAULTS, ...data })) {
    if (!(k in DEFAULTS)) continue;
    let x;
    try {
      x = new Decimal(String(v));
    } catch {
      throw new Error("Finite setting required: " + k);
    }
    const hi =
      k.endsWith("_pct") || ["target_ratio", "ltv", "annual_rate"].includes(k)
        ? 1
        : 10000;
    if (!x.isFinite() || x.lt(0) || x.gt(hi))
      throw new Error("Out-of-range setting: " + k);
    s[k] = x;
  }
  if (s.min_dscr.lte(0) || s.loan_years.lte(0))
    throw new Error("DSCR and loan years must be positive");
  if (
    s.vacancy_pct
      .add(s.management_pct)
      .add(s.repairs_pct)
      .add(s.capex_pct)
      .gte(1)
  )
    throw new Error("Operating percentages must total less than 100%");
  return s;
}
function day(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const d = new Date(value + "T00:00:00Z");
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value
    ? d
    : null;
}
export function selectComps(
  subject,
  comps = [],
  asOf = new Date().toISOString().slice(0, 10),
) {
  const today = day(asOf),
    accepted = [],
    excluded = [],
    seen = new Set();
  for (const c of comps) {
    const reasons = [],
      key = String(c.parcel_id || c.source_url || ""),
      sold = day(c.sold_date),
      age = today && sold ? (today - sold) / 86400000 : -1;
    if (age < 0 || age > 180)
      reasons.push("Sale must precede valuation and be within 180 days");
    if (c.sale_status !== "closed") reasons.push("Not a closed sale");
    if (c.condition !== "renovated")
      reasons.push("Renovated condition unconfirmed");
    if (!truth(c.rights_confirmed) || !c.source_url)
      reasons.push("Source and rights required");
    if (c.property_type !== subject.deal_type)
      reasons.push("Property type differs");
    const size = num(c.sqft),
      ss = num(subject.sqft);
    if (size.lte(0) || ss.lte(0) || size.div(ss).sub(1).abs().gt(0.25))
      reasons.push("Size outside 25% band");
    if (
      c.distance_miles === undefined ||
      c.distance_miles === null ||
      num(c.distance_miles).lt(0) ||
      num(c.distance_miles).gt(1)
    )
      reasons.push("Distance unknown or exceeds 1 mile");
    if (c.same_market_area !== true)
      reasons.push("Market boundary review required");
    if (
      num(c.beds).sub(num(subject.beds)).abs().gt(1) ||
      num(c.baths).sub(num(subject.baths)).abs().gt(1)
    )
      reasons.push("Bedroom/bathroom mismatch");
    if (num(c.sold_price).lte(0)) reasons.push("Positive sold price required");
    if (!key || seen.has(key))
      reasons.push("Missing or duplicate source identity");
    seen.add(key);
    if (reasons.length) {
      excluded.push({ id: key, reasons });
      continue;
    }
    const adjustment = num(c.adjustment_dollars);
    if (adjustment.abs().gt(num(c.sold_price).mul(0.2))) {
      excluded.push({
        id: key,
        reasons: ["Adjustment exceeds 20% review band"],
      });
      continue;
    }
    accepted.push({
      ...c,
      adjusted_price: cash(num(c.sold_price).add(adjustment)),
    });
  }
  const values = accepted
      .map((c) => num(c.adjusted_price))
      .sort((a, b) => a.cmp(b)),
    mid = values.length
      ? values.length % 2
        ? values[Math.floor(values.length / 2)]
        : values[values.length / 2 - 1].add(values[values.length / 2]).div(2)
      : null;
  return {
    accepted,
    excluded,
    median_arv: cash(mid),
    conservative_arv: values.length ? cash(values[0].mul(0.95)) : null,
    ready_for_manual_review: values.length >= 3,
    confidence: "Evidence sample; not a calibrated probability",
    method:
      "Adjusted median; conservative floor 95% of minimum accepted sale. No statistical confidence interval claimed.",
  };
}
export function underwrite(
  d,
  settings = {},
  asOf = new Date().toISOString().slice(0, 10),
) {
  const s = validateSettings(settings),
    get = (k, f = 0) => max(0, num(d[k], f)),
    p = get("purchase_price"),
    rehab = get("rehab_budget"),
    arv = get("arv"),
    rent = get("contract_rent");
  const tax = get("tax_monthly", s.tax_monthly),
    ins = get("insurance_monthly", s.insurance_monthly),
    other = get("other_monthly", s.other_monthly)
      .add(get("landlord_utilities"))
      .add(get("hoa_monthly"));
  const holding = get("holding_months", s.holding_months).mul(
    get("holding_monthly", s.holding_monthly),
  );
  const fixed = [
    "fixed_acquisition_costs",
    "assignment_fee",
    "permit_costs",
    "financing_costs",
    "title_contingency",
    "senior_liens",
    "auction_premium_fixed",
  ].reduce((a, k) => a.add(get(k)), new Decimal(0));
  const contingency = rehab.mul(s.rehab_contingency_pct),
    mult = new Decimal(1)
      .add(s.purchase_closing_pct)
      .add(get("auction_premium_pct")),
    allIn = p.mul(mult).add(rehab).add(contingency).add(fixed).add(holding);
  const offer = arv.gt(0)
    ? max(
        0,
        s.target_ratio
          .mul(arv)
          .sub(rehab)
          .sub(contingency)
          .sub(fixed)
          .sub(holding)
          .div(mult),
      )
    : new Decimal(0);
  const reserves = rent.mul(s.repairs_pct.add(s.capex_pct)),
    noi = rent.gt(0)
      ? rent
          .mul(new Decimal(1).sub(s.vacancy_pct).sub(s.management_pct))
          .sub(tax)
          .sub(ins)
          .sub(other)
      : null,
    econ = noi === null ? null : noi.sub(reserves);
  const unit = monthlyPayment(1, s.annual_rate, s.loan_years),
    cap = rent.gt(0) ? max(0, econ.div(s.min_dscr).div(unit)) : new Decimal(0),
    cfCap =
      econ === null
        ? new Decimal(0)
        : max(0, econ.sub(s.min_cashflow).div(unit));
  const ltv = arv.mul(s.ltv),
    loan =
      arv.gt(0) && rent.gt(0)
        ? min(
            ltv,
            cap,
            cfCap,
            get("lender_limit", ltv),
            get("appraised_basis", arv).mul(s.ltv),
          )
        : new Decimal(0),
    debt = monthlyPayment(loan, s.annual_rate, s.loan_years),
    cf = econ === null ? null : econ.sub(debt),
    dscr = debt.gt(0) ? econ.div(debt) : null;
  const reficost = loan
      .mul(s.refi_closing_pct)
      .add(get("refi_reserves"))
      .add(get("prepayment_penalty")),
    payoff = get("debt_payoff"),
    funded = get("acquisition_debt_funded"),
    initial = max(0, allIn.sub(funded)),
    net = loan.sub(reficost).sub(payoff),
    left = initial.sub(net);
  const seasoning =
      get("title_months").gte(6) &&
      (payoff.isZero() || get("existing_loan_months").gte(12)),
    lender = truth(d.lender_verified) && Boolean(d.lender_source),
    compReview = selectComps(d, d.comps || [], asOf),
    comps = compReview.accepted.length;
  let rentOk = truth(d.rent_verified) && Boolean(d.rent_source);
  if (d.rent_mode !== "conventional")
    rentOk =
      rentOk &&
      truth(d.pha_approved) &&
      truth(d.inspection_passed) &&
      truth(d.rent_reasonable) &&
      Boolean(d.pha_source);
  const sourceDay = day(d.source_date),
    today = day(asOf),
    age = sourceDay ? (today - sourceDay) / 86400000 : null;
  const gates = {
    "75pct_rule": arv.gt(0) && allIn.lte(s.target_ratio.mul(arv)),
    cashflow: cf !== null && cf.gte(s.min_cashflow.sub(0.005)),
    dscr: dscr !== null && dscr.gte(s.min_dscr),
    verified_arv:
      truth(d.arv_verified) &&
      comps >= 3 &&
      Boolean(d.arv_source) &&
      arv.lte(num(compReview.conservative_arv)),
    verified_rehab: truth(d.rehab_verified) && Boolean(d.rehab_source),
    verified_rent: rentOk,
    seasoning,
    lender,
    cost_sources: truth(d.tax_verified) && truth(d.insurance_verified),
    source_rights: truth(d.source_rights) && Boolean(d.source_url),
    fresh_source: age !== null && age >= 0 && age <= 90,
    real_record: !truth(d.demo),
    cash_basis: funded.lte(allIn) && (payoff.isZero() || funded.gt(0)),
  };
  const missing = [];
  if (arv.isZero()) missing.push("Conservative ARV and sold comps");
  if (rehab.isZero()) missing.push("Rehab budget");
  if (rent.isZero()) missing.push("Proposed contract rent");
  if (!gates.verified_arv) missing.push("3+ verified renovated sold comps");
  if (!gates.verified_rehab) missing.push("Contractor-verified rehab costs");
  if (!rentOk)
    missing.push(
      d.rent_mode === "conventional"
        ? "Market rent evidence"
        : "PHA rent validation",
    );
  for (const [k, label] of [
    ["seasoning", "Six-month title / twelve-month existing mortgage seasoning"],
    ["lender", "Lender term sheet and eligibility review"],
    ["cost_sources", "Tax reassessment and insurance quote"],
    ["source_rights", "Source document/link and data rights"],
    ["real_record", "Synthetic demonstration only"],
    ["cash_basis", "Debt-funded acquisition cash basis"],
    ["fresh_source", "Property source timestamp within 90 days"],
  ])
    if (!gates[k]) missing.push(label);
  const status = missing.length
      ? "VERIFY"
      : Object.values(gates).every(Boolean)
        ? "PASS"
        : "FAIL",
    allowed = new Set([
      "vacant",
      "tax_delinquent",
      "code_violation",
      "absentee_owner",
      "foreclosure_notice",
      "auction",
      "long_dom",
      "price_reduced",
      "land_bank",
      "expired_listing",
    ]),
    count = new Set(
      String(d.signals || "")
        .split(",")
        .filter((x) => allowed.has(x)),
    ).size;
  const econScore = arv.gt(0)
      ? max(
          0,
          min(
            100,
            new Decimal(1)
              .sub(allIn.div(arv))
              .mul(100)
              .add(cf === null ? 0 : max(0, cf).div(20)),
          ),
        )
          .trunc()
          .toNumber()
      : 0,
    evidence = Object.entries(gates)
      .filter(([k]) => !["75pct_rule", "cashflow", "dscr"].includes(k))
      .map(([, v]) => v),
    confidence = Math.trunc(
      (100 * evidence.filter(Boolean).length) / evidence.length,
    );
  const ceilings = { "ARV discount": cash(offer) };
  for (const [field, label] of [
    ["max_available_cash", "Available cash"],
    ["auction_max_bid", "Auction bid"],
  ])
    if (d[field] !== null && d[field] !== undefined && d[field] !== "")
      ceilings[label] =
        field === "max_available_cash"
          ? cash(
              max(
                0,
                get(field)
                  .add(funded)
                  .sub(rehab)
                  .sub(contingency)
                  .sub(fixed)
                  .sub(holding)
                  .div(mult),
              ),
            )
          : cash(get(field));
  if (
    d.flip_profit_target !== null &&
    d.flip_profit_target !== undefined &&
    d.flip_profit_target !== ""
  )
    ceilings["Flip target"] = cash(
      max(
        0,
        arv
          .mul(new Decimal(1).sub(s.sale_cost_pct))
          .sub(get("flip_profit_target"))
          .sub(rehab)
          .sub(contingency)
          .sub(fixed)
          .sub(holding)
          .div(mult),
      ),
    );
  if (cf === null || cf.lt(s.min_cashflow.sub(0.005)))
    ceilings["Cashflow floor not met at modeled refinance"] = 0;
  if (
    d.max_cash_left !== null &&
    d.max_cash_left !== undefined &&
    d.max_cash_left !== ""
  )
    ceilings["Cash left after refinance"] = cash(
      max(
        0,
        net
          .add(get("max_cash_left"))
          .add(funded)
          .sub(rehab)
          .sub(contingency)
          .sub(fixed)
          .sub(holding)
          .div(mult),
      ),
    );
  if (
    d.min_recovery_pct !== null &&
    d.min_recovery_pct !== undefined &&
    d.min_recovery_pct !== "" &&
    get("min_recovery_pct").gt(0)
  )
    ceilings["Cash recovery target"] = cash(
      max(
        0,
        net
          .div(get("min_recovery_pct"))
          .add(funded)
          .sub(rehab)
          .sub(contingency)
          .sub(fixed)
          .sub(holding)
          .div(mult),
      ),
    );
  const binding = Object.keys(ceilings).reduce((a, b) =>
    ceilings[a] <= ceilings[b] ? a : b,
  );
  return {
    all_in: cash(allIn),
    maximum_offer: ceilings[binding],
    walk_away_price: ceilings[binding],
    offer_ceilings: ceilings,
    binding_constraint: binding,
    after_repair_value: cash(arv),
    ratio: arv.gt(0) ? allIn.div(arv).toNumber() : null,
    equity_spread: arv.gt(0) ? cash(arv.sub(allIn)) : null,
    capex_and_contingency: cash(contingency),
    hold_cost: cash(holding),
    operating_costs:
      econ === null ? cash(tax.add(ins).add(other)) : cash(rent.sub(econ)),
    accounting_noi_monthly: cash(noi),
    noi_monthly: cash(econ),
    reserves_monthly: cash(reserves),
    ltv_loan_cap: cash(ltv),
    dscr_loan_cap: cash(cap),
    cashflow_loan_cap: cash(cfCap),
    loan: cash(loan),
    refinance_cost: cash(reficost),
    refinance_cash_out: seasoning && lender ? cash(max(0, net)) : 0,
    projected_net_refinance: cash(net),
    initial_cash: cash(initial),
    cash_left: cash(left),
    refi_equity: arv.gt(0) ? cash(arv.sub(loan)) : null,
    debt_payment: cash(debt),
    cashflow: cash(cf),
    dscr: dscr === null ? null : dscr.toDecimalPlaces(3).toNumber(),
    flip_net: arv.gt(0)
      ? cash(arv.mul(new Decimal(1).sub(s.sale_cost_pct)).sub(allIn))
      : null,
    wholesale_net: cash(get("wholesale_fee").sub(get("wholesale_costs"))),
    wholesale_status: "Human legal/title review required",
    score: missing.length ? Math.min(econScore, 40) : econScore,
    scores: {
      version: "1.0",
      discovery_priority: Math.min(100, count * 15),
      deal_economics: econScore,
      execution_risk: 100 - confidence,
    },
    violations: Object.entries(gates)
      .filter(([, v]) => !v)
      .map(([gate]) => ({
        gate,
        actual:
          gate === "75pct_rule"
            ? cash(allIn)
            : gate === "cashflow"
              ? cash(cf)
              : gate === "dscr" && dscr !== null
                ? dscr.toNumber()
                : null,
        required:
          gate === "75pct_rule"
            ? cash(s.target_ratio.mul(arv))
            : gate === "cashflow"
              ? cash(s.min_cashflow)
              : gate === "dscr"
                ? s.min_dscr.toNumber()
                : "Documented, current evidence",
      })),
    status,
    missing,
    gates,
    verified_ready: !missing.length && Object.values(gates).every(Boolean),
    return_on_unrecovered_cash:
      cf !== null && left.gt(0) ? cf.mul(12).div(left).toNumber() : null,
    gross_rent: cash(rent.add(get("utility_allowance"))),
    hap: null,
    tenant_contribution: null,
    disclaimer:
      "Screening estimates; cash left is a future eligible-refinance scenario. Not an appraisal, approved rent or financing commitment.",
  };
}
export function estimateScope(lines = [], contingency = 0.2) {
  const pct = num(contingency);
  if (pct.lt(0.15) || pct.gt(0.5))
    throw new Error("Contingency must be 15–50%");
  let total = new Decimal(0);
  const result = lines.map((line) => {
    const q = num(line.quantity),
      cost = num(line.unit_cost);
    if (q.lt(0) || cost.lt(0))
      throw new Error("Nonnegative quantities and USD unit costs required");
    const subtotal = q.mul(cost);
    total = total.add(subtotal);
    return {
      ...line,
      subtotal: cash(subtotal),
      provisional: !line.quote_source,
    };
  });
  return {
    lines: result,
    base: cash(total),
    contingency: cash(total.mul(pct)),
    total: cash(total.mul(new Decimal(1).add(pct))),
    needs_quotes: result.some((r) => r.provisional),
  };
}
export function stressTests(d, settings = {}, asOf) {
  const base = underwrite(d, settings, asOf),
    configs = [];
  for (const [k, multipliers] of [
    ["arv", [0.95, 0.9, 0.8]],
    ["rehab_budget", [1.1, 1.25, 1.4]],
    ["contract_rent", [0.9, 0.8]],
  ])
    for (const m of multipliers)
      configs.push([
        `${k === "arv" ? "ARV" : k === "rehab_budget" ? "Rehab" : "Rent"} ${m < 1 ? "-" : "+"}${Math.round(Math.abs(m - 1) * 100)}%`,
        { [k]: num(d[k]).mul(m).toNumber() },
        {},
      ]);
  for (const months of [6, 12, 24, 36])
    configs.push([`${months}-month carry`, { holding_months: months }, {}]);
  configs.push([
    "Tax/insurance +50%, vacancy 15%",
    {
      tax_monthly: num(d.tax_monthly, DEFAULTS.tax_monthly).mul(1.5).toNumber(),
      insurance_monthly: num(d.insurance_monthly, DEFAULTS.insurance_monthly)
        .mul(1.5)
        .toNumber(),
    },
    { vacancy_pct: 0.15 },
  ]);
  for (const points of [1, 2])
    configs.push([
      `Rate +${points} points`,
      {},
      {
        annual_rate: num(settings.annual_rate, DEFAULTS.annual_rate)
          .add(points / 100)
          .toNumber(),
      },
    ]);
  return configs.map(([label, changes, policy]) => {
    const cfg = { ...settings, ...policy },
      a = underwrite({ ...d, ...changes }, cfg, asOf),
      fixed = monthlyPayment(
        base.loan,
        cfg.annual_rate ?? DEFAULTS.annual_rate,
        cfg.loan_years ?? DEFAULTS.loan_years,
      );
    return {
      label,
      ...Object.fromEntries(
        ["all_in", "ratio", "cashflow", "cash_left", "gates"].map((k) => [
          k,
          a[k],
        ]),
      ),
      cashflow_at_base_debt:
        a.noi_monthly === null ? null : cash(num(a.noi_monthly).sub(fixed)),
      explanation:
        "Cashflow/cash left resize the future refinance. Fixed-loan cashflow holds baseline principal and applies scenario rate.",
    };
  });
}
