import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameData, dashboardData } = body;

    if (!adminDb) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin 연결 실패' 
      }, { status: 500 });
    }

    const batch = adminDb!.batch();

    // 게임 데이터 저장
    if (gameData && Array.isArray(gameData)) {
      gameData.forEach((game: any) => {
        const docRef = adminDb!.collection('gamelist').doc(game.id || game.name);
        batch.set(docRef, {
          ...game,
          updatedAt: new Date()
        }, { merge: true });
      });
    }

    // 대시보드 데이터 저장
    if (dashboardData) {
      if (dashboardData.popularGames) {
        batch.set(adminDb!.collection('dashboard').doc('popular'), {
          games: dashboardData.popularGames,
          updatedAt: new Date()
        });
      }
      
      if (dashboardData.risingGames) {
        batch.set(adminDb!.collection('dashboard').doc('rising'), {
          games: dashboardData.risingGames,
          updatedAt: new Date()
        });
      }
      
      if (dashboardData.fallingGames) {
        batch.set(adminDb!.collection('dashboard').doc('falling'), {
          games: dashboardData.fallingGames,
          updatedAt: new Date()
        });
      }
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: '데이터 저장 완료',
      savedCount: {
        games: gameData?.length || 0,
        dashboard: dashboardData ? 3 : 0
      }
    });

  } catch (error) {
    console.error('데이터 저장 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '데이터 저장 실패',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 