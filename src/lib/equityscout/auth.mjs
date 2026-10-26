// Cloudflare Access is the identity provider; the application separately authorizes the configured owner.
// https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
import { createRemoteJWKSet, jwtVerify } from "jose";
const resolvers = new Map();
export class HttpError extends Error {
  constructor(status, message, code = "REQUEST_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function authConfig(env) {
  const issuer = String(env.SCOUT_ACCESS_ISSUER || "").replace(/\/$/, ""),
    audience = String(env.SCOUT_ACCESS_AUD || ""),
    email = String(env.SCOUT_OWNER_EMAIL || "")
      .trim()
      .toLowerCase(),
    origin = String(env.SCOUT_ORIGIN || "");
  if (
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) ||
    !audience ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/.test(origin)
  )
    throw new HttpError(
      503,
      "Private hosting is not configured. No property data is available.",
      "HOSTING_NOT_CONFIGURED",
    );
  return { issuer, audience, email, origin };
}
const encoder = new TextEncoder();
export async function sha256(value) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function authenticate(request, env, keyResolver) {
  const cfg = authConfig(env),
    cookie = (request.headers.get("Cookie") || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("CF_Authorization=")),
    token =
      request.headers.get("Cf-Access-Jwt-Assertion") ||
      (cookie ? cookie.slice("CF_Authorization=".length) : null);
  if (!token || token.length > 16000)
    throw new HttpError(
      401,
      "Sign in with your owner account.",
      "LOGIN_REQUIRED",
    );
  let payload;
  try {
    let resolver = keyResolver;
    if (!resolver) {
      if (!resolvers.has(cfg.issuer))
        resolvers.set(
          cfg.issuer,
          createRemoteJWKSet(new URL(cfg.issuer + "/cdn-cgi/access/certs")),
        );
      resolver = resolvers.get(cfg.issuer);
    }
    ({ payload } = await jwtVerify(token, resolver, {
      issuer: cfg.issuer,
      audience: cfg.audience,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "email", "exp", "iat"],
      maxTokenAge: "24h",
      clockTolerance: 5,
    }));
  } catch {
    throw new HttpError(
      401,
      "Your sign-in could not be verified.",
      "INVALID_SESSION",
    );
  }
  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.email !== "string"
  )
    throw new HttpError(
      401,
      "Your sign-in could not be verified.",
      "INVALID_SESSION",
    );
  if (payload.email.trim().toLowerCase() !== cfg.email)
    throw new HttpError(
      403,
      "This account is not authorized for the private workstation.",
      "OWNER_REQUIRED",
    );
  return {
    ownerId: await sha256("equityscout-owner:" + cfg.email),
    email: cfg.email,
    subject: payload.sub,
    csrf: await sha256("equityscout-csrf:" + token),
    origin: cfg.origin,
  };
}
export function authorizeWrite(request, identity) {
  if (request.headers.get("Origin") !== identity.origin)
    throw new HttpError(
      403,
      "Same-origin request required.",
      "ORIGIN_REQUIRED",
    );
  const supplied = request.headers.get("X-EquityScout-Token") || "",
    expected = identity.csrf;
  let difference = supplied.length ^ expected.length;
  for (let i = 0; i < expected.length; i++)
    difference |= (supplied.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  if (difference)
    throw new HttpError(
      403,
      "Refresh the workstation before saving.",
      "CSRF_REQUIRED",
    );
  if (
    !String(request.headers.get("Content-Type") || "")
      .toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "JSON content type required.");
}
