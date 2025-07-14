import { startPriceCrawlerScheduler } from './scheduler';

let schedulerInitialized = false;

export function initializeScheduler() {
  if (schedulerInitialized) {
    console.log('스케줄러가 이미 초기화되었습니다.');
    return;
  }

  try {
    // 개발 환경에서는 스케줄러를 시작하지 않음 (수동으로만 실행)
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경에서는 스케줄러가 자동으로 시작되지 않습니다.');
      console.log('수동 크롤링을 원하시면 /api/crawler POST 요청을 보내주세요.');
      return;
    }

    // 프로덕션 환경에서만 스케줄러 시작
    startPriceCrawlerScheduler();
    schedulerInitialized = true;
    console.log('가격 크롤러 스케줄러가 성공적으로 초기화되었습니다.');
  } catch (error) {
    console.error('스케줄러 초기화 실패:', error);
  }
}

// 서버 시작 시 자동으로 호출
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  initializeScheduler();
} 