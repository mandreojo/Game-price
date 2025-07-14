import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    // Firebase Admin SDK 사용 (서버 사이드)
    if (!adminDb) {
      // 개발 환경에서 더미 데이터 반환
      const mockGames = [
        { id: "1", name: "슈퍼 마리오 오디세이", tag: "Nintendo Switch" },
        { id: "2", name: "젤다의 전설 야생의 숨결", tag: "Nintendo Switch" },
        { id: "3", name: "포켓몬스터 소드", tag: "Nintendo Switch" },
        { id: "4", name: "스플래툰 3", tag: "Nintendo Switch" },
        { id: "5", name: "동물의 숲", tag: "Nintendo Switch" }
      ];
      return Response.json(mockGames);
    }

    const snapshot = await adminDb.collection("gamelist").get();
    const games = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return Response.json(games);
  } catch (e) {
    console.error('게임 데이터 가져오기 오류:', e);
    return new Response("Error fetching games", { status: 500 });
  }
} 