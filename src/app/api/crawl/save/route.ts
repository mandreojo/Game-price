import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!adminDb) {
      return Response.json({ error: "데이터베이스 연결 실패" }, { status: 500 });
    }

    // 게임별 데이터 저장
    const gameRef = adminDb.collection('games').doc(data.game);
    await gameRef.set({
      ...data,
      updated_at: new Date(),
      recommended_price: data.recommended_price || data.avg_price
      });

    // 개별 매물 데이터 저장
    if (data.items && Array.isArray(data.items)) {
      const batch = adminDb.batch();
      
      data.items.forEach((item: Record<string, unknown>) => {
        const itemRef = adminDb.collection('items').doc();
        batch.set(itemRef, {
          ...item,
          game: data.game,
          created_at: new Date()
        });
      });

    await batch.commit();
    }

    return Response.json({ success: true, message: "데이터 저장 완료" });

  } catch (error) {
    console.error("데이터 저장 에러:", error);
    return Response.json({ error: "데이터 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
} 