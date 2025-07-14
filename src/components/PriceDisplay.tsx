'use client';

import { useState, useEffect } from 'react';

interface PriceStats {
  min: number;
  max: number;
  avg: number;
  median: number;
}

interface PriceItem {
  title: string;
  price: number;
  date: string;
  timestamp: number;
  url: string;
  location: string;
  image: string;
  status?: 'selling' | 'sold';
  crawledAt: string;
}

interface GamePrice {
  id: string;
  gameId: string;
  gameName: string;
  lastUpdated: string;
  currentStats: PriceStats;
  totalItems: number;
}

export default function PriceDisplay() {
  const [gamePrices, setGamePrices] = useState<GamePrice[]>([]);
  const [selectedGame, setSelectedGame] = useState<GamePrice | null>(null);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGamePrices();
  }, []);

  const fetchGamePrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prices');
      if (!response.ok) {
        throw new Error('가격 정보를 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setGamePrices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceItems = async (gameId: string) => {
    try {
      const response = await fetch(`/api/prices?gameId=${gameId}&limit=50`);
      if (!response.ok) {
        throw new Error('상세 가격 정보를 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.length > 0 && data[0].items) {
        setPriceItems(data[0].items);
      }
    } catch (err) {
      console.error('상세 가격 정보 조회 실패:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleGameClick = (game: GamePrice) => {
    setSelectedGame(game);
    fetchPriceItems(game.gameId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">가격 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">오류: {error}</div>
      </div>
    );
  }

  if (gamePrices.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">아직 가격 정보가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">게임 가격 정보</h2>
        <button
          onClick={fetchGamePrices}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          새로고침
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gamePrices.map((game) => (
          <div 
            key={game.id} 
            className="bg-white rounded-lg shadow-md p-6 border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleGameClick(game)}
          >
            <h3 className="text-lg font-semibold mb-3">{game.gameName}</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">최저가:</span>
                <span className="font-medium text-green-600">
                  {formatPrice(game.currentStats.min)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균가:</span>
                <span className="font-medium text-blue-600">
                  {formatPrice(game.currentStats.avg)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최고가:</span>
                <span className="font-medium text-red-600">
                  {formatPrice(game.currentStats.max)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">중간가:</span>
                <span className="font-medium text-purple-600">
                  {formatPrice(game.currentStats.median)}원
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <div>총 매물: {game.totalItems}개 (30일치)</div>
              <div>업데이트: {formatDate(game.lastUpdated)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 매물 목록 */}
      {selectedGame && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{selectedGame.gameName} - 상세 매물 목록</h3>
            <button
              onClick={() => setSelectedGame(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {priceItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    item.status === 'sold' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.status === 'sold' ? '판매완료' : '판매중'}
                  </span>
                </div>
                
                <div className="text-lg font-bold text-blue-600 mb-2">
                  {formatPrice(item.price)}원
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div>{item.location}</div>
                  <div>{item.date}</div>
                </div>
                
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                  >
                    번개장터에서 보기 →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 