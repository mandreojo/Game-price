import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    if (!adminDb) {
      return Response.json({ error: "데이터베이스 연결 실패" }, { status: 500 });
    }

    // 게임 목록 가져오기
    const gamesSnapshot = await adminDb.collection('games').get();
    const games: Record<string, unknown>[] = [];
    
    gamesSnapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return Response.json({
      success: true,
      games: games
    });
    
  } catch (error) {
    console.error("대시보드 API 에러:", error);
    return Response.json({ error: "데이터를 가져오는 중 오류가 발생했습니다." }, { status: 500 });
  }
} 