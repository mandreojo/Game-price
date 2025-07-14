import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return new Response("Missing url", { status: 400 });
  }
  const res = await fetch(url);
  const data = await res.text();
  return new Response(data, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} 