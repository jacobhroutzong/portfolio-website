import { NUMBER_FIELDS, BOOL_FIELDS, TEXT_FIELDS } from "./catalog.mjs";
import { truth, num, underwrite } from "./finance.mjs";
import { HttpError, sha256 } from "./auth.mjs";
const moneyFields = new Set(
  NUMBER_FIELDS.filter(
    (k) =>
      ![
        "beds",
        "baths",
        "sqft",
        "verified_comp_count",
        "holding_months",
        "title_months",
        "existing_loan_months",
        "auction_premium_pct",
        "min_recovery_pct",
      ].includes(k),
  ),
);
const norm = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function sourceUrl(value) {
  if (!value) return;
  let u;
  try {
    u = new URL(value);
  } catch {
    throw new HttpError(400, "Source URL must be a valid HTTPS URL.");
  }
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    [...u.searchParams.keys()].some((k) =>
      /^(key|api_key|apikey|token|access_token|secret|password|authorization)$/i.test(
        k,
      ),
    )
  )
    throw new HttpError(
      400,
      "Source URL must use HTTPS and contain no credentials.",
    );
}
export function clean(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new HttpError(400, "JSON object required.");
  if (["owner_id", "owner_user_id"].some((k) => Object.hasOwn(input, k)))
    throw new HttpError(400, "Owner identity is server-controlled.");
  const out = {};
  for (const k of NUMBER_FIELDS) {
    if (!Object.hasOwn(input, k)) continue;
    const v = input[k];
    if (v === null || v === "") {
      out[k] = null;
      continue;
    }
    const n = Number(v);
    if (
      !Number.isFinite(n) ||
      n < 0 ||
      n > 1e9 ||
      (["holding_months", "title_months", "existing_loan_months"].includes(k) &&
        n > 1200) ||
      (["auction_premium_pct", "min_recovery_pct"].includes(k) && n > 1) ||
      (k === "min_recovery_pct" && n > 0 && n < 0.0001)
    )
      throw new HttpError(400, "Nonnegative finite amount required: " + k);
    out[k] = moneyFields.has(k) ? num(v).toFixed(2) : n;
  }
  for (const k of BOOL_FIELDS)
    if (Object.hasOwn(input, k)) out[k] = truth(input[k]) ? 1 : 0;
  for (const k of TEXT_FIELDS) {
    if (
      !Object.hasOwn(input, k) ||
      ["updated_at", "date_added", "offer_approved_at"].includes(k)
    )
      continue;
    out[k] = input[k] === null ? null : String(input[k]).trim().slice(0, 5000);
  }
  for (const k of ["comps", "scope", "events"])
    if (Object.hasOwn(input, k)) {
      if (
        !Array.isArray(input[k]) ||
        input[k].length > 300 ||
        input[k].some((v) => !v || typeof v !== "object" || Array.isArray(v))
      )
        throw new HttpError(400, "Expected a bounded list of records: " + k);
      out[k] = input[k];
      for (const row of out[k])
        for (const [name, value] of Object.entries(row))
          if (name === "source_url") sourceUrl(value);
    }
  sourceUrl(out.source_url);
  if (out.state && !/^[A-Z]{2}$/.test(out.state))
    throw new HttpError(400, "Use a two-letter uppercase state.");
  return out;
}
const hydrate = (row) =>
  row
    ? {
        ...JSON.parse(row.payload),
        id: row.id,
        revision: row.revision,
        date_added: row.created_at.slice(0, 10),
        updated_at: row.updated_at,
      }
    : null;
export class Repository {
  constructor(db, identity) {
    this.db = db;
    this.owner = identity.ownerId;
    this.email = identity.email;
  }
  async initialize() {
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO scout_owners(owner_id,email,created_at) VALUES(?,?,?)",
      )
      .bind(this.owner, this.email, new Date().toISOString())
      .run();
  }
  async list(offset = 0, limit = 100) {
    const r = await this.db
      .prepare(
        "SELECT id,payload,revision,created_at,updated_at FROM scout_records WHERE owner_id=? AND deleted=0 ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?",
      )
      .bind(this.owner, limit, offset)
      .all();
    return r.results.map(hydrate);
  }
  async one(id) {
    return hydrate(
      await this.db
        .prepare(
          "SELECT id,payload,revision,created_at,updated_at FROM scout_records WHERE owner_id=? AND id=? AND deleted=0",
        )
        .bind(this.owner, String(id))
        .first(),
    );
  }
  async preferences() {
    const row = await this.db
      .prepare("SELECT payload FROM scout_preferences WHERE owner_id=?")
      .bind(this.owner)
      .first();
    return row ? JSON.parse(row.payload) : {};
  }
  async savePreferences(payload) {
    await this.db
      .prepare(
        "INSERT INTO scout_preferences(owner_id,payload) VALUES(?,?) ON CONFLICT(owner_id) DO UPDATE SET payload=excluded.payload,revision=revision+1",
      )
      .bind(this.owner, JSON.stringify(payload))
      .run();
  }
  async save(input, policy = {}) {
    const d = clean(input),
      explicit = Boolean(d.id);
    if (!d.address || !d.city || !d.state)
      throw new HttpError(400, "Address, city and state required.");
    let old = explicit ? await this.one(d.id) : null;
    if (explicit && !old) throw new HttpError(404, "Property not found.");
    const identity = [d.address, d.city, d.state].map(norm).join("|"),
      parcel =
        d.apn && d.county
          ? [d.apn, d.county, d.state].map(norm).join("|")
          : null;
    if (
      old &&
      ["address", "city", "state"].some((k) => norm(old[k]) !== norm(d[k]))
    )
      throw new HttpError(
        400,
        "Existing property identity cannot be redirected.",
      );
    if (!old) {
      const r = await this.db
        .prepare(
          "SELECT id,payload,revision,created_at,updated_at FROM scout_records WHERE owner_id=? AND deleted=0 AND (identity_key=? OR (parcel_key IS NOT NULL AND parcel_key=?)) LIMIT 1",
        )
        .bind(this.owner, identity, parcel)
        .first();
      old = hydrate(r);
    }
    if (old && !explicit) {
      const protectedKeys = new Set([
        "id",
        "status",
        "notes",
        "date_added",
        "address",
        "city",
        "state",
        "offer_approved",
        "offer_approved_at",
        "demo",
      ]);
      for (const [flag, keys] of Object.entries({
        arv_verified: [
          "arv",
          "arv_source",
          "arv_verified",
          "verified_comp_count",
          "comps",
        ],
        rehab_verified: [
          "rehab_budget",
          "rehab_source",
          "rehab_verified",
          "scope",
        ],
        rent_verified: [
          "contract_rent",
          "rent_source",
          "rent_verified",
          "pha_source",
          "pha_approved",
          "inspection_passed",
          "rent_reasonable",
        ],
      }))
        if (old[flag]) keys.forEach((k) => protectedKeys.add(k));
      for (const k of protectedKeys) delete d[k];
    }
    if (old && explicit && Number(input.revision) !== old.revision)
      throw new HttpError(
        409,
        "This property changed. Refresh before saving.",
        "REVISION_CONFLICT",
      );
    if (!old) {
      const count = await this.db
        .prepare(
          "SELECT COUNT(*) AS n FROM scout_records WHERE owner_id=? AND deleted=0",
        )
        .bind(this.owner)
        .first();
      if (count.n >= 1000)
        throw new HttpError(
          409,
          "The private pilot supports up to 1,000 active properties. Archive records before importing more.",
        );
    }
    const merged = { ...(old || {}), ...d },
      now = new Date().toISOString();
    delete merged.revision;
    delete merged.updated_at;
    merged.id = old?.id || crypto.randomUUID();
    merged.date_added = old?.date_added || now.slice(0, 10);
    merged.status = merged.status || "Research";
    if (
      old &&
      NUMBER_FIELDS.some(
        (k) => String(old[k] ?? "") !== String(merged[k] ?? ""),
      )
    ) {
      merged.offer_approved = 0;
      merged.offer_approved_at = "";
    }
    if (merged.offer_approved && !old?.offer_approved)
      merged.offer_approved_at = now;
    if (
      ["Offer planned", "Offer submitted", "Under contract"].includes(
        merged.status,
      ) &&
      merged.status !== old?.status &&
      (!merged.offer_approved || !underwrite(merged, policy).verified_ready)
    )
      throw new HttpError(
        400,
        "Entering an offer stage requires verified economics and manual approval.",
      );
    if (new TextEncoder().encode(JSON.stringify(merged)).length > 131072)
      throw new HttpError(400, "A property record must be at most 128 KB.");
    const ik = [merged.address, merged.city, merged.state].map(norm).join("|"),
      pk =
        merged.apn && merged.county
          ? [merged.apn, merged.county, merged.state].map(norm).join("|")
          : null,
      payload = JSON.stringify(merged);
    try {
      if (old) {
        const result = await this.db
          .prepare(
            "UPDATE scout_records SET identity_key=?,parcel_key=?,payload=?,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=? AND deleted=0 RETURNING id",
          )
          .bind(ik, pk, payload, now, this.owner, old.id, old.revision)
          .first();
        if (!result)
          throw new HttpError(
            409,
            "This property changed. Refresh before saving.",
            "REVISION_CONFLICT",
          );
      } else
        await this.db
          .prepare(
            "INSERT INTO scout_records(owner_id,id,identity_key,parcel_key,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
          )
          .bind(this.owner, merged.id, ik, pk, payload, now, now)
          .run();
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(
        409,
        "Property identity conflicts with an existing record. Refresh before retrying.",
      );
    }
    return this.one(merged.id);
  }
  async remove(id, revision) {
    const result = await this.db
      .prepare(
        "UPDATE scout_records SET deleted=1,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=? AND deleted=0 RETURNING id",
      )
      .bind(new Date().toISOString(), this.owner, String(id), Number(revision))
      .first();
    if (!result)
      throw new HttpError(
        409,
        "Property changed or is unavailable. Refresh before deleting.",
      );
    return 1;
  }
  async audit(id) {
    const r = await this.db
      .prepare(
        "SELECT action,occurred,details FROM scout_audit WHERE owner_id=? AND item_id=? ORDER BY id DESC LIMIT 50",
      )
      .bind(this.owner, String(id))
      .all();
    return r.results;
  }
  async standards() {
    const r = await this.db
      .prepare(
        "SELECT payload FROM scout_pha WHERE owner_id=? ORDER BY created_at DESC LIMIT 1000",
      )
      .bind(this.owner)
      .all();
    return r.results.map((r) => JSON.parse(r.payload));
  }
  async saveStandard(row) {
    const key = await sha256(
        [row.pha_name, row.zip, row.bedrooms, row.effective_from].join("|"),
      ),
      old = await this.db
        .prepare(
          "SELECT payload FROM scout_pha WHERE owner_id=? AND version_key=?",
        )
        .bind(this.owner, key)
        .first();
    if (old) {
      if (old.payload !== JSON.stringify(row))
        throw new HttpError(
          409,
          "Conflicting PHA version; existing version retained.",
        );
      return false;
    }
    await this.db
      .prepare(
        "INSERT INTO scout_pha(owner_id,version_key,payload,created_at) VALUES(?,?,?,?)",
      )
      .bind(this.owner, key, JSON.stringify(row), new Date().toISOString())
      .run();
    return true;
  }
  async searches() {
    const r = await this.db
      .prepare(
        "SELECT id,payload FROM scout_saved_searches WHERE owner_id=? ORDER BY created_at DESC LIMIT 100",
      )
      .bind(this.owner)
      .all();
    return r.results.map((r) => ({ id: r.id, ...JSON.parse(r.payload) }));
  }
  async saveSearch(value) {
    const id = crypto.randomUUID(),
      payload = {
        name: String(value.name || "Saved search").slice(0, 100),
        term: String(value.term || "").slice(0, 200),
        state: String(value.state || "ALL").slice(0, 3),
        sort: ["score", "cash", "price", "recent"].includes(value.sort)
          ? value.sort
          : "score",
      };
    await this.db
      .prepare(
        "INSERT INTO scout_saved_searches(owner_id,id,payload,created_at) VALUES(?,?,?,?)",
      )
      .bind(this.owner, id, JSON.stringify(payload), new Date().toISOString())
      .run();
    return { id, ...payload };
  }
}
