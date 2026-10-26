import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from "jose";
import { underwrite, stressTests } from "../src/lib/equityscout/finance.mjs";
import { authenticate, authorizeWrite } from "../src/lib/equityscout/auth.mjs";
import { Repository, clean } from "../src/lib/equityscout/repository.mjs";
import { handleRequest } from "../src/lib/equityscout/api.mjs";
import { parseCsv, exportCsv } from "../src/lib/equityscout/research.mjs";
import { database } from "./helpers/scout-d1.mjs";
const cases = JSON.parse(
  await readFile(
    new URL("./fixtures/scout-finance.json", import.meta.url),
    "utf8",
  ),
);
for (const [index, c] of cases.entries())
  test("cloud finance matches Python fixture " + index, () => {
    const actual = underwrite(c.input, c.settings, c.as_of);
    for (const k of Object.keys(c.expected)) {
      if (k === "disclaimer") continue;
      if (typeof c.expected[k] === "number")
        assert.ok(
          Math.abs(actual[k] - c.expected[k]) < 1e-8,
          `${k}: ${actual[k]} != ${c.expected[k]}`,
        );
      else if (k === "violations")
        assert.deepEqual(
          actual[k].map((x) => x.gate),
          c.expected[k].map((x) => x.gate),
        );
      else assert.deepEqual(actual[k], c.expected[k], k);
    }
  });
test("all cloud stress scenarios match Python finances and fixed-debt cashflow", async () => {
  const c = JSON.parse(
      await readFile(
        new URL("./fixtures/scout-stress.json", import.meta.url),
        "utf8",
      ),
    ),
    actual = stressTests(c.input, {}, c.as_of);
  assert.equal(actual.length, 15);
  for (let i = 0; i < actual.length; i++)
    for (const k of [
      "all_in",
      "cashflow",
      "cash_left",
      "cashflow_at_base_debt",
    ])
      assert.ok(Math.abs(actual[i][k] - c.expected[i][k]) < 0.011, k);
});
const issuer = "https://test-team.cloudflareaccess.com",
  envBase = {
    SCOUT_ACCESS_ISSUER: issuer,
    SCOUT_ACCESS_AUD: "test-audience",
    SCOUT_OWNER_EMAIL: "owner@example.org",
    SCOUT_ORIGIN: "https://portfolio.example.org",
  };
const keys = await generateKeyPair("RS256"),
  jwk = await exportJWK(keys.publicKey);
jwk.kid = "test-key";
const resolver = createLocalJWKSet({ keys: [jwk] });
async function token(patch = {}, opts = {}) {
  return new SignJWT({ email: "owner@example.org", ...patch })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject("test-owner")
    .setIssuer(opts.issuer || issuer)
    .setAudience(opts.aud || "test-audience")
    .setIssuedAt()
    .setExpirationTime(opts.exp || "1h")
    .sign(keys.privateKey);
}
const request = (jwt, path = "bootstrap", body, csrf) =>
  new Request("https://portfolio.example.org/api/equityscout/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {}),
      ...(body === undefined
        ? {}
        : {
            Origin: "https://portfolio.example.org",
            "Content-Type": "application/json",
            "X-EquityScout-Token": csrf || "",
          }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
function db() {
  return database(
    new URL(
      "../migrations/equityscout/0001_owner_records.sql",
      import.meta.url,
    ),
  );
}
test("missing hosting config, unsigned tokens, expired tokens, wrong issuer/audience and non-owner fail closed", async () => {
  await assert.rejects(
    () => authenticate(request(null), {}),
    (e) => e.status === 503,
  );
  await assert.rejects(
    () => authenticate(request(null), envBase, resolver),
    (e) => e.status === 401,
  );
  for (const jwt of [
    "fake",
    await token({}, { aud: "wrong" }),
    await token({}, { issuer: "https://evil.example.org" }),
    await token({}, { exp: 1 }),
  ])
    await assert.rejects(
      () => authenticate(request(jwt), envBase, resolver),
      (e) => e.status === 401,
    );
  const other = await token({ email: "other@example.org" });
  await assert.rejects(
    () => authenticate(request(other), envBase, resolver),
    (e) => e.status === 403,
  );
});
test("signed owner session yields stable owner scope and token-bound CSRF; origin and CSRF bypasses fail", async () => {
  const jwt = await token(),
    identity = await authenticate(request(jwt), envBase, resolver);
  assert.equal(identity.email, "owner@example.org");
  assert.equal(identity.csrf.length, 64);
  authorizeWrite(request(jwt, "deals", {}, identity.csrf), identity);
  assert.throws(
    () => authorizeWrite(request(jwt, "deals", {}, "wrong"), identity),
    (e) => e.status === 403,
  );
  const cross = request(jwt, "deals", {}, identity.csrf);
  cross.headers.set("Origin", "https://attacker.example.org");
  assert.throws(
    () => authorizeWrite(cross, identity),
    (e) => e.status === 403,
  );
});
test("real SQLite migrations isolate owners and preserve reviewed parcel merges/audit", async () => {
  const d = db(),
    a = new Repository(d, { ownerId: "owner-a", email: "a@example.org" }),
    b = new Repository(d, { ownerId: "owner-b", email: "b@example.org" });
  await a.initialize();
  await b.initialize();
  const first = await a.save({
    ...cases[0].input,
    apn: "123-45",
    county: "Test County",
    notes: "Reviewed",
  });
  assert.equal((await b.list()).length, 0);
  assert.equal(await b.one(first.id), null);
  await assert.rejects(
    () => b.save({ ...first, arv: 999999 }),
    (e) => e.status === 404,
  );
  const merged = await a.save({
    address: "Alternate address",
    city: first.city,
    state: first.state,
    apn: "12345",
    county: "Test County",
    arv: 999999,
    arv_verified: 0,
    notes: "feed",
  });
  assert.equal(merged.id, first.id);
  assert.equal(merged.arv, first.arv);
  assert.equal(merged.notes, "Reviewed");
  assert.equal((await a.audit(first.id)).length, 2);
  assert.equal((await b.audit(first.id)).length, 0);
  assert.throws(() => d.sqlite.exec("DELETE FROM scout_audit"), /append-only/);
  d.sqlite.close();
});
test("stale edits cannot overwrite new evidence, owner fields cannot be supplied, and soft deletion keeps history", async () => {
  const d = db(),
    r = new Repository(d, { ownerId: "owner", email: "owner@example.org" });
  await r.initialize();
  const first = await r.save(cases[0].input),
    second = await r.save({ ...first, purchase_price: 51000 });
  await assert.rejects(
    () => r.save({ ...first, purchase_price: 52000 }),
    (e) => e.status === 409,
  );
  assert.throws(
    () => clean({ ...first, owner_user_id: "attacker" }),
    (e) => e.status === 400,
  );
  await assert.rejects(
    () => r.remove(second.id, first.revision),
    (e) => e.status === 409,
  );
  await r.remove(second.id, second.revision);
  assert.equal((await r.list()).length, 0);
  assert.equal((await r.audit(first.id)).length, 3);
  d.sqlite.close();
});
test("private HTTP routes require verified identity and same-origin CSRF for writes; provider calls stay disabled", async () => {
  const d = db(),
    env = { ...envBase, SCOUT_DB: d },
    jwt = await token();
  assert.equal(
    (await handleRequest({ request: request(null), env }, resolver)).status,
    401,
  );
  let response = await handleRequest({ request: request(jwt), env }, resolver),
    boot = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(boot.deals, []);
  assert.equal(boot.live_provider, false);
  response = await handleRequest(
    { request: request(jwt, "deals", cases[0].input), env },
    resolver,
  );
  assert.equal(response.status, 403);
  response = await handleRequest(
    { request: request(jwt, "deals", cases[0].input, boot.token), env },
    resolver,
  );
  assert.equal(response.status, 200);
  const record = (await response.json()).deal;
  response = await handleRequest(
    { request: request(jwt, "research", { id: record.id }, boot.token), env },
    resolver,
  );
  assert.equal((await response.json()).stress.length, 15);
  response = await handleRequest(
    { request: request(jwt, "discover", {}, boot.token), env },
    resolver,
  );
  assert.equal(response.status, 503);
  d.sqlite.close();
});
test("CSV handles quoted commas/newlines, rejects malformed rows and blocks spreadsheet formulas", () => {
  assert.deepEqual(
    parseCsv('address,city,state\n"House, one","Day\nton",OH\n'),
    [{ address: "House, one", city: "Day\nton", state: "OH" }],
  );
  assert.throws(() => parseCsv("a,a\n1,2"));
  assert.throws(() => parseCsv('a,b\n"unclosed,x'));
  assert.ok(
    exportCsv([{ notes: ' =HYPERLINK("bad")' }]).includes("' =HYPERLINK"),
  );
  assert.throws(() =>
    parseCsv("address\n" + Array(501).fill("House").join("\n")),
  );
});

test("owner cookie is signature-verified and an invalid assertion cannot fall back to a valid cookie", async () => {
  const jwt = await token(),
    req = request(null);
  req.headers.set("Cookie", "other=1; CF_Authorization=" + jwt);
  assert.equal(
    (await authenticate(req, envBase, resolver)).email,
    "owner@example.org",
  );
  req.headers.set("Cf-Access-Jwt-Assertion", "forged");
  await assert.rejects(
    () => authenticate(req, envBase, resolver),
    (e) => e.status === 401,
  );
});

test("pagination and streamed export retain every property beyond one page", async () => {
  const d = db(),
    env = { ...envBase, SCOUT_DB: d },
    jwt = await token();
  const repo = new Repository(
    d,
    await authenticate(request(jwt), env, resolver),
  );
  await repo.initialize();
  for (let i = 0; i < 53; i++)
    await repo.save({
      ...cases[0].input,
      address: `${i} Synthetic Avenue`,
      apn: "",
      county: "",
    });
  const ids = new Set();
  let offset = 0;
  do {
    const response = await handleRequest(
      { request: request(jwt, "deals?offset=" + offset), env },
      resolver,
    );
    assert.equal(response.status, 200);
    const page = await response.json();
    assert.ok(page.deals.length <= 10);
    for (const row of page.deals) {
      assert.ok(!ids.has(row.id));
      ids.add(row.id);
    }
    offset = page.next_offset;
  } while (offset !== null);
  assert.equal(ids.size, 53);
  const response = await handleRequest(
    { request: request(jwt, "export"), env },
    resolver,
  );
  const rows = parseCsv(await response.text());
  assert.equal(rows.length, 53);
  assert.equal(new Set(rows.map((r) => r.address)).size, 53);
  d.sqlite.close();
});

test("batched import strips supplied IDs and resumes without dropping records", async () => {
  const d = db(),
    env = { ...envBase, SCOUT_DB: d },
    jwt = await token();
  const boot = await (
    await handleRequest({ request: request(jwt), env }, resolver)
  ).json();
  const csv =
    "id,address,city,state\n" +
    Array.from(
      { length: 7 },
      (_, i) => `attacker,${i} Import Lane,Dayton,OH`,
    ).join("\n");
  let cursor = 0,
    total = 0;
  do {
    const response = await handleRequest(
      { request: request(jwt, "import", { csv, cursor }, boot.token), env },
      resolver,
    );
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.errors, []);
    total += result.imported;
    cursor = result.next_cursor;
  } while (cursor !== null);
  assert.equal(total, 7);
  const repo = new Repository(
    d,
    await authenticate(request(jwt), env, resolver),
  );
  assert.equal((await repo.list()).length, 7);
  assert.equal(await repo.one("attacker"), null);
  d.sqlite.close();
});

test("saved views and immutable PHA versions stay scoped to their owner", async () => {
  const d = db(),
    a = new Repository(d, { ownerId: "a", email: "a@example.org" }),
    b = new Repository(d, { ownerId: "b", email: "b@example.org" });
  await a.initialize();
  await b.initialize();
  await a.saveSearch({
    name: "Ohio research",
    state: "OH",
    term: "Dayton",
    sort: "cash",
  });
  assert.equal((await a.searches())[0].name, "Ohio research");
  assert.deepEqual(await b.searches(), []);
  const standard = {
    pha_name: "Synthetic PHA",
    zip: "45402",
    bedrooms: 3,
    effective_from: "2026-01-01",
    payment_standard: 1500,
  };
  assert.equal(await a.saveStandard(standard), true);
  assert.equal(await a.saveStandard(standard), false);
  await assert.rejects(
    () => a.saveStandard({ ...standard, payment_standard: 1600 }),
    (e) => e.status === 409,
  );
  assert.equal((await a.standards()).length, 1);
  assert.deepEqual(await b.standards(), []);
  d.sqlite.close();
});
