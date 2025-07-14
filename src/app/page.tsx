'use client';

import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AutoComplete from "@/components/AutoComplete";
import { GameCardSkeleton } from "@/components/ui/loading";
import SearchHistory from "@/components/SearchHistory";
import { useSearchHistory } from "@/hooks/useSearchHistory";

interface GameCardData {
  id: string;
  name: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  recommended: number;
  tag: "인기" | "딱상" | "딱락";
}

const DUMMY_GAMES: GameCardData[] = [
  {
    id: "1",
    name: "슈퍼 마리오 오디세이",
    minPrice: 20000,
    avgPrice: 35000,
    maxPrice: 50000,
    recommended: 30000,
    tag: "인기",
  },
  {
    id: "2",
    name: "젤다의 전설 브레스 오브 더 와일드",
    minPrice: 25000,
    avgPrice: 40000,
    maxPrice: 60000,
    recommended: 35000,
    tag: "딱상",
  },
  {
    id: "3",
    name: "마리오 카트 8 디럭스",
    minPrice: 18000,
    avgPrice: 32000,
    maxPrice: 48000,
    recommended: 29000,
    tag: "딱락",
  },
  // ... 더미 데이터 추가 가능 ...
];

function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link href={`/game/${encodeURIComponent(game.name)}`} className="block">
      <div className="rounded-xl border bg-card shadow-sm p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="font-bold text-lg mb-2 text-card-foreground">{game.name}</div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400 font-semibold">최저가<br/>{game.minPrice.toLocaleString()}원</span>
          <span className="text-muted-foreground font-semibold">평균가<br/>{game.avgPrice.toLocaleString()}원</span>
          <span className="text-red-400 font-semibold">최고가<br/>{game.maxPrice.toLocaleString()}원</span>
        </div>
        <div className="mt-2 bg-green-950/20 rounded-md py-2 text-center">
          <span className="text-xs text-muted-foreground">추천 껨값</span><br/>
          <span className="text-xl font-bold text-green-400">{game.recommended.toLocaleString()}원</span>
        </div>
      </div>
    </Link>
  );
}

export default function MainPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToHistory } = useSearchHistory();

  // 검색 시 로딩 상태 관리
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 게임 검색 처리
  const handleSearch = (gameName: string) => {
    if (gameName.trim()) {
      setIsLoading(true);
      addToHistory(gameName.trim());
      router.push(`/game/${encodeURIComponent(gameName.trim())}`);
    }
  };

  // 수동 검색 버튼 클릭
  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background py-8 px-2">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-6 border">
        <div className="mb-6">
          <div className="font-extrabold text-3xl text-card-foreground mb-1">껨값</div>
          <div className="text-muted-foreground text-sm mb-4">중고거래 눈탱이, 치지도 말고 맞지도 말자</div>
          <div className="flex gap-2">
            <AutoComplete
              onSelect={handleSearch}
              placeholder="게임명을 입력하세요"
              className="flex-1"
            />
            <Button 
              type="button" 
              className="shrink-0"
              onClick={handleSearchClick}
            >
              검색
            </Button>
          </div>
          
          {/* 검색 히스토리 */}
          <SearchHistory onSelect={handleSearch} className="mt-4" />
        </div>
        {/* 많이 찾은 게임 */}
        <div className="mb-2 text-xs text-muted-foreground font-semibold">많이 찾은 게임</div>
        {isLoading ? (
          <>
            <GameCardSkeleton />
            <GameCardSkeleton />
          </>
        ) : (
          DUMMY_GAMES.filter(g => g.tag === "인기").map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
        {/* 딱상/딱락 타이틀 */}
        <div className="mb-2 mt-6 text-xs text-muted-foreground font-semibold">딱상중인 타이틀</div>
        {isLoading ? (
          <GameCardSkeleton />
        ) : (
          DUMMY_GAMES.filter(g => g.tag === "딱상").map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
        <div className="mb-2 mt-6 text-xs text-muted-foreground font-semibold">딱락중인 타이틀</div>
        {isLoading ? (
          <GameCardSkeleton />
        ) : (
          DUMMY_GAMES.filter(g => g.tag === "딱락").map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </div>
    </div>
  );
} 