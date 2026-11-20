import "server-only";
import crypto from "node:crypto";

/**
 * Operator (researcher) access for the study console. If SUBTEXT_OPERATOR_KEY is set, requests
 * must send it in the `x-operator-key` header. Without a key, operator endpoints work only outside
 * production (local development on the researcher's machine).
 */
export function isOperator(req: Request): boolean {
  const key = process.env.SUBTEXT_OPERATOR_KEY ?? "";
  if (!key) return process.env.NODE_ENV !== "production";
  const got = req.headers.get("x-operator-key") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(key);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const operatorDenied = () =>
  Response.json({ error: { code: "forbidden", message: "Operator access required.", retryable: false } }, { status: 403 });
