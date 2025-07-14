const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (환경변수 사용)
let adminDb = null;
try {
  // 환경변수에서 서비스 계정 정보 가져오기
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  adminDb = admin.firestore();
  console.log('Firebase Admin SDK 초기화 성공');
} catch (error) {
  console.error('Firebase Admin SDK 초기화 오류:', error);
}

// 게임 목록 (GitHub Actions에서 크롤링할 게임들)
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
  "별의 커비 디스커버리",
  "파이어엠블렘",
  "몬스터헌터 라이즈",
  "미토피아",
  "별의 커비 스타 얼라이즈",
  "슈퍼 마리오 파티",
  "스플래툰 2",
  "잇 테이크 투"
];

// 번개장터 크롤링 함수
async function crawlBunjang(gameName) {
  try {
    console.log(`게임 "${gameName}" 크롤링 시작...`);
    
    const items = [];
    let page = 1;
    const maxPages = 10; // GitHub Actions에서는 시간 제한이 있으므로 10페이지로 제한
    
    while (page <= maxPages) {
      console.log(`페이지 ${page} 크롤링 중...`);
      
      const url = `https://www.bunjang.co.kr/search/products?q=${encodeURIComponent(gameName)}&page=${page}`;
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const productElements = $('.sc-1xyd6f9-0');
        
        if (productElements.length === 0) {
          console.log(`마지막 페이지 도달 (${items.length}개)`);
          break;
        }
        
        console.log(`페이지 ${page}: ${productElements.length}개 매물 발견`);
        
        productElements.each((_, element) => {
          const $el = $(element);
          
          // 제목 추출
          const title = $el.find('.sc-1xyd6f9-4').text().trim();
          
          // 가격 추출
          const priceText = $el.find('.sc-1xyd6f9-5').text().trim();
          const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
          
          // URL 추출
          const url = $el.find('a').attr('href') || '';
          const fullUrl = url.startsWith('http') ? url : `https://www.bunjang.co.kr${url}`;
          
          // 판매 상태 확인
          const status = title.includes('판매완료') || title.includes('거래완료') ? '판매완료' : '판매중';
          
          // 키워드 필터링 (파우치, 아미보 등 제외)
          const excludeKeywords = ['파우치', '아미보', '케이스', '커버', '스티커', '액세서리'];
          const hasExcludeKeyword = excludeKeywords.some(keyword => 
            title.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (!hasExcludeKeyword && title && price > 0) {
            items.push({
              id: Math.random().toString(36).substr(2, 9),
              title,
              price,
              status,
              url: fullUrl,
              created_at: new Date().toISOString()
            });
          }
        });
        
        page++;
        
        // 페이지 간 딜레이 (GitHub Actions에서는 짧게)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`페이지 ${page} 크롤링 실패:`, error);
        break;
      }
    }
    
    console.log(`총 ${items.length}개 매물 수집 완료`);
    
    if (items.length === 0) {
      console.log(`게임 "${gameName}"에 대한 상품을 찾을 수 없습니다.`);
      return null;
    }
    
    // 가격 통계 계산
    const prices = items.map(item => item.price).filter(price => price > 0);
    const min_price = Math.min(...prices);
    const max_price = Math.max(...prices);
    const avg_price = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    
    // 중위값 계산
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median_price = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    // 극단값 제거 (아웃라이어)
    const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const filteredPrices = prices.filter(price => price >= lowerBound && price <= upperBound);
    console.log(`📊 극단값 제거: ${prices.length}개 → ${filteredPrices.length}개`);
    
    // 절사평균 계산 (추천가)
    const trimmedPrices = filteredPrices.sort((a, b) => a - b);
    const trimPercent = 0.1; // 상하위 10% 제거
    const trimCount = Math.floor(trimmedPrices.length * trimPercent);
    const trimmedMean = trimmedPrices
      .slice(trimCount, trimmedPrices.length - trimCount)
      .reduce((sum, price) => sum + price, 0) / (trimmedPrices.length - 2 * trimCount);
    
    const recommended_price = Math.round(trimmedMean);
    
    // 극단값이 제거된 매물만 반환
    const filteredItems = items.filter(item => 
      item.price >= lowerBound && item.price <= upperBound
    );
    
    console.log(`게임 "${gameName}" 크롤링 완료: ${filteredItems.length}개 상품, 평균가 ${avg_price}원`);
    
    return {
      success: true,
      game: gameName,
      count: filteredItems.length,
      min_price,
      avg_price,
      max_price,
      median_price,
      recommended_price,
      items: filteredItems
    };
    
  } catch (error) {
    console.error(`크롤링 오류:`, error);
    return null;
  }
}

// Firestore에 데이터 저장
async function saveToDatabase(result) {
  try {
    if (!adminDb) {
      console.log('Firebase Admin SDK가 초기화되지 않았습니다.');
      return;
    }
    
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

// 메인 실행 함수
async function main() {
  console.log('🚀 GitHub Actions 크롤러 시작');
  console.log(`총 ${gameList.length}개 게임 크롤링 예정`);
  
  const results = [];
  
  // 순차적으로 크롤링 (GitHub Actions에서는 병렬 처리 제한)
  for (const game of gameList) {
    try {
      const result = await crawlBunjang(game);
      if (result) {
        results.push(result);
        
        // Firestore에 저장
        await saveToDatabase(result);
        
        // JSON 결과 출력 (GitHub Actions에서 확인용)
        console.log(`RESULT:${JSON.stringify(result)}`);
      }
      
      // 게임 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`게임 "${game}" 크롤링 실패:`, error);
    }
  }
  
  console.log(`✅ 크롤링 완료: ${results.length}개 게임 성공`);
  console.log(`📊 총 ${results.reduce((sum, r) => sum + r.count, 0)}개 매물 수집`);
}

// 명령행 인자로 특정 게임만 크롤링
if (process.argv.length > 2) {
  const gameName = process.argv[2];
  crawlBunjang(gameName).then(result => {
    if (result) {
      console.log(`RESULT:${JSON.stringify(result)}`);
      saveToDatabase(result);
    }
  });
} else {
  // 전체 게임 크롤링
  main();
} 