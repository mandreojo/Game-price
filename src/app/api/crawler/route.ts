import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function GET() {
  try {
    return Response.json({ 
      message: "크롤러 API가 실행 중입니다.",
      status: "running"
    });
  } catch (error) {
    console.error("크롤러 API 에러:", error);
    return Response.json({ error: "크롤러 API 오류" }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log("전체 게임 크롤링 시작");
    
    // 크롤러 실행
    const result = await runFullCrawler();
    
    if (!result.success) {
      return Response.json({ error: result.error || "크롤링에 실패했습니다." }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: "전체 게임 크롤링 완료",
      count: result.count || 0
    });
    
  } catch (error) {
    console.error("전체 크롤링 API 에러:", error);
    return Response.json({ error: "크롤링 중 오류가 발생했습니다." }, { status: 500 });
  }
}

function runFullCrawler(): Promise<{ success: boolean; count?: number; error?: string }> {
  return new Promise((resolve, reject) => {
    const crawlerPath = path.join(process.cwd(), "crawler", "bunjang.js");
    const child = spawn("node", [crawlerPath], {
      cwd: path.join(process.cwd(), "crawler"),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" }
    });
    
    let output = "";
    let errorOutput = "";
    
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    
    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });
    
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, count: 0 });
      } else {
        reject(new Error(`크롤러 실행 실패 (코드: ${code}): ${errorOutput}`));
      }
    });
    
    // 300초 타임아웃 (전체 크롤링은 시간이 오래 걸림)
    setTimeout(() => {
      child.kill();
      reject(new Error("크롤링 타임아웃"));
    }, 300000);
  });
} 