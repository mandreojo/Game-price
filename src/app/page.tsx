"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GameData {
  id: string;
  name: string;
  min_price?: number;
  avg_price?: number;
  max_price?: number;
  recommended_price?: number;
  count?: number;
  updated_at?: string;
}

export default function Home() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      if (data.success && data.games) {
        setGames(data.games);
      }
    } catch (error) {
      console.error('게임 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">게임 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎮 번개장터 게임 가격
          </h1>
          <p className="text-lg text-gray-600">
            Nintendo Switch 게임의 실시간 중고 가격을 확인하세요
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link 
              href={`/game/${encodeURIComponent(game.name)}`} 
              key={game.id}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {game.name}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">최저가:</span>
                    <span className="font-medium text-green-600">
                      {game.min_price ? `${formatPrice(game.min_price)}원` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균가:</span>
                    <span className="font-medium text-blue-600">
                      {game.avg_price ? `${formatPrice(game.avg_price)}원` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">최고가:</span>
                    <span className="font-medium text-red-600">
                      {game.max_price ? `${formatPrice(game.max_price)}원` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-800 font-semibold">추천가:</span>
                    <span className="font-bold text-purple-600">
                      {game.recommended_price ? `${formatPrice(game.recommended_price)}원` : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  매물 수: {game.count || 0}개
                  {game.updated_at && (
                    <span className="block mt-1">
                      업데이트: {formatDate(game.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {games.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              아직 게임 데이터가 없습니다.
            </p>
            <p className="text-gray-500 mt-2">
              크롤러를 실행하여 데이터를 수집해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
