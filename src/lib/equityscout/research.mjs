import { HttpError } from "./auth.mjs";
import { num, cash, truth } from "./finance.mjs";
import { clean, sourceUrl } from "./repository.mjs";
export function parseCsv(text, maxRows = 500) {
  if (typeof text !== "string" || text.length > 500000)
    throw new HttpError(400, "CSV must be at most 500 KB.");
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted) quoted = false;
      else if (!field) quoted = true;
      else throw new HttpError(400, "Unexpected quote in CSV.");
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\r" || c === "\n") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
    if (rows.length > maxRows + 1)
      throw new HttpError(400, "Maximum 500 CSV records per upload.");
  }
  if (quoted) throw new HttpError(400, "Unclosed CSV quote.");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length > maxRows + 1)
    throw new HttpError(400, "Maximum 500 CSV records per upload.");
  if (!rows.length) return [];
  const headers = rows.shift().map((x) => x.trim().toLowerCase());
  if (new Set(headers).size !== headers.length || headers.some((h) => !h))
    throw new HttpError(400, "CSV header names must be unique and nonempty.");
  return rows.map((values, index) => {
    if (values.length !== headers.length)
      throw new HttpError(
        400,
        `CSV row ${index + 2} has the wrong number of columns.`,
      );
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}
export function previewImport(text) {
  const rows = [],
    errors = [];
  for (const [i, raw] of parseCsv(text).entries())
    try {
      delete raw.id;
      delete raw.revision;
      const row = clean(raw);
      if (!row.address || !row.city || !row.state)
        throw new Error("Address, city and state required");
      rows.push(row);
    } catch (e) {
      errors.push(`row ${i + 2}: ${e.message}`);
    }
  return {
    rows,
    errors,
    warning:
      "Maximum 500 rows. Duplicates merge; reviewed fields and decisions are preserved.",
  };
}
export function exportCsv(rows, columns) {
  const keys =
      columns || [...new Set(rows.flatMap((r) => Object.keys(r)))].sort(),
    escape = (v) => {
      let s =
        v === null || v === undefined
          ? ""
          : typeof v === "object"
            ? JSON.stringify(v)
            : String(v);
      let first = 0;
      while (
        first < s.length &&
        (s.charCodeAt(first) <= 32 || /\s/.test(s[first]))
      )
        first++;
      if ("=+-@".includes(s[first] || "\uffff")) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
  return [
    keys.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ].join("\r\n");
}
export function standardRecord(raw) {
  const r = {};
  for (const k of [
    "pha_name",
    "city",
    "state",
    "zip",
    "source_url",
    "source_license",
    "effective_from",
    "effective_to",
  ])
    r[k] = String(raw[k] || "")
      .trim()
      .slice(0, 5000);
  sourceUrl(r.source_url);
  if (!r.source_url || !r.pha_name || !/^\d{5}$/.test(r.zip))
    throw new HttpError(400, "PHA name, ZIP and HTTPS source required.");
  for (const k of ["effective_from", "effective_to"]) {
    const d = new Date(r[k] + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(r[k]) ||
      !Number.isFinite(+d) ||
      d.toISOString().slice(0, 10) !== r[k]
    )
      throw new HttpError(400, "Valid effective dates required.");
  }
  if (r.effective_from > r.effective_to)
    throw new HttpError(400, "Effective period reversed.");
  r.bedrooms = Number(raw.bedrooms);
  if (
    !Number.isInteger(r.bedrooms) ||
    r.bedrooms < 0 ||
    r.bedrooms > 8 ||
    num(raw.payment_standard).lte(0) ||
    num(raw.utility_allowance).lt(0)
  )
    throw new HttpError(
      400,
      "Valid bedrooms, payment standard and utility allowance required.",
    );
  r.payment_standard = cash(num(raw.payment_standard));
  r.utility_allowance = cash(num(raw.utility_allowance));
  return r;
}
export function voucherEstimate(
  property,
  standards,
  asOf = new Date().toISOString().slice(0, 10),
) {
  const matches = standards.filter(
    (r) =>
      r.zip === property.zip &&
      r.bedrooms === Number(property.beds) &&
      r.effective_from <= asOf &&
      asOf <= r.effective_to,
  );
  if (matches.length !== 1)
    return {
      status: "Needs verification",
      reason:
        "No unique current PHA/ZIP/bedroom schedule; choose and review the authority",
      matches,
      hap: null,
    };
  const r = matches[0];
  return {
    status: "Preliminary only",
    schedule: r,
    preliminary_contract_cap: cash(
      num(r.payment_standard).sub(r.utility_allowance).clamp(0, 1e9),
    ),
    hap: null,
    tenant_contribution: null,
    warning:
      "Payment standard less tenant utility allowance is a screening reference, not an approved contract rent or household HAP. Jurisdiction, rent reasonableness and inspection remain required.",
  };
}
export function backtest(rows, topN = 10) {
  const eligible = [],
    excluded = [],
    cohorts = {},
    geography = {};
  for (const [i, r] of rows.entries()) {
    const pred = Date.parse(r.prediction_date),
      sale = Date.parse(r.sale_date),
      feature = Date.parse(r.feature_as_of || r.prediction_date);
    if (
      !Number.isFinite(pred) ||
      !Number.isFinite(sale) ||
      !Number.isFinite(feature) ||
      feature > pred ||
      pred >= sale ||
      !truth(r.rights_confirmed) ||
      num(r.actual_price).lte(0) ||
      num(r.predicted_arv).lte(0)
    ) {
      excluded.push({
        row: i + 1,
        reason: "Missing rights, valid prices or time-separated observations",
      });
      continue;
    }
    eligible.push(r);
    (cohorts[String(r.prediction_date).slice(0, 7)] ||= []).push(r);
    const error = num(r.predicted_arv)
      .sub(r.actual_price)
      .abs()
      .div(r.actual_price)
      .toNumber();
    (geography[r.market || "Unknown"] ||= []).push(error);
  }
  const median = (a) => {
      if (!a.length) return null;
      const b = [...a].sort((x, y) => x - y),
        i = Math.floor(b.length / 2);
      return b.length % 2 ? b[i] : (b[i - 1] + b[i]) / 2;
    },
    error = (r) =>
      num(r.predicted_arv)
        .sub(r.actual_price)
        .abs()
        .div(r.actual_price)
        .toNumber();
  const walk = Object.entries(cohorts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, group]) => {
      const ranked = [...group]
          .sort((a, b) => num(b.frozen_score).cmp(num(a.frozen_score)))
          .slice(0, Math.min(100, Math.max(1, Number(topN) || 10))),
        labeled = ranked.filter(
          (r) =>
            r.realized_all_in !== undefined &&
            r.realized_all_in !== null &&
            r.realized_all_in !== "" &&
            r.sale_costs !== undefined &&
            r.sale_costs !== null &&
            r.sale_costs !== "",
        );
      return {
        prediction_month: month,
        observations: group.length,
        top_n: ranked.length,
        labeled: labeled.length,
        top_n_precision: labeled.length
          ? labeled.filter((r) =>
              num(r.actual_price)
                .sub(r.sale_costs)
                .sub(r.realized_all_in)
                .gte(num(r.profit_target)),
            ).length / labeled.length
          : null,
        median_absolute_percentage_error: median(group.map(error)),
      };
    });
  return {
    count: eligible.length,
    excluded,
    median_absolute_percentage_error: median(eligible.map(error)),
    walk_forward_cohorts: walk,
    geographic_error_audit: Object.fromEntries(
      Object.entries(geography).map(([k, v]) => [
        k,
        { count: v.length, median_absolute_percentage_error: median(v) },
      ]),
    ),
    error_drift_last_minus_first:
      walk.length > 1
        ? walk.at(-1).median_absolute_percentage_error -
          walk[0].median_absolute_percentage_error
        : null,
    calibrated_probability: null,
    limitation:
      "Retrospective frozen-score audit only; no trained model or calibrated probability claimed.",
  };
}
