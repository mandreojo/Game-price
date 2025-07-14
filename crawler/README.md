# 껨값 크롤러 (Ggemgap Crawler)

번개장터에서 게임 시세 정보를 크롤링하여 Firestore에 저장하는 자동화 도구입니다.

## 🚀 주요 기능

- **번개장터 API 크롤링**: 실시간 게임 시세 정보 수집
- **게임 본품 필터링**: 카드, 피규어, 굿즈 등 제외하고 게임 본품만 수집
- **극단값 제거**: 상위/하위 10% 제거하여 신뢰성 있는 가격 데이터 제공
- **Firestore 연동**: 수집된 데이터를 자동으로 데이터베이스에 저장
- **배치 처리**: 여러 게임을 한 번에 크롤링
- **GitHub Actions 자동화**: 매일 자동으로 크롤링 실행

## 📦 설치

```bash
cd crawler
npm install
```

## 🔧 설정

### Firestore 서비스 계정 키 설정

1. Firebase Console에서 서비스 계정 키 다운로드
2. `serviceAccountKey.json` 파일을 `crawler` 폴더에 저장

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🎮 사용법

### 단일 게임 크롤링

```bash
node bunjang.js "슈퍼 마리오 오디세이"
```

### 배치 크롤링 (Firestore gamelist 기반)

```bash
node run-crawler.js
```

### GitHub Actions 자동화

1. GitHub Secrets에 `FIREBASE_SERVICE_ACCOUNT_KEY` 설정
2. 매일 자정(UTC)에 자동 실행
3. 수동 실행도 가능 (Actions 탭에서)

## 📊 데이터 구조

### Firestore 컬렉션

#### `price_history/{game_name}/daily/{date}`
```json
{
  "keyword": "슈퍼 마리오 오디세이",
  "date": "2024-01-01",
  "timestamp": "2024-01-01T00:00:00Z",
  "count": 14,
  "min_price": 30000,
  "max_price": 220000,
  "avg_price": 55000,
  "items": [...],
  "source": "bunjang",
  "outlier_removed": true
}
```

#### `gamelist/{game_name}`
```json
{
  "name": "슈퍼 마리오 오디세이",
  "last_updated": "2024-01-01T00:00:00Z",
  "search_count": 1
}
```

## 🔍 필터링 규칙

### 제외 키워드 (게임 본품이 아닌 것들)
- 카드, 피규어, 인형, 아미보, 굿즈, 키링
- 포스터, 액자, 컵, 머그컵, 티셔츠
- 컨트롤러, 조이스틱, 패드, 리모컨
- 케이스, 보호필름, 거치대, 홀더
- 만화, 책, 잡지, 가이드북
- 음반, CD, DVD, 블루레이
- 기타 액세서리, 장식품, 소품

### 포함 키워드 (게임 본품)
- 게임, 칩, 카트리지, 디스크
- 닌텐도, 스위치, 3DS, DS, Wii
- 플레이스테이션, PS, 엑스박스, Xbox
- PC게임, 스팀, 오리진
- 한글판, 일본판, 미개봉, 새상품, 중고

## 📈 극단값 제거

- 상위 10%와 하위 10% 제거
- 5개 미만의 데이터는 제거하지 않음
- 더 신뢰성 있는 평균가 계산

## 🛠️ 개발

### 의존성
- `axios`: HTTP 요청
- `cheerio`: HTML 파싱
- `firebase-admin`: Firestore 연동

### 파일 구조
```
crawler/
├── bunjang.js          # 메인 크롤러
├── run-crawler.js      # 배치 크롤러
├── package.json        # 의존성
├── serviceAccountKey.json  # Firestore 키 (gitignore)
└── README.md           # 이 파일
```

## 🔧 문제 해결

### Firestore 연결 실패
- `serviceAccountKey.json` 파일이 있는지 확인
- Firebase 프로젝트 설정 확인

### 크롤링 결과 없음
- 검색어 확인
- 번개장터 API 상태 확인
- 네트워크 연결 확인

### 타임아웃 에러
- 네트워크 상태 확인
- 번개장터 서버 상태 확인

## 📝 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요. 