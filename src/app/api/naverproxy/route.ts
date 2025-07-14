import { NextRequest } from "next/server";

const NAVER_CLIENT_ID = "oar2u45uzk";
const NAVER_CLIENT_SECRET = "ww2BnyuBtq2WeDWKbzdRoypuQeat7fnn8ZhRU54r";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return new Response("Missing url", { status: 400 });
  }
  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
      "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
    },
  });
  const data = await res.text();
  console.log("[네이버 Place API 응답]", data);
  return new Response(data, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} 