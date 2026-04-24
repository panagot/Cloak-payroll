import { NextRequest, NextResponse } from "next/server";

/**
 * Forwards the Cloak API so the @cloak.dev/sdk can call this app same-origin.
 * Browsers block https://api.cloak.ag (no CORS for many localhost origins/ports);
 * the server has no CORS limits.
 */
const UPSTREAM = "https://api.cloak.ag";

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function proxy(request: NextRequest, params: { path?: string[] }) {
  const segments = params.path ?? [];
  const path = segments.length ? `/${segments.join("/")}` : "";
  const upstream = new URL(UPSTREAM + path);
  const from = new URL(request.url);
  upstream.search = from.search;

  const headers = new Headers();
  for (const name of ["content-type", "accept", "accept-language", "accept-encoding"]) {
    const v = request.headers.get(name);
    if (v) headers.set(name, v);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  const res = await fetch(upstream.toString(), init);
  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  });
  const ct = res.headers.get("content-type");
  if (ct) {
    out.headers.set("content-type", ct);
  }
  return out;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}

export async function HEAD(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, await ctx.params);
}
