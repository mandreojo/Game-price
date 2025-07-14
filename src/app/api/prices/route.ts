import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin DB가 초기화되지 않았습니다.' }, { status: 500 });
    }

    if (gameId) {
      // 특정 게임의 가격 정보 조회
      const priceHistoryRef = adminDb.collection('priceHistory');
      const snapshot = await priceHistoryRef
        .where('gameId', '==', gameId)
        .orderBy('crawledAt', 'desc')
        .limit(limit)
        .get();

      const prices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return Response.json(prices);
    } else {
      // 모든 게임의 최신 가격 정보 조회
      const gamePricesRef = adminDb.collection('gamePrices');
      const snapshot = await gamePricesRef.get();

      const gamePrices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return Response.json(gamePrices);
    }
  } catch (error) {
    console.error('가격 정보 조회 오류:', error);
    return new Response("Error fetching prices", { status: 500 });
  }
} 