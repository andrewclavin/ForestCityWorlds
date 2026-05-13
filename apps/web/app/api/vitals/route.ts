import { NextResponse } from "next/server";

import { checkVitalsRateLimit } from "@/lib/vitals/rate-limit";
import { appendVitalEvent } from "@/lib/vitals/store";
import { parseVitalsIngress } from "@/lib/vitals/validate";

function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  return "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rl = checkVitalsRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseVitalsIngress(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await appendVitalEvent(parsed.value);
  return new NextResponse(null, { status: 204 });
}
