import { authenticate, authorizeWrite, HttpError } from "./auth.mjs";
import { Repository } from "./repository.mjs";
import {
  DEFAULTS,
  underwrite,
  validateSettings,
  selectComps,
  estimateScope,
  stressTests,
} from "./finance.mjs";
import {
  MARKETS,
  NUMBER_FIELDS,
  BOOL_FIELDS,
  TEXT_FIELDS,
} from "./catalog.mjs";
import {
  parseCsv,
  previewImport,
  exportCsv,
  standardRecord,
  voucherEstimate,
  backtest,
} from "./research.mjs";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};
function send(payload, status = 200) {
  return Response.json(payload, { status, headers });
}
async function body(request) {
  const maximum = 524288;
  if (Number(request.headers.get("Content-Length") || 0) > maximum)
    throw new HttpError(413, "Maximum request size is 512 KB.");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const parts = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maximum) {
      await reader.cancel();
      throw new HttpError(413, "Maximum request size is 512 KB.");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.length;
  }
  let result;
  try {
    result = JSON.parse(new TextDecoder().decode(bytes) || "{}");
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw new HttpError(400, "JSON object required.");
  return result;
}
export async function handleRequest(context, keyResolver) {
  const { request, env } = context;
  try {
    const identity = await authenticate(request, env, keyResolver);
    if (!env.SCOUT_DB)
      throw new HttpError(
        503,
        "Private database binding is missing. No property data is available.",
        "DATABASE_NOT_CONFIGURED",
      );
    const repo = new Repository(env.SCOUT_DB, identity);
    await repo.initialize();
    const path = new URL(request.url).pathname
        .replace(/^\/api\/equityscout\/?/, "")
        .replace(/\/$/, ""),
      settings = { ...DEFAULTS, ...(await repo.preferences()) },
      enriched = async (policy = settings) => {
        const offset = Math.max(
            0,
            Math.min(
              1000,
              Math.trunc(
                Number(new URL(request.url).searchParams.get("offset")) || 0,
              ),
            ),
          ),
          rows = await repo.list(offset, 11);
        return {
          deals: rows
            .slice(0, 10)
            .map((d) => ({ ...d, analysis: underwrite(d, policy) })),
          next_offset: rows.length > 10 ? offset + 10 : null,
        };
      };
    if (request.method === "GET") {
      if (path === "bootstrap")
        return send({
          token: identity.csrf,
          ...(await enriched()),
          settings,
          markets: MARKETS,
          live_provider: false,
          searches: await repo.searches(),
          identity: { email: identity.email },
          hosting: "Cloudflare private owner workstation",
          page_size: 10,
        });
      if (path === "deals")
        return send({ ...(await enriched()), page_size: 10 });
      if (path === "export") {
        const columns = [
          ...new Set([
            ...TEXT_FIELDS,
            ...NUMBER_FIELDS,
            ...BOOL_FIELDS,
            "comps",
            "scope",
            "events",
            "revision",
          ]),
        ].sort();
        let offset = 0,
          first = true;
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const rows = await repo.list(offset, 50);
              if (!rows.length) {
                if (first)
                  controller.enqueue(
                    new TextEncoder().encode(exportCsv([], columns) + "\r\n"),
                  );
                controller.close();
                return;
              }
              let csv = exportCsv(rows, columns);
              if (!first) csv = csv.slice(csv.indexOf("\r\n") + 2);
              controller.enqueue(new TextEncoder().encode(csv + "\r\n"));
              first = false;
              offset += rows.length;
              if (rows.length < 50) controller.close();
            } catch {
              controller.error(new Error("Private export interrupted."));
            }
          },
        });
        return new Response(stream, {
          headers: {
            ...headers,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="equityscout-private.csv"',
          },
        });
      }
      if (path === "providers")
        return send({
          configured: false,
          daily_call_limit: 0,
          calls_reserved_today: 0,
          last_attempt: null,
          license_acknowledged: false,
          live_coverage:
            "Cloud provider ingestion is disabled; use reviewed manual imports.",
          cost: "No external provider calls are made by this backend.",
        });
      if (path === "pha-standards")
        return send({ standards: await repo.standards() });
      if (path === "searches") return send({ searches: await repo.searches() });
      return send({ error: "Not found" }, 404);
    }
    if (request.method !== "POST")
      return send({ error: "Method not allowed" }, 405);
    authorizeWrite(request, identity);
    const data = await body(request);
    if (path === "logout")
      return send({ ok: true, logout_url: "/cdn-cgi/access/logout" });
    if (path === "deals") {
      const deal = await repo.save(data, settings);
      return send({
        id: deal.id,
        deal: { ...deal, analysis: underwrite(deal, settings) },
      });
    }
    if (path === "delete")
      return send({ deleted: await repo.remove(data.id, data.revision) });
    if (path === "underwrite") return send(underwrite(data, settings));
    if (path === "settings") {
      const validated = validateSettings(data),
        next = Object.fromEntries(
          Object.entries(validated).map(([k, v]) => [k, v.toNumber()]),
        );
      await repo.savePreferences(next);
      return send({ settings: next, ...(await enriched(next)) });
    }
    if (path === "research") {
      const item = await repo.one(data.id);
      if (!item) return send({ error: "Property not found" }, 404);
      return send({
        voucher: voucherEstimate(item, await repo.standards()),
        timeline: await repo.audit(item.id),
        stress: stressTests(item, settings),
        comps: selectComps(item, item.comps || []),
        scope: estimateScope(item.scope || []),
        analysis: underwrite(item, settings),
      });
    }
    if (path === "comp-review")
      return send(selectComps(data.subject || {}, data.comps || []));
    if (path === "scope")
      return send(estimateScope(data.lines || [], data.contingency ?? 0.2));
    if (path === "backtest") {
      if (!Array.isArray(data.rows) || data.rows.length > 500)
        throw new HttpError(400, "Backtest requires at most 500 records.");
      return send(backtest(data.rows, data.top_n));
    }
    if (path === "import-preview")
      return send(previewImport(String(data.csv || "")));
    if (path === "import") {
      const all = parseCsv(String(data.csv || "")),
        cursor = Math.max(0, Math.trunc(Number(data.cursor) || 0)),
        slice = all.slice(cursor, cursor + 5),
        errors = [];
      let imported = 0;
      for (const [i, raw] of slice.entries())
        try {
          delete raw.id;
          delete raw.revision;
          raw.source_name ||= "CSV import";
          await repo.save(raw, settings);
          imported++;
        } catch (e) {
          errors.push(`row ${cursor + i + 2}: ${e.message}`);
        }
      return send({
        imported,
        errors,
        next_cursor: cursor + 5 < all.length ? cursor + 5 : null,
        total_rows: all.length,
      });
    }
    if (path === "pha-import") {
      const all = parseCsv(String(data.csv || "")),
        cursor = Math.max(0, Math.trunc(Number(data.cursor) || 0)),
        errors = [];
      let accepted = 0;
      for (const [i, raw] of all.slice(cursor, cursor + 5).entries())
        try {
          if (await repo.saveStandard(standardRecord(raw))) accepted++;
        } catch (e) {
          errors.push(`row ${cursor + i + 2}: ${e.message}`);
        }
      return send({
        accepted_rows: accepted,
        errors,
        next_cursor: cursor + 5 < all.length ? cursor + 5 : null,
        warning:
          "Manual schedule versions only; no contract approval inferred.",
      });
    }
    if (path === "searches")
      return send({ search: await repo.saveSearch(data) });
    if (["discover", "estimates"].includes(path))
      throw new HttpError(
        503,
        "Cloud provider integration is disabled. No paid requests were sent.",
        "PROVIDER_DISABLED",
      );
    return send({ error: "Not found" }, 404);
  } catch (e) {
    if (e instanceof HttpError)
      return send({ error: e.message, code: e.code }, e.status);
    if (
      e instanceof Error &&
      /setting|DSCR|Operating|contingency|Nonnegative|Expected|Invalid/.test(
        e.message,
      )
    )
      return send({ error: e.message }, 400);
    return send(
      {
        error:
          "The private service could not complete the request. No records were returned.",
        code: "SERVICE_ERROR",
      },
      500,
    );
  }
}
export const onRequest = (context) => handleRequest(context);
