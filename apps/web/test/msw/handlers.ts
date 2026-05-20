import { http, HttpResponse } from "msw";

/** Mirrors the future FastAPI base URL; override with NEXT_PUBLIC_API_URL in tests if needed. */
const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

export const handlers = [
  http.get(`${apiBase}/health`, () => HttpResponse.json({ status: "ok" })),
];
