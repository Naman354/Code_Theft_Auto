import { NextResponse } from "next/server";

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  hits: number;
  resetAt: number;
};

declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = global.__rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!global.__rateLimitStore) {
  global.__rateLimitStore = rateLimitStore;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function applyRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const clientKey = `${options.bucket}:${getClientIp(request)}`;
  const current = rateLimitStore.get(clientKey);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientKey, {
      hits: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  if (current.hits >= options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
        },
      },
    );
  }

  current.hits += 1;
  rateLimitStore.set(clientKey, current);
  return null;
}
