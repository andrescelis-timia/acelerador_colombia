import { NextRequest, NextResponse } from "next/server";

const ALB =
  process.env.ALB_IA_ORIGIN ||
  "http://timia-alb-ia-285550099.us-east-1.elb.amazonaws.com";

async function proxy(req: NextRequest, path: string[]) {
  const url = new URL(req.url);
  const target = `${ALB}/${path.map(encodeURIComponent).join("/")}${url.search}`;
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  const res = await fetch(target, init);
  const out = new Headers(res.headers);
  out.delete("content-encoding");
  out.delete("transfer-encoding");
  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: out,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
