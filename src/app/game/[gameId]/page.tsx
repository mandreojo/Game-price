'use client';

import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AutoComplete from "@/components/AutoComplete";
import { Loading, PriceCardSkeleton, ItemListSkeleton } from "@/components/ui/loading";
import { useSearchHistory } from "@/hooks/useSearchHistory";

function PriceCard({ min, avg, max, recommended }: { min: number; avg: number; max: number; recommended: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 mb-4">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-blue-400 font-semibold">최저가<br/>{min.toLocaleString()}원</span>
        <span className="text-muted-foreground font-semibold">평균가<br/>{avg.toLocaleString()}원</span>
        <span className="text-red-400 font-semibold">최고가<br/>{max.toLocaleString()}원</span>
      </div>
      <div className="mt-2 bg-blue-950/20 rounded-md py-2 text-center">
        <span className="text-xs text-blue-400">추천 껨값</span><br/>
        <span className="text-xl font-bold text-blue-400">{recommended.toLocaleString()}원</span>
      </div>
      <div className="text-xs text-right text-muted-foreground mt-1">번개장터 실시간 기준</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`px-4 py-2 rounded-t-lg font-semibold text-sm border-b-2 transition-colors ${active ? "border-blue-400 text-blue-400 bg-card" : "border-transparent text-muted-foreground bg-muted"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function GameDetailPage() {
  const [tab, setTab] = useState<"online" | "offline">("online");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const gameId = decodeURIComponent(params?.gameId as string || "");
  const { addToHistory } = useSearchHistory();

  useEffect(() => {
    if (!gameId) return;
    
    // 현재 게임을 검색 히스토리에 추가
    addToHistory(gameId);
  }, [gameId, addToHistory]);

  useEffect(() => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    setGameData(null);
    fetch(`/api/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: gameId })
    })
      .then(res => res.ok ? res.json() : Promise.reject('데이터를 불러올 수 없습니다.'))
      .then(data => {
        if (!data || !data.success) throw new Error(data.error || '데이터 없음');
        setGameData(data);
      })
      .catch(err => setError(typeof err === 'string' ? err : err.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  const itemsPerPage = 8;
  const pagedItems = gameData?.items?.slice((page - 1) * itemsPerPage, page * itemsPerPage) || [];
  const totalPages = gameData?.items ? Math.ceil(gameData.items.length / itemsPerPage) : 1;

  // 게임 검색 처리
  const handleSearch = (gameName: string) => {
    if (gameName.trim()) {
      addToHistory(gameName.trim());
      router.push(`/game/${encodeURIComponent(gameName.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background py-8 px-2">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-6 border">
        <Link href="/" className="text-blue-400 text-sm mb-4 inline-block">← 메인으로</Link>
        {/* 검색필드 */}
        <div className="flex gap-2 mb-6">
          <AutoComplete
            onSelect={handleSearch}
            placeholder="다른 게임 검색하기"
            className="flex-1"
          />
        </div>
        {loading ? (
          <div className="space-y-4">
            <div className="font-extrabold text-2xl text-card-foreground mb-1">{gameId}</div>
            <PriceCardSkeleton />
            <div className="flex border-b mb-4">
              <TabButton active={true} onClick={() => {}}>온라인 시세</TabButton>
              <TabButton active={false} onClick={() => {}}>오프라인 정보</TabButton>
            </div>
            <ItemListSkeleton count={8} />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : !gameData ? (
          <div className="text-center py-12 text-muted-foreground">데이터 없음</div>
        ) : (
          <>
            <div className="font-extrabold text-2xl text-card-foreground mb-1">{gameData.game || gameData.name}</div>
            <PriceCard min={gameData.min_price || 0} avg={gameData.avg_price || 0} max={gameData.max_price || 0} recommended={gameData.recommended_price || gameData.recommended || 0} />
            <div className="flex border-b mb-4">
              <TabButton active={tab === "online"} onClick={() => setTab("online")}>온라인 시세</TabButton>
              <TabButton active={tab === "offline"} onClick={() => setTab("offline")}>오프라인 정보</TabButton>
            </div>
            {tab === "online" ? (
              <>
                <div className="divide-y">
                  {pagedItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">매물 데이터 없음</div>
                  ) : pagedItems.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-card-foreground text-sm truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString('ko-KR') : ''}</div>
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <div className="text-base font-bold text-blue-400">{item.price?.toLocaleString()}원</div>
                        {item.url && <a href={item.url} className="text-xs text-blue-400 hover:underline mt-1" target="_blank" rel="noopener noreferrer">바로가기</a>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 페이지네이션 */}
                <div className="flex justify-center gap-1 mt-4">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>이전</Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
                  ))}
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>다음</Button>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12 text-sm">아직 오프라인 매장 제보가 없습니다.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 