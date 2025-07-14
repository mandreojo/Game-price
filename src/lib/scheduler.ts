import cron from 'node-cron';
import { adminDb } from './firebase-admin';
import { crawlBunjangForGame } from './crawler';

interface Game {
  id: string;
  name: string;
  tag?: string;
}

// 매일 정오(12:00)에 실행되는 스케줄러
export function startPriceCrawlerScheduler() {
  console.log('가격 크롤러 스케줄러 시작...');
  
  // 매일 정오에 실행 (0 12 * * *)
  cron.schedule('0 12 * * *', async () => {
    console.log('매일 정오 가격 크롤링 시작:', new Date().toLocaleString());
    
    try {
      // 파이어베이스에서 게임 리스트 가져오기
      if (!adminDb) {
        console.error('Firebase Admin DB가 초기화되지 않았습니다.');
        return;
      }

      const gamesSnapshot = await adminDb.collection('gamelist').get();
      const games = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];

      console.log(`총 ${games.length}개의 게임에 대해 가격 정보를 수집합니다.`);

      // 각 게임에 대해 번개장터 크롤링 실행
      for (const game of games) {
        try {
          console.log(`게임 "${game.name}" 크롤링 중...`);
          await crawlBunjangForGame(game);
          
          // 크롤링 간격을 두어 서버 부하 방지
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`게임 "${game.name}" 크롤링 실패:`, error);
        }
      }

      console.log('모든 게임 가격 크롤링 완료:', new Date().toLocaleString());
    } catch (error) {
      console.error('스케줄러 실행 중 오류:', error);
    }
  }, {
    timezone: "Asia/Seoul"
  });

  console.log('가격 크롤러 스케줄러가 매일 정오에 실행되도록 설정되었습니다.');
}

// 수동으로 크롤링 실행하는 함수 (테스트용)
export async function runManualCrawling() {
  console.log('수동 가격 크롤링 시작...');
  
  try {
    if (!adminDb) {
      console.error('Firebase Admin DB가 초기화되지 않았습니다.');
      return;
    }

    const gamesSnapshot = await adminDb.collection('gamelist').get();
    const games = gamesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`총 ${games.length}개의 게임에 대해 가격 정보를 수집합니다.`);

    for (const game of games) {
      try {
        console.log(`게임 "${game.name}" 크롤링 중...`);
        await crawlBunjangForGame(game);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`게임 "${game.name}" 크롤링 실패:`, error);
      }
    }

    console.log('수동 가격 크롤링 완료');
  } catch (error) {
    console.error('수동 크롤링 중 오류:', error);
  }
} 