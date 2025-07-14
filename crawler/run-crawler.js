const { spawn } = require('child_process');
const admin = require('firebase-admin');

// Firestore 초기화
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
}

// Firestore에서 게임 목록 가져오기
async function getGameList() {
  if (!db) {
    console.log('Firestore가 연결되지 않아 기본 게임 목록을 사용합니다.');
    return [
      "닌텐도 스위치",
      "슈퍼 마리오 오디세이",
      "젤다의 전설",
      "포켓몬스터",
      "스플래툰",
      "동물의 숲",
      "마리오 카트",
      "스마쉬 브라더스",
      "마리오 파티",
      "루이지 맨션"
    ];
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

async function runCrawler(game) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 크롤링 시작: ${game}`);
    
    const child = spawn('node', ['bunjang.js', game], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`❌ ${game} 크롤링 에러:`, data.toString());
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${game} 크롤링 완료`);
        resolve();
      } else {
        console.log(`❌ ${game} 크롤링 실패 (코드: ${code})`);
        reject(new Error(`크롤링 실패: ${code}`));
      }
    });
    
    // 30초 타임아웃
    setTimeout(() => {
      child.kill();
      console.log(`⏰ ${game} 크롤링 타임아웃`);
      reject(new Error('타임아웃'));
    }, 30000);
  });
}

async function runAllCrawlers() {
  console.log('🚀 껨값 크롤러 배치 실행 시작');
  console.log(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
  
  // Firestore에서 게임 목록 가져오기
  const games = await getGameList();
  console.log(`🎮 크롤링할 게임 수: ${games.length}개`);
  
  if (games.length === 0) {
    console.log('❌ 크롤링할 게임이 없습니다.');
    return;
  }
  
  const results = [];
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    try {
      await runCrawler(game);
      results.push({ game, status: 'success' });
      
      // 게임 간 2초 대기 (API 제한 방지)
      if (i < games.length - 1) {
        console.log('⏳ 2초 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ ${game} 크롤링 실패:`, error.message);
      results.push({ game, status: 'failed', error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n📊 크롤링 결과 요약');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failedCount}개`);
  
  if (failedCount > 0) {
    console.log('\n❌ 실패한 게임들:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.game}: ${r.error}`);
    });
  }
  
  console.log('\n🎉 배치 크롤링 완료!');
}

// 스크립트 실행
if (require.main === module) {
  runAllCrawlers().catch(console.error);
}

module.exports = { runAllCrawlers, getGameList }; 