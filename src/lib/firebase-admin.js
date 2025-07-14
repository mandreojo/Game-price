// Firebase Admin SDK 설정 파일 (서버 사이드용)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 서비스 계정 키 파일 경로 (환경변수에서 가져오거나 직접 지정)
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

// Firebase Admin 앱 초기화 (이미 초기화된 경우 재사용)
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: cert(serviceAccountPath),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch (error) {
    console.error('Firebase Admin 초기화 오류:', error);
    // 개발 환경에서는 더미 데이터 사용
    app = null;
  }
} else {
  app = getApps()[0];
}

// Firestore 데이터베이스 초기화
const adminDb = app ? getFirestore(app) : null;

export { app, adminDb }; 