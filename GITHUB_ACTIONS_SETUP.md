# 🚀 GitHub Actions 자동 크롤링 설정 가이드

## 📋 **GitHub Secrets 설정**

GitHub 레포지토리에서 다음 환경변수들을 설정해야 합니다:

### **1. GitHub Secrets 추가 방법**
1. GitHub 레포지토리 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 각 환경변수 추가

### **2. 필요한 Secrets 목록**

#### **Firebase 설정**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### **Firebase Admin SDK (서비스 계정)**
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_ID=your_client_id
```

### **3. Firebase 서비스 계정 키 얻는 방법**

1. **Firebase Console** → 프로젝트 설정 → 서비스 계정
2. **새 비공개 키 생성** 클릭
3. 다운로드된 JSON 파일에서 필요한 값들 추출

```json
{
  "type": "service_account",
  "project_id": "your_project_id",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project.iam.gserviceaccount.com"
}
```

## ⏰ **실행 스케줄**

- **매일 정오 (한국시간 12:00)** 자동 실행
- **수동 실행** 가능 (GitHub Actions 탭에서 "Run workflow" 클릭)

## 🔧 **워크플로우 동작**

1. **코드 체크아웃** - 최신 코드 가져오기
2. **Node.js 설정** - Node.js 18 설치
3. **의존성 설치** - npm 패키지 설치
4. **환경변수 설정** - GitHub Secrets를 .env 파일로 변환
5. **크롤링 실행** - 17개 게임 순차 크롤링
6. **Firestore 저장** - 각 게임 데이터를 DB에 저장
7. **결과 커밋** - 변경사항 자동 커밋

## 📊 **크롤링 대상 게임**

1. 슈퍼 마리오 오디세이
2. 젤다의 전설 야생의 숨결
3. 젤다의 전설 티어스 오브 더 킹덤
4. 스플래툰 3
5. 모여봐요 동물의 숲
6. 포켓몬스터 소드
7. 포켓몬스터 실드
8. 마리오 카트 8 디럭스
9. 슈퍼 스매시브라더스 얼티밋
10. 별의 커비 디스커버리
11. 파이어엠블렘
12. 몬스터헌터 라이즈
13. 미토피아
14. 별의 커비 스타 얼라이즈
15. 슈퍼 마리오 파티
16. 스플래툰 2
17. 잇 테이크 투

## 🎯 **특징**

- **극단값 제거**: 아웃라이어 제거로 정확한 가격 통계
- **키워드 필터링**: 파우치, 아미보 등 부속품 제외
- **절사평균**: 추천가 계산 (상하위 10% 제거)
- **판매 상태 구분**: 판매중/판매완료 구분
- **자동 커밋**: 크롤링 결과 자동 저장

## 📈 **결과 확인**

- **GitHub Actions** 탭에서 실행 로그 확인
- **Firestore**에서 실시간 데이터 확인
- **웹앱**에서 업데이트된 가격 정보 확인

## 🚨 **주의사항**

- GitHub Actions는 **월 2,000분 무료** (충분함)
- **6시간 제한**으로 인해 17개 게임만 크롤링
- **순차 처리**로 안정성 확보
- **딜레이 적용**으로 서버 부하 방지 