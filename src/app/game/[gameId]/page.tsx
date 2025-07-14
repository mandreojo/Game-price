"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GameData {
  name: string;
  min_price?: number;
  avg_price?: number;
  max_price?: number;
  recommended_price?: number;
  count?: number;
  items?: ItemData[];
  updated_at?: string;
}

interface ItemData {
  id: string;
  title: string;
  price: number;
  status: string;
  url: string;
  created_at?: string;
}

export default function GameDetailPage({ params }: { params: { gameId: string } }) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameId = decodeURIComponent(params.gameId);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game: gameId }),
      });

      if (!response.ok) {
        throw new Error('게임 데이터를 가져올 수 없습니다.');
      }

      const data = await response.json();
      setGameData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '판매중':
        return 'text-green-600 bg-green-100';
      case '판매완료':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">게임을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">"{gameId}"에 대한 데이터가 없습니다.</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{gameData.name}</h1>
          <p className="text-gray-600">
            번개장터 중고 가격 정보 • {gameData.count || 0}개 매물
            {gameData.updated_at && (
              <span className="ml-2">• 업데이트: {formatDate(gameData.updated_at)}</span>
            )}
          </p>
        </header>

        {/* 가격 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">최저가</h3>
            <p className="text-3xl font-bold text-green-600">
              {gameData.min_price ? `${formatPrice(gameData.min_price)}원` : 'N/A'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">평균가</h3>
            <p className="text-3xl font-bold text-blue-600">
              {gameData.avg_price ? `${formatPrice(gameData.avg_price)}원` : 'N/A'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">최고가</h3>
            <p className="text-3xl font-bold text-red-600">
              {gameData.max_price ? `${formatPrice(gameData.max_price)}원` : 'N/A'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 bg-gradient-to-r from-purple-500 to-purple-600">
            <h3 className="text-lg font-semibold text-white mb-2">추천가</h3>
            <p className="text-3xl font-bold text-white">
              {gameData.recommended_price ? `${formatPrice(gameData.recommended_price)}원` : 'N/A'}
            </p>
          </div>
        </div>

        {/* 매물 목록 */}
        {gameData.items && gameData.items.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">매물 목록</h2>
            <div className="space-y-4">
              {gameData.items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 flex-1 mr-4">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {item.title}
                      </a>
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(item.price)}원
                    </span>
                    {item.created_at && (
                      <span className="text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">매물이 없습니다</h2>
            <p className="text-gray-600">현재 판매 중인 매물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 