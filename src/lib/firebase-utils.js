// Firebase 유틸리티 함수들
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { db } from './firebase';

// 게임 데이터 컬렉션 이름
const GAMES_COLLECTION = 'games';
const STATS_COLLECTION = 'gameStats';

// 게임 데이터 가져오기
export const getGamesData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, GAMES_COLLECTION));
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({ id: doc.id, ...doc.data() });
    });
    return games;
  } catch (error) {
    console.error('게임 데이터 가져오기 오류:', error);
    return [];
  }
};

// 게임 통계 데이터 가져오기
export const getGameStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, STATS_COLLECTION));
    const stats = [];
    querySnapshot.forEach((doc) => {
      stats.push({ id: doc.id, ...doc.data() });
    });
    return stats;
  } catch (error) {
    console.error('게임 통계 데이터 가져오기 오류:', error);
    return [];
  }
};

// 새 게임 데이터 추가
export const addGameData = async (gameData) => {
  try {
    const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
      ...gameData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('게임 데이터 추가 오류:', error);
    throw error;
  }
};

// 게임 데이터 업데이트
export const updateGameData = async (gameId, updateData) => {
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('게임 데이터 업데이트 오류:', error);
    throw error;
  }
};

// 최신 게임 데이터 가져오기 (최근 10개)
export const getRecentGames = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, GAMES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({ id: doc.id, ...doc.data() });
    });
    return games;
  } catch (error) {
    console.error('최신 게임 데이터 가져오기 오류:', error);
    return [];
  }
}; 