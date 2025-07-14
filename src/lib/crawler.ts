import axios from 'axios';
import * as cheerio from 'cheerio';
import { adminDb } from './firebase-admin';

interface Game {
  id: string;
  name: string;
  tag?: string;
}

interface PriceData {
  title: string;
  price: number;
  date: string;
  timestamp: number;
  url: string;
  location: string;
  image: string;
  status?: 'selling' | 'sold'; // 판매 상태
  crawledAt: string;
}

// 번개장터 API URL (페이지네이션 지원)
const searchUrl = (q: string, page: number = 1) => 
  `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(q)}&order=date&page=${page}&request_id=2023120100000&stat_device=w&n=50&stat_category_required=0&req_ref=search&version=4`;

// 특정 게임에 대한 번개장터 크롤링 및 파이어베이스 저장 (30일치 데이터)
export async function crawlBunjangForGame(game: Game) {
  try {
    console.log(`게임 "${game.name}" 크롤링 시작...`);
    
    let allItems: PriceData[] = [];
    const maxPages = 20; // 최대 20페이지까지 (1000개 매물)
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000); // 30일 전 타임스탬프
    
    // 페이지네이션으로 여러 페이지 크롤링
    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`페이지 ${page} 크롤링 중...`);
        const url = searchUrl(game.name, page);
        
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
          
          // 매물 데이터 처리
          const pageItems = data.list
            .map((item: any) => {
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
                image: item.product_image || '',
                status: item.status || 'selling', // 판매 상태 (기본값: 판매중)
                crawledAt: new Date().toISOString()
              };
            })
            .filter((item: PriceData) => 
              item.title && 
              item.price > 0 && 
              item.price < 100000000 && // 1억 미만
              item.timestamp >= thirtyDaysAgo // 30일 이내 매물만
            );
          
          allItems = allItems.concat(pageItems);
          
          // 30일 이전 매물이 나오면 중단
          const oldestItem = pageItems[pageItems.length - 1];
          if (oldestItem && oldestItem.timestamp < thirtyDaysAgo) {
            console.log(`30일 이전 매물 발견, 크롤링 중단`);
            break;
          }
          
          // 마지막 페이지인 경우 중단
          if (data.list.length < 50) {
            console.log(`마지막 페이지 도달 (${data.list.length}개)`);
            break;
          }
        } else {
          console.log(`페이지 ${page}: 데이터 없음`);
          break;
        }
        
        // 페이지 간 딜레이 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`페이지 ${page} 크롤링 실패:`, error);
        break;
      }
    }
    
    console.log(`총 ${allItems.length}개 매물 수집 완료 (30일치)`);
    
    if (allItems.length === 0) {
      console.log(`게임 "${game.name}"에 대한 30일치 상품을 찾을 수 없습니다.`);
      return;
    }

    // 가격 통계 계산 (극단값 제거)
    const prices = allItems.map(i => i.price);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const cut = Math.floor(prices.length * 0.15); // 15%씩 제외
    const filteredPrices = sortedPrices.slice(cut, prices.length - cut);
    
    const min = filteredPrices.length > 0 ? Math.min(...filteredPrices) : Math.min(...prices);
    const max = filteredPrices.length > 0 ? Math.max(...filteredPrices) : Math.max(...prices);
    const avg = filteredPrices.length > 0 ? 
      Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) :
      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const median = sortedPrices.length % 2 === 0 
      ? Math.round((sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2)
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

    // 파이어베이스에 저장할 데이터
    const priceData = {
      gameId: game.id,
      gameName: game.name,
      crawledAt: new Date().toISOString(),
      totalItems: allItems.length,
      priceStats: {
        min,
        max,
        avg,
        median
      },
      items: allItems, // 모든 매물 저장 (20개 제한 제거)
      rawPrices: prices,
      outlierRemoved: prices.length !== filteredPrices.length
    };

    // 파이어베이스에 저장
    if (adminDb) {
      const batch = adminDb.batch();
      
      // 가격 히스토리 컬렉션에 추가
      const historyRef = adminDb.collection('priceHistory').doc();
      batch.set(historyRef, priceData);
      
      // 게임별 최신 가격 정보 업데이트
      const gamePriceRef = adminDb.collection('gamePrices').doc(game.id);
      batch.set(gamePriceRef, {
        gameId: game.id,
        gameName: game.name,
        lastUpdated: new Date().toISOString(),
        currentStats: priceData.priceStats,
        totalItems: priceData.totalItems
      }, { merge: true });
      
      await batch.commit();
      
      console.log(`게임 "${game.name}" 크롤링 완료: ${allItems.length}개 상품, 평균가 ${avg}원`);
      if (prices.length !== filteredPrices.length) {
        console.log(`📊 극단값 제거: ${prices.length}개 → ${filteredPrices.length}개`);
      }
    } else {
      console.log(`게임 "${game.name}" 크롤링 완료 (DB 저장 실패): ${allItems.length}개 상품, 평균가 ${avg}원`);
    }

  } catch (error) {
    console.error(`게임 "${game.name}" 크롤링 실패:`, error);
    throw error;
  }
}

// 단일 키워드로 크롤링 (30일치 데이터)
export async function crawlBunjang(keyword: string) {
  try {
    console.log(`\n=== ${keyword} 크롤링 시작 ===`);
    
    let allItems: PriceData[] = [];
    const maxPages = 20; // 최대 20페이지까지 (1000개 매물)
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000); // 30일 전 타임스탬프
    
    // 페이지네이션으로 여러 페이지 크롤링
    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`페이지 ${page} 요청 중...`);
        const url = searchUrl(keyword, page);
        
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
          
          // 매물 데이터 처리
          const pageItems = data.list
            .map((item: any) => {
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
                image: item.product_image || '',
                status: item.status || 'selling',
                crawledAt: new Date().toISOString()
              };
            })
            .filter((item: PriceData) => 
              item.title && 
              item.price > 0 && 
              item.price < 100000000 && // 1억 미만
              item.timestamp >= thirtyDaysAgo // 30일 이내 매물만
            );
          
          allItems = allItems.concat(pageItems);
          
          // 30일 이전 매물이 나오면 중단
          const oldestItem = pageItems[pageItems.length - 1];
          if (oldestItem && oldestItem.timestamp < thirtyDaysAgo) {
            console.log(`30일 이전 매물 발견, 크롤링 중단`);
            break;
          }
          
          // 마지막 페이지인 경우 중단
          if (data.list.length < 50) {
            console.log(`마지막 페이지 도달 (${data.list.length}개)`);
            break;
          }
        } else {
          console.log(`페이지 ${page}: 데이터 없음`);
          break;
        }
        
        // 페이지 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`페이지 ${page} 요청 실패:`, error);
        break;
      }
    }
    
    console.log(`\n총 ${allItems.length}개 매물 수집 완료 (30일치)`);
    
    if (allItems.length === 0) {
      console.log(`검색어 "${keyword}"에 대한 30일치 매물을 찾을 수 없습니다.`);
      return [];
    }

    // 가격 통계 계산 (극단값 제거)
    const prices = allItems.map(i => i.price);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const cut = Math.floor(prices.length * 0.15); // 15%씩 제외
    const filteredPrices = sortedPrices.slice(cut, prices.length - cut);
    
    const min = filteredPrices.length > 0 ? Math.min(...filteredPrices) : Math.min(...prices);
    const max = filteredPrices.length > 0 ? Math.max(...filteredPrices) : Math.max(...prices);
    const avg = filteredPrices.length > 0 ? 
      Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) :
      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    // 중위값 계산
    const median = sortedPrices.length % 2 === 0 
      ? Math.round((sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2)
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    console.log(`\n=== 검색 결과 ===`);
    console.log(`검색어: ${keyword}`);
    console.log(`매물수: ${allItems.length}개`);
    console.log(`최저가: ${min.toLocaleString()}원`);
    console.log(`중위값: ${median.toLocaleString()}원`);
    console.log(`평균가: ${avg.toLocaleString()}원`);
    console.log(`최고가: ${max.toLocaleString()}원`);
    
    if (prices.length !== filteredPrices.length) {
      console.log(`📊 극단값 제거: ${prices.length}개 → ${filteredPrices.length}개`);
    }
    
    console.log(`\n=== 상위 5개 매물 ===`);
    allItems.slice(0, 5).forEach((item, i) => {
      console.log(`${i+1}. ${item.title} - ${item.price.toLocaleString()}원 (${item.location}) [${item.date}]`);
    });
    
    return allItems;
  } catch (error) {
    console.error('크롤링 실패:', error);
    throw error;
  }
} 