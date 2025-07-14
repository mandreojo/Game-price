# 🎮 번개장터 게임 가격 크롤러 (GGEMGAP)

Nintendo Switch 게임의 번개장터 가격을 실시간으로 크롤링하고 분석하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **실시간 크롤링**: 번개장터에서 30일치 매물 데이터 수집
- **가격 분석**: 절사평균 기반 추천가 계산
- **극단값 제거**: 아웃라이어 제거로 신뢰성 높은 가격 정보
- **키워드 필터링**: 불필요한 키워드(파우치, 아미보 등) 자동 제외
- **판매 상태 구분**: 판매중/판매완료 상태별 표시
- **반응형 UI**: 모바일/데스크톱 최적화

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firestore
- **Crawling**: Cheerio, Axios
- **Deployment**: Vercel

## 🚀 배포 방법

### 1. 환경 변수 설정

Vercel에서 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 2. Vercel 배포

1. GitHub 레포를 Vercel에 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 3. 크롤러 실행

배포 후 다음 API 엔드포인트로 크롤러를 실행할 수 있습니다:

```bash
POST /api/crawl
```

## 📊 데이터 구조

### 게임 정보
```typescript
interface Game {
  id: string;
  name: string;
  averagePrice: number;
  recommendedPrice: number; // 절사평균
  totalItems: number;
  filteredItems: number; // 극단값 제거 후
  lastUpdated: Date;
}
```

### 매물 정보
```typescript
interface Item {
  id: string;
  title: string;
  price: number;
  status: '판매중' | '판매완료';
  url: string;
  createdAt: Date;
}
```

## 🔧 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📈 크롤링 통계

- **수집 게임**: 50+ Nintendo Switch 게임
- **데이터 기간**: 최근 30일
- **업데이트 주기**: 수동 실행 (API 호출)
- **가격 계산**: 상위/하위 10% 제거 후 평균

## 🎯 주요 개선사항

1. **절사평균 도입**: 극단값 제거로 신뢰성 향상
2. **키워드 필터링**: 불필요한 매물 자동 제외
3. **판매 상태 구분**: 실시간 판매 상태 표시
4. **반응형 UI**: 모든 디바이스 최적화
5. **성능 최적화**: 효율적인 데이터 처리

## 📝 라이선스

MIT License

---

**개발자**: Tae-woon Ahn  
**최종 업데이트**: 2024년 12월
