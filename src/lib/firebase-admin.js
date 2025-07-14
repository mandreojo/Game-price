// Firebase Admin SDK 설정 파일 (서버 사이드용)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from 'fs';
import path from 'path';

// Firebase Admin 앱 초기화 (이미 초기화된 경우 재사용)
let app;
if (getApps().length === 0) {
  try {
    // 여러 경로에서 serviceAccountKey.json 파일을 찾아봄
    const possiblePaths = [
      path.join(process.cwd(), 'crawler', 'serviceAccountKey.json'),
      path.join(process.cwd(), 'serviceAccountKey.json'),
      path.join(__dirname, '..', '..', 'crawler', 'serviceAccountKey.json'),
      path.join(__dirname, '..', '..', 'serviceAccountKey.json')
    ];

    let serviceAccount = null;
    let serviceAccountPath = null;

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          serviceAccountPath = filePath;
          console.log(`Firebase Admin: serviceAccountKey.json 파일을 찾았습니다: ${filePath}`);
          break;
        } catch (parseError) {
          console.error(`Firebase Admin: ${filePath} 파일 파싱 오류:`, parseError);
        }
      }
    }

    if (!serviceAccount) {
      throw new Error('serviceAccountKey.json 파일을 찾을 수 없습니다. 가능한 경로: ' + possiblePaths.join(', '));
    }

    // private_key가 문자열인지 확인
    if (typeof serviceAccount.private_key !== 'string') {
      throw new Error('Service account object must contain a string "private_key" property');
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ggemgap'}.firebaseio.com`
    });
    
    console.log('Firebase Admin 초기화 성공');
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