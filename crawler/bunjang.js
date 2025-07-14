const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// 검색 키워드 예시
const keyword = process.argv[2] || '슈퍼 마리오 오디세이';

// Firestore 초기화 (서비스 계정 키 파일이 있는 경우)
let db = null;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('Firestore 연결 성공');
} catch (error) {
  console.log('Firestore 연결 실패 (서비스 계정 키 파일이 없습니다)');
  console.log('크롤링만 실행됩니다.');
}

// 번개장터 API URL 시도
const searchUrl = (q) => `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(q)}&order=date&page=1&request_id=2023120100000&stat_device=w&n=50&stat_category_required=0&req_ref=search&version=4`;

// 극단값 제거 함수 (상하위 15%씩 제거)
function removeOutliers(arr) {
  if (!arr || arr.length < 5) return arr;
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const cut = Math.floor(n * 0.15); // 15%씩 제외
  return sorted.slice(cut, n - cut);
}

// 절사 평균 계산 함수 (극단값 제거 후 평균)
function calculateTrimmedMean(arr, trimPercent = 10) {
  if (arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const trimCount = Math.floor(arr.length * (trimPercent / 100));
  
  // 상하위 10%씩 제거 (총 20% 제거)
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  
  if (trimmed.length === 0) {
    // 제거 후 남은 게 없으면 원본 평균 사용
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  
  // 절사된 배열의 평균 계산
  const sum = trimmed.reduce((a, b) => a + b, 0);
  return Math.round(sum / trimmed.length);
}

// 제외할 키워드 목록 (게임과 관련 없는 부속품, 악세서리 등)
const excludeKeywords = [
  '파우치', '아미보', '아미보카드', '아미보 카드', '아미보카드', '아미보 카드',
  '케이스', '커버', '보호필름', '보호 필름', '스티커', '데칼',
  '스트랩', '줄', '손목끈', '손목 끈', '목걸이', '목 걸이',
  '키링', '키 체인', '키체인', '키홀더', '키 홀더',
  '포스터', '액자', '그림', '일러스트', '아트북', '아트 북',
  '사운드트랙', '사운드 트랙', 'OST', '음악', 'CD', 'DVD',
  '피규어', '인형', '토이', '장난감', '프라모델', '프라 모델',
  '의류', '옷', '티셔츠', '후드', '모자', '양말',
  '가방', '백팩', '크로스백', '크로스 백', '지갑', '지갑',
  '시계', '시계줄', '시계 줄', '반지', '팔찌', '귀걸이',
  '책', '소설', '만화', '코믹', '가이드북', '가이드 북',
  '매뉴얼', '설명서', '팜플렛', '브로셔',
  '스티커북', '스티커 북', '색칠공부', '색칠 공부', '퍼즐',
  '카드게임', '카드 게임', '보드게임', '보드 게임',
  '액세서리', '악세서리', '부속품', '부속 품', '교체용', '교체 용',
  '수리용', '수리 용', '정품', '가품', '레플리카', '복제품', '복제 품'
];

// 제목에서 제외 키워드 확인
function shouldExcludeItem(title) {
  const lowerTitle = title.toLowerCase();
  return excludeKeywords.some(keyword => 
    lowerTitle.includes(keyword.toLowerCase())
  );
}

// 게임 관련 매물인지 확인 (기본 필터링)
function isGameProduct(title, keyword) {
  // 제외 키워드가 포함된 경우 제외
  if (shouldExcludeItem(title)) {
    return false;
  }
  
  // 게임 키워드가 포함된 경우 포함
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  
  // 게임 관련 키워드들
  const gameKeywords = [
    '게임', '칩', '타이틀', '카트리지', '디스크', 'CD', 'DVD', '블루레이',
    '스위치', '닌텐도', '플레이스테이션', 'PS', '엑스박스', 'XBOX',
    'PC', '컴퓨터', '스팀', 'STEAM', '디지털', '다운로드'
  ];
  
  // 게임 키워드가 포함되어 있거나, 검색 키워드가 포함되어 있으면 포함
  return gameKeywords.some(gameKeyword => 
    lowerTitle.includes(gameKeyword.toLowerCase())
  ) || lowerTitle.includes(lowerKeyword);
}

// Firestore에서 게임 목록 가져오기
async function getGameList() {
  if (!db) {
    console.log('Firestore가 연결되지 않았습니다. 빈 배열 반환.');
    return [];
  }
  
  try {
    const snapshot = await db.collection('gamelist').get();
    const games = [];
    snapshot.forEach(doc => {
      games.push(doc.data().name);
    });
    console.log(`Firestore에서 ${games.length}개의 게임을 가져왔습니다.`);
    return games;
  } catch (error) {
    console.error('게임 목록 가져오기 실패:', error.message);
    return [];
  }
}

// saveToFirestore: items 전체 저장
async function saveToFirestore(keyword, items) {
  if (!db) return;
  try {
    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const today = new Date().toISOString().split('T')[0];
    const priceHistoryRef = db.collection('price_history').doc(keyword).collection('daily').doc(today);
    const prices = items.map(i => i.price).filter(p => p > 0 && p < 100000000);
    const filteredPrices = removeOutliers(prices);
    const priceData = {
      keyword: keyword,
      date: today,
      timestamp: timestamp,
      count: items.length,
      min_price: filteredPrices.length > 0 ? Math.min(...filteredPrices) : 0,
      max_price: filteredPrices.length > 0 ? Math.max(...filteredPrices) : 0,
      avg_price: filteredPrices.length > 0 ? Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) : 0,
      recommend: filteredPrices.length > 0 ? calculateTrimmedMean(filteredPrices) : 0, // 절사평균(추천가)
      trimmed_mean: filteredPrices.length > 0 ? calculateTrimmedMean(filteredPrices) : 0, // 절사평균(추천가)
      items: items, // 전체 저장
      source: 'bunjang',
      outlier_removed: prices.length !== filteredPrices.length
    };
    batch.set(priceHistoryRef, priceData);
    const gameRef = db.collection('gamelist').doc(keyword);
    batch.set(gameRef, {
      name: keyword,
      last_updated: timestamp,
      search_count: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
    await batch.commit();
    console.log(`✅ Firestore에 데이터 저장 완료: ${keyword}`);
  } catch (error) {
    console.error('❌ Firestore 저장 실패:', error.message);
  }
}

// 페이지네이션 추가: 최대 10페이지까지 반복 요청
async function crawlBunjang(keyword) {
  let allItems = [];
  const maxPages = 10;
  
  console.log(`\n=== ${keyword} 크롤링 시작 ===`);
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(keyword)}&order=date&page=${page}&request_id=2023120100000&stat_device=w&n=50&stat_category_required=0&req_ref=search&version=4`;
    
    try {
      console.log(`페이지 ${page} 요청 중...`);
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://www.bunjang.co.kr/',
          'Origin': 'https://www.bunjang.co.kr',
        },
        timeout: 10000,
      });
      
      if (data.list && Array.isArray(data.list)) {
        console.log(`페이지 ${page}: ${data.list.length}개 매물 발견`);
        allItems = allItems.concat(data.list);
        if (data.list.length < 50) {
          console.log(`마지막 페이지 도달 (${data.list.length}개)`);
          break;
        }
      } else {
        console.log(`페이지 ${page}: 데이터 없음`);
        break;
      }
    } catch (e) {
      console.error(`페이지 ${page} 요청 실패:`, e.message);
      break;
    }
  }
  
  console.log(`\n총 ${allItems.length}개 매물 수집 완료`);
  
  // 매물 데이터 처리 (제목, 가격, 날짜 등 추출)
  const processedItems = allItems
    .map(item => {
      // 날짜 처리
      let dateStr = '';
      let itemTimestamp = 0;
      
      if (item.update_time) {
        itemTimestamp = item.update_time;
        const date = new Date(item.update_time * 1000);
        dateStr = date.toLocaleDateString('ko-KR');
      } else if (item.created_at) {
        itemTimestamp = item.created_at;
        const date = new Date(item.created_at * 1000);
        dateStr = date.toLocaleDateString('ko-KR');
      } else {
        itemTimestamp = Math.floor(Date.now() / 1000);
        dateStr = new Date().toLocaleDateString('ko-KR');
      }
      
      return {
        title: item.name || item.title || '',
        price: parseInt(item.price) || 0,
        date: dateStr,
        timestamp: itemTimestamp,
        url: item.pid ? `https://www.bunjang.co.kr/products/${item.pid}?ref=search` : "",
        location: item.location || '',
        image: item.product_image || ''
      };
    })
    .filter(item => 
      item.title && 
      item.price > 0 && 
      item.price < 100000000 // 1억 미만 (제약 완화)
    );
  
  console.log(`처리 후 ${processedItems.length}개 매물`);
  
  // 키워드 필터링 적용
  const filteredItems = processedItems.filter(item => isGameProduct(item.title, keyword));
  
  console.log(`키워드 필터링 후 ${filteredItems.length}개 매물`);
  
  // 제외된 매물 수 표시
  const excludedCount = processedItems.length - filteredItems.length;
  if (excludedCount > 0) {
    console.log(`🚫 제외된 매물: ${excludedCount}개 (파우치, 아미보, 악세서리 등)`);
  }
  
  if (filteredItems.length > 0) {
    // 통계 계산 및 출력
    const prices = filteredItems.map(i => i.price);
    const filteredPrices = removeOutliers(prices);

    // 극단값이 제거된 매물만 추출
    const outlierFilteredItems = filteredItems.filter(item => filteredPrices.includes(item.price));

    const min = filteredPrices.length > 0 ? Math.min(...filteredPrices) : Math.min(...prices);
    const max = filteredPrices.length > 0 ? Math.max(...filteredPrices) : Math.max(...prices);
    const avg = filteredPrices.length > 0 ? 
      Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) :
      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    // 절사 평균 계산 (극단값 제거 후 평균)
    const trimmedMean = calculateTrimmedMean(filteredPrices.length > 0 ? filteredPrices : prices);

    console.log(`\n=== 검색 결과 ===`);
    console.log(`검색어: ${keyword}`);
    console.log(`매물수: ${outlierFilteredItems.length}개`);
    console.log(`최저가: ${min.toLocaleString()}원`);
    console.log(`추천가: ${trimmedMean.toLocaleString()}원 (절사평균)`);
    console.log(`평균가: ${avg.toLocaleString()}원`);
    console.log(`최고가: ${max.toLocaleString()}원`);

    if (prices.length !== filteredPrices.length) {
      console.log(`📊 극단값 제거: ${prices.length}개 → ${filteredPrices.length}개`);
    }

    console.log(`\n=== 상위 5개 매물 ===`);
    outlierFilteredItems.slice(0, 5).forEach((item, i) => {
      console.log(`${i+1}. ${item.title} - ${item.price.toLocaleString()}원 (${item.location}) [${item.date}]`);
    });

    // JSON 결과 출력 (API에서 파싱용)
    const result = {
      success: true,
      game: keyword,
      count: outlierFilteredItems.length,
      min_price: min,
      avg_price: avg,
      max_price: max,
      median_price: trimmedMean, // 절사 평균을 추천가로 사용
      items: outlierFilteredItems,
      price_ranges: {}
    };
    console.log('RESULT:' + JSON.stringify(result));

    // Firestore에 저장
    await saveToFirestore(keyword, outlierFilteredItems);
  } else {
    console.log(`\n검색어 "${keyword}"에 대한 매물을 찾을 수 없습니다.`);
    
    // 빈 결과 JSON 출력
    const result = {
      success: false,
      error: `검색어 "${keyword}"에 대한 매물을 찾을 수 없습니다.`,
      game: keyword,
      count: 0,
      min_price: 0,
      avg_price: 0,
      max_price: 0,
      median_price: 0, // 최빈값 (추천가)
      items: [],
      price_ranges: {}
    };
    console.log('RESULT:' + JSON.stringify(result));
  }
}

async function crawlWebPage(keyword) {
  try {
    const webUrl = `https://www.bunjang.co.kr/search?q=${encodeURIComponent(keyword)}&order=date`;
    console.log(`웹페이지 URL: ${webUrl}`);
    
    const { data } = await axios.get(webUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 15000,
    });

    console.log('웹페이지 HTML 길이:', data.length);
    
    // JavaScript가 로드된 후의 데이터를 확인하기 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const $ = cheerio.load(data);
    
    // 다양한 선택자 시도
    const selectors = [
      '[data-testid="product-item"]',
      '.product-item',
      '.sc-dcJsrY',
      'a[href*="/p/products/"]',
      '.product-card',
      '[class*="product"]',
    ];
    
    let items = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`선택자 "${selector}"로 ${elements.length}개 요소 발견`);
      
      if (elements.length > 0) {
        elements.each((i, el) => {
          const $el = $(el);
          const title = $el.find('[class*="title"], [class*="name"], h3, h4').text().trim();
          const priceText = $el.find('[class*="price"]').text().trim();
          const price = Number(priceText.replace(/[^0-9]/g, ""));
          
          if (title && price > 0 && isGameProduct(title, keyword)) {
            items.push({ title, price, date: '', url: '' });
          }
        });
        
        if (items.length > 0) break;
      }
    }
    
    if (items.length === 0) {
      console.log('웹페이지에서도 검색 결과를 찾을 수 없습니다.');
      console.log('페이지 제목:', $('title').text());
      console.log('HTML 미리보기:', data.substring(0, 2000));
    } else {
      const prices = items.map(i => i.price);
      const filteredPrices = removeOutliers(prices);
      
      const min = filteredPrices.length > 0 ? Math.min(...filteredPrices) : Math.min(...prices);
      const max = filteredPrices.length > 0 ? Math.max(...filteredPrices) : Math.max(...prices);
      const avg = filteredPrices.length > 0 ? 
        Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) :
        Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      
      console.log(`\n=== 웹페이지 검색 결과 ===`);
      console.log(`검색어: ${keyword}`);
      console.log(`매물수: ${items.length}`);
      console.log(`최저가: ${min.toLocaleString()}원`);
      console.log(`평균가: ${avg.toLocaleString()}원`);
      console.log(`최고가: ${max.toLocaleString()}원`);
    }
    
  } catch (e) {
    console.error('웹페이지 크롤링 실패:', e.message);
  }
}

// 메인 실행
crawlBunjang(keyword); 