// Firebase Admin SDK 설정 파일 (서버 사이드용)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin 앱 초기화 (이미 초기화된 경우 재사용)
let app;
if (getApps().length === 0) {
  try {
    // Vercel 환경에서는 환경변수로 서비스 계정 정보를 받아옴
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

    app = initializeApp({
      credential: cert(serviceAccount),
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