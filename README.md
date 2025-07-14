# 껨값 (Game Price Tracker)

중고거래 눈탱이, 치지도 말고 맞지도 말자 👊

## 프로젝트 개요

껨값은 번개장터에서 게임 가격 정보를 자동으로 수집하고 분석하는 웹 애플리케이션입니다. 매일 정오에 파이어베이스 DB의 게임리스트를 기반으로 번개장터 크롤링을 수행하여 가격 정보를 누적합니다.

## 주요 기능

### 🕷️ 자동 크롤링 시스템
- **매일 정오 자동 실행**: 파이어베이스 DB의 게임리스트를 기반으로 번개장터 크롤링
- **가격 정보 누적**: 최저가, 평균가, 최고가, 중간가 등 상세한 가격 통계
- **실시간 모니터링**: 게임별 가격 변동 추적

### 📊 대시보드
- **인기 게임**: 검색 빈도가 높은 게임들의 가격 정보
- **떡상중인 타이틀**: 가격이 상승 중인 게임들
- **떡락중인 타이틀**: 가격이 하락 중인 게임들
- **추천 껨값**: AI가 분석한 적정 구매 가격

### 🔍 검색 기능
- **실시간 자동완성**: 게임명 검색 시 자동완성 기능
- **상세 가격 정보**: 개별 게임의 상세 가격 히스토리
- **가격 통계**: 최저가, 평균가, 최고가, 중간가 표시

## 기술 스택

### Frontend
- **Next.js 15**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 모던한 UI 스타일링
- **shadcn/ui**: 일관된 UI 컴포넌트

### Backend
- **Firebase Firestore**: 실시간 데이터베이스
- **Firebase Admin SDK**: 서버 사이드 데이터 처리
- **Node.js**: 서버 런타임

### 크롤링
- **Axios**: HTTP 클라이언트
- **Cheerio**: HTML 파싱
- **node-cron**: 스케줄링

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (서비스 계정 키 파일 경로)
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 수동 크롤링 실행 (테스트용)
```bash
curl -X POST http://localhost:3000/api/crawler
```

## API 엔드포인트

### 게임 관련
- `GET /api/games`: 게임 리스트 조회
- `GET /api/games/[gameId]`: 특정 게임 정보 조회

### 가격 정보
- `GET /api/prices`: 모든 게임의 최신 가격 정보
- `GET /api/prices?gameId=123`: 특정 게임의 가격 히스토리
- `GET /api/prices?limit=20`: 최근 20개 가격 정보

### 크롤링
- `POST /api/crawler`: 수동 크롤링 실행
- `GET /api/crawler`: 크롤러 상태 확인

### 대시보드
- `GET /api/dashboard`: 대시보드 데이터 (인기/떡상/떡락 게임)

## 데이터베이스 구조

### Collections

#### `gamelist`
게임 기본 정보
```typescript
{
  id: string;
  name: string;
  tag?: string;
}
```

#### `priceHistory`
가격 히스토리 (매일 누적)
```typescript
{
  gameId: string;
  gameName: string;
  crawledAt: string;
  totalItems: number;
  priceStats: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  items: PriceData[];
  rawPrices: number[];
}
```

#### `gamePrices`
게임별 최신 가격 정보
```typescript
{
  gameId: string;
  gameName: string;
  lastUpdated: string;
  currentStats: PriceStats;
  totalItems: number;
}
```

## 스케줄러 설정

### 자동 크롤링
- **실행 시간**: 매일 정오 (12:00)
- **실행 환경**: 프로덕션 환경에서만 자동 실행
- **개발 환경**: 수동으로만 실행 가능

### 크롤링 간격
- 게임 간 2초 간격으로 크롤링하여 서버 부하 방지
- 각 게임당 최대 20개 상품 정보 저장

## 배포

### Vercel 배포 (권장)
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 완료

### 환경 변수 설정 (Vercel)
- Firebase 관련 환경 변수 설정
- `GOOGLE_APPLICATION_CREDENTIALS`를 Vercel 환경 변수로 설정

## 개발 가이드

### 새로운 크롤링 사이트 추가
1. `src/lib/crawler.ts`에 새로운 크롤링 함수 추가
2. `src/lib/scheduler.ts`에서 새로운 함수 호출
3. 데이터 구조에 맞게 파싱 로직 구현

### UI 컴포넌트 추가
1. `src/components/` 디렉토리에 새 컴포넌트 생성
2. shadcn/ui 스타일 가이드 준수
3. TypeScript 타입 정의 추가

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의사항

프로젝트에 대한 문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.
