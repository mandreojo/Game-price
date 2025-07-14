import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) {
      // 개발 환경에서 더미 데이터 반환
      const mockDashboard = {
        popularGames: [
          {
            name: "슈퍼 마리오 오디세이",
            min: 25000,
            avg: 35000,
            max: 45000,
            recommend: 32000,
            searchCount: 1250
          },
          {
            name: "젤다의 전설 야생의 숨결",
            min: 30000,
            avg: 42000,
            max: 55000,
            recommend: 40000,
            searchCount: 980
          },
          {
            name: "포켓몬스터 소드",
            min: 20000,
            avg: 28000,
            max: 38000,
            recommend: 26000,
            searchCount: 750
          }
        ],
        risingGames: [
          {
            name: "스플래툰 3",
            min: 35000,
            avg: 45000,
            max: 58000,
            recommend: 43000,
            changeRate: 15
          },
          {
            name: "동물의 숲",
            min: 28000,
            avg: 38000,
            max: 48000,
            recommend: 36000,
            changeRate: 12
          }
        ],
        fallingGames: [
          {
            name: "마리오 카트 8",
            min: 15000,
            avg: 22000,
            max: 30000,
            recommend: 20000,
            changeRate: -8
          },
          {
            name: "스마브",
            min: 12000,
            avg: 18000,
            max: 25000,
            recommend: 16000,
            changeRate: -5
          }
        ]
      };
      return Response.json(mockDashboard);
    }

    // 실제 파이어베이스 데이터에서 대시보드 정보 생성
    const gamePricesRef = adminDb.collection('price_history');
    const snapshot = await gamePricesRef.get();

    const allGames = [];
    
    // 각 게임의 최신 가격 데이터 수집
    for (const gameDoc of snapshot.docs) {
      const gameName = gameDoc.id;
      const dailyRef = gameDoc.ref.collection('daily');
      const dailySnapshot = await dailyRef.orderBy('date', 'desc').limit(1).get();
      
      if (!dailySnapshot.empty) {
        const latestData = dailySnapshot.docs[0].data();
        allGames.push({
          name: gameName,
          min: latestData.min_price || 0,
          avg: latestData.avg_price || 0,
          max: latestData.max_price || 0,
          count: latestData.count || 0,
          date: latestData.date,
          recommend: latestData.recommend || latestData.trimmed_mean || 0
        });
      }
    }

    // 매물 수가 많은 순으로 정렬 (인기 게임)
    const popularGames = allGames
      .filter(game => game.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 평균가가 높은 순으로 정렬 (떡상중인 게임)
    const risingGames = allGames
      .filter(game => game.avg > 30000 && game.count > 5)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 2)
      .map(game => ({
        ...game,
        changeRate: Math.floor(Math.random() * 20) + 5 // 임시로 랜덤 값
      }));

    // 평균가가 낮은 순으로 정렬 (떡락중인 게임)
    const fallingGames = allGames
      .filter(game => game.avg < 25000 && game.count > 5)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map(game => ({
        ...game,
        changeRate: -(Math.floor(Math.random() * 10) + 1) // 임시로 랜덤 값
      }));

    return Response.json({
      popularGames,
      risingGames,
      fallingGames
    });

  } catch (error) {
    console.error('대시보드 데이터 가져오기 오류:', error);
    return new Response("Error fetching dashboard data", { status: 500 });
  }
} 