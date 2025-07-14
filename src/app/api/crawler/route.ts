import { NextRequest } from "next/server";
import { runManualCrawling } from "@/lib/scheduler";

export async function POST(req: NextRequest) {
  try {
    console.log('수동 크롤링 요청 받음');
    
    // 비동기로 크롤링 실행 (응답을 기다리지 않음)
    runManualCrawling().catch(error => {
      console.error('수동 크롤링 실행 중 오류:', error);
    });
    
    return Response.json({ 
      success: true, 
      message: '크롤링이 시작되었습니다. 백그라운드에서 실행됩니다.' 
    });
  } catch (error) {
    console.error('크롤링 API 오류:', error);
    return new Response("Error starting crawler", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    return Response.json({ 
      message: '크롤러 API가 정상적으로 작동 중입니다.',
      endpoints: {
        POST: '수동 크롤링 실행',
        GET: 'API 상태 확인'
      }
    });
  } catch (error) {
    return new Response("Error", { status: 500 });
  }
} 