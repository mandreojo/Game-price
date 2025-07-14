"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { Home, Share2, Search, Loader2, RefreshCw } from "lucide-react";

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<"online" | "offline">("online");
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [gameData, setGameData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const gameName = decodeURIComponent(params.gameId as string);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = baseUrl + `/game/${encodeURIComponent(gameName)}`;

  // 게임 데이터 크롤링
  const fetchGameData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game: gameName }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGameData(result);
      } else {
        setError(result.error || "매물을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("크롤링 에러:", error);
      setError("데이터를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 로드 시 자동 크롤링
  React.useEffect(() => {
    fetchGameData();
  }, [gameName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/game/${encodeURIComponent(search.trim())}`);
  };

  const handleRefresh = () => {
    fetchGameData();
  };

  // 추천 껨값 계산 (중위값 기준으로 약간 낮게)
  const getRecommendedPrice = (medianPrice: number) => {
    return Math.round(medianPrice * 0.9); // 중위값의 90%
  };

  // 페이지네이션 계산
  const pagedItems = gameData && gameData.items
    ? gameData.items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    : [];
  const totalPages = gameData && gameData.items
    ? Math.ceil(gameData.items.length / ITEMS_PER_PAGE)
    : 1;

  return (
    <main className="min-h-screen bg-[#f9fafb] flex flex-col items-center py-6 px-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        {/* 상단 네비 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded hover:bg-gray-100 transition"
            aria-label="홈으로"
          >
            <Home size={28} className="text-[#2563eb]" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded hover:bg-gray-100 transition disabled:opacity-50"
              aria-label="새로고침"
            >
              <RefreshCw size={24} className={`text-[#2563eb] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="p-2 rounded hover:bg-gray-100 transition"
              aria-label="공유하기"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch (e) {
                  alert("클립보드 복사에 실패했습니다.");
                }
              }}
            >
              <Share2 size={26} className="text-[#2563eb]" />
            </button>
          </div>
        </div>
        
        {copied && (
          <div className="mb-2 text-center text-sm text-[#3182f6] font-bold animate-fade-in">링크가 복사되었습니다!</div>
        )}
        
        {/* 검색필드 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            className="flex-1 h-10 text-base bg-[#f5f6fa] border-none focus:ring-2 focus:ring-[#3182f6]"
            placeholder="게임명을 입력하세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-[#3182f6] text-white font-bold rounded-lg px-4 h-10 text-base shadow-sm hover:bg-[#2563eb] transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            검색
          </button>
        </form>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#3182f6] mx-auto mb-2" />
            <div className="text-gray-600">시세 정보를 가져오는 중...</div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold mb-2">검색 결과 없음</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <button
              onClick={handleRefresh}
              className="bg-[#3182f6] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2563eb] transition"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 시세 카드 */}
        {gameData && !isLoading && (
          <>
            <div className="rounded-xl border border-gray-200 bg-[#f5f6fa] p-4 mb-4 shadow-sm">
              <div className="text-lg font-bold text-[#222] mb-2">{gameData.game}</div>
              <div className="flex justify-between text-xs mb-1">
                <div className="text-blue-600">최저가<br /><span className="font-bold text-base">{gameData.min_price.toLocaleString()}원</span></div>
                <div className="text-gray-600">평균가<br /><span className="font-bold text-base">{gameData.avg_price.toLocaleString()}원</span></div>
                <div className="text-red-500">최고가<br /><span className="font-bold text-base">{gameData.max_price.toLocaleString()}원</span></div>
              </div>
              <div className="mt-2 bg-[#e8f3ff] rounded-lg py-2 text-center text-[#3182f6] font-bold text-base tracking-tight">
                추천 껨값 <span className="text-2xl">{(Math.round(gameData.median_price / 1000) * 1000).toLocaleString()}원</span>
              </div>
              <div className="text-xs text-gray-400 text-right mt-1">번개장터 실시간 기준</div>
            </div>

            {/* 탭 UI */}
            <div className="flex mb-2 border rounded-lg overflow-hidden">
              <button
                className={`flex-1 py-2 text-sm font-bold ${tab === "online" ? "bg-[#3182f6] text-white" : "bg-white text-[#222]"}`}
                onClick={() => setTab("online")}
                type="button"
              >
                온라인 시세
              </button>
              <button
                className={`flex-1 py-2 text-sm font-bold ${tab === "offline" ? "bg-[#3182f6] text-white" : "bg-white text-[#222]"}`}
                onClick={() => setTab("offline")}
                type="button"
              >
                오프라인 정보
              </button>
            </div>

            {/* 리스트 */}
            {tab === "online" ? (
              <div className="space-y-2">
                {pagedItems && pagedItems.length > 0 ? (
                  pagedItems.map((item: any, i: number) => {
                    // 판매 상태 확인 (제목에 "판매완료", "예약중" 등의 키워드가 있는지)
                    const isSold = item.title?.includes('판매완료') || item.title?.includes('예약중') || item.title?.includes('거래완료');
                    const isReserved = item.title?.includes('예약중') || item.title?.includes('예약');
                    
                    // 상세페이지 url만 허용
                    const isValidProductUrl = item.url && typeof item.url === 'string' && item.url.startsWith('https://www.bunjang.co.kr/products/');
                    
                    return (
                      <div
                        key={i + (page-1)*ITEMS_PER_PAGE}
                        className={`block border rounded-lg p-3 transition ${
                          isSold 
                            ? 'bg-gray-100 opacity-60' 
                            : isReserved 
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-[#f9fafb] hover:bg-[#e8f3ff]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-semibold text-[#222] text-sm flex-1">{item.title}</div>
                          {isSold && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
                              판매완료
                            </span>
                          )}
                          {isReserved && !isSold && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-600 text-xs font-bold rounded">
                              예약중
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className={`font-bold ${isSold ? 'text-gray-500 line-through' : 'text-blue-600'}`}>
                            {item.price.toLocaleString()}원
                          </span>
                          <span className="text-gray-400">{item.date}</span>
                          {isValidProductUrl ? (
                            <a 
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs underline ${
                                isSold ? 'text-gray-400' : 'text-[#3182f6]'
                              }`}
                            >
                              바로가기
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">링크 없음</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    온라인 매물이 없습니다.
                  </div>
                )}
                {/* 페이지네이션 UI */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      className="px-3 py-1 rounded border text-sm font-bold disabled:opacity-40"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      이전
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        className={`px-3 py-1 rounded border text-sm font-bold ${page === idx + 1 ? 'bg-[#3182f6] text-white' : 'bg-white text-[#222]'}`}
                        onClick={() => setPage(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 rounded border text-sm font-bold disabled:opacity-40"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border rounded-lg p-3 bg-[#f9fafb]">
                  <div className="font-semibold text-[#222] text-sm mb-1">
                    중고게임샵 <span className="text-blue-600 font-bold ml-2">준비중</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">오프라인 정보</span>
                    <span className="text-gray-500">서비스 준비 중</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 