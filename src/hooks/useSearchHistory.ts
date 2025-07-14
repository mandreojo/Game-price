import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  id: string;
  gameName: string;
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'ggemgap_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 로컬 스토리지에서 검색 히스토리 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as SearchHistoryItem[];
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('검색 히스토리 로드 실패:', error);
    }
  }, []);

  // 검색 히스토리에 추가 (메모이제이션)
  const addToHistory = useCallback((gameName: string) => {
    if (!gameName.trim()) return;

    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      gameName: gameName.trim(),
      timestamp: Date.now()
    };

    setSearchHistory(prev => {
      // 중복 제거 (같은 게임명이 있으면 제거)
      const filtered = prev.filter(item => item.gameName !== gameName);
      
      // 새 아이템을 맨 앞에 추가
      const updated = [newItem, ...filtered];
      
      // 최대 개수 제한
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      
      // 로컬 스토리지에 저장
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error('검색 히스토리 저장 실패:', error);
      }
      
      return limited;
    });
  }, []);

  // 검색 히스토리에서 제거 (메모이제이션)
  const removeFromHistory = useCallback((id: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('검색 히스토리 저장 실패:', error);
      }
      
      return updated;
    });
  }, []);

  // 검색 히스토리 전체 삭제 (메모이제이션)
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('검색 히스토리 삭제 실패:', error);
    }
  }, []);

  // 상대적 시간 포맷 (예: "2분 전", "1시간 전") (메모이제이션)
  const formatRelativeTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return new Date(timestamp).toLocaleDateString('ko-KR');
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    formatRelativeTime
  };
} 