import axios from "axios";
import * as cheerio from "cheerio";

interface CrawlerItem {
  id: string;
  title: string;
  price: number;
  status: string;
  url: string;
  created_at?: string;
}

interface CrawlerResult {
  success: boolean;
  game: string;
  count: number;
  min_price: number;
  avg_price: number;
  max_price: number;
  median_price: number;
  recommended_price: number;
  items: CrawlerItem[];
  price_ranges: Record<string, number>;
  error?: string;
}

// 번개장터 크롤링 함수
export async function crawlBunjang(gameName: string): Promise<CrawlerResult> {
  try {
    console.log(`게임 "${gameName}" 크롤링 시작...`);
    
    const items: CrawlerItem[] = [];
    let page = 1;
    const maxPages = 20; // 최대 20페이지까지 크롤링
    
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
        
        // 페이지 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`페이지 ${page} 크롤링 실패:`, error);
        break;
      }
    }
    
    console.log(`총 ${items.length}개 매물 수집 완료 (30일치)`);
    
    if (items.length === 0) {
      return {
        success: false,
        game: gameName,
        count: 0,
        min_price: 0,
        avg_price: 0,
        max_price: 0,
        median_price: 0,
        recommended_price: 0,
        items: [],
        price_ranges: {},
        error: `${gameName}에 대한 30일치 상품을 찾을 수 없습니다.`
      };
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
    
    // 가격대별 분포
    const priceRanges: Record<string, number> = {
      '1만원 미만': 0,
      '1-2만원': 0,
      '2-3만원': 0,
      '3-4만원': 0,
      '4-5만원': 0,
      '5만원 이상': 0
    };
    
    filteredPrices.forEach(price => {
      if (price < 10000) priceRanges['1만원 미만']++;
      else if (price < 20000) priceRanges['1-2만원']++;
      else if (price < 30000) priceRanges['2-3만원']++;
      else if (price < 40000) priceRanges['3-4만원']++;
      else if (price < 50000) priceRanges['4-5만원']++;
      else priceRanges['5만원 이상']++;
    });
    
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
      items: filteredItems,
      price_ranges: priceRanges
    };
    
  } catch (error) {
    console.error(`크롤링 오류:`, error);
    return {
      success: false,
      game: gameName,
      count: 0,
      min_price: 0,
      avg_price: 0,
      max_price: 0,
      median_price: 0,
      recommended_price: 0,
      items: [],
      price_ranges: {},
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 