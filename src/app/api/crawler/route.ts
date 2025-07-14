import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { adminDb } from "@/lib/firebase-admin";

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
    
    // 주요 게임 목록 (크롤링 시간 단축을 위해 핵심 게임만)
    const gameList = [
      "슈퍼 마리오 오디세이",
      "젤다의 전설 야생의 숨결", 
      "젤다의 전설 티어스 오브 더 킹덤",
      "스플래툰 3",
      "모여봐요 동물의 숲",
      "포켓몬스터 소드",
      "포켓몬스터 실드",
      "마리오 카트 8 디럭스",
      "슈퍼 스매시브라더스 얼티밋",
      "별의 커비 디스커버리"
    ];
    
    const results = [];
    
    // 병렬로 여러 게임 크롤링 (최대 3개씩)
    for (let i = 0; i < gameList.length; i += 3) {
      const batch = gameList.slice(i, i + 3);
      const batchPromises = batch.map(game => runSingleCrawler(game));
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // 배치 간 딜레이
      if (i + 3 < gameList.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    return Response.json({
      success: true,
      message: "전체 게임 크롤링 완료",
      total: gameList.length,
      successCount,
      results: results.map((r, i) => ({
        game: gameList[i],
        status: r.status,
        data: r.status === 'fulfilled' ? r.value : r.reason
      }))
    });
    
  } catch (error) {
    console.error("전체 크롤링 API 에러:", error);
    return Response.json({ error: "크롤링 중 오류가 발생했습니다." }, { status: 500 });
  }
}

function runSingleCrawler(game: string): Promise<{ success: boolean; count?: number; error?: string }> {
  return new Promise((resolve, reject) => {
    const crawlerPath = path.join(process.cwd(), "crawler", "bunjang.js");
    const child = spawn("node", [crawlerPath, game], {
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
        // 크롤링 결과를 DB에 저장
        try {
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.startsWith('RESULT:')) {
              const jsonStr = line.substring(7);
              const result = JSON.parse(jsonStr);
              
              // DB에 저장
              if (adminDb && result.success) {
                saveToDatabase(result);
              }
              
              resolve({ success: true, count: result.count || 0 });
              return;
            }
          }
          resolve({ success: true, count: 0 });
        } catch {
          resolve({ success: true, count: 0 });
        }
      } else {
        reject(new Error(`크롤러 실행 실패 (코드: ${code}): ${errorOutput}`));
      }
    });
    
    // 30초 타임아웃 (개별 게임당)
    setTimeout(() => {
      child.kill();
      reject(new Error("크롤링 타임아웃"));
    }, 30000);
  });
}

async function saveToDatabase(result: any) {
  try {
    if (!adminDb) return;
    
    const gameRef = adminDb.collection('games').doc(result.game);
    await gameRef.set({
      ...result,
      updated_at: new Date(),
      recommended_price: result.recommended_price || result.avg_price
    });
    
    console.log(`게임 "${result.game}" 데이터 저장 완료`);
  } catch (error) {
    console.error(`게임 "${result.game}" 데이터 저장 실패:`, error);
  }
} 