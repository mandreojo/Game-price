"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Share2, Search } from "lucide-react";
import PriceDisplay from "@/components/PriceDisplay";

// 대시보드 데이터 타입
interface DashboardGame {
  name: string;
  min: number;
  avg: number;
  max: number;
  recommend: number;
  searchCount?: number;
  changeRate?: number;
}

interface DashboardData {
  popularGames: DashboardGame[];
  risingGames: DashboardGame[];
  fallingGames: DashboardGame[];
}

export default function MainPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [gameList, setGameList] = React.useState<any[]>([]);
  const [filteredGames, setFilteredGames] = React.useState<any[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // 게임 리스트와 대시보드 데이터 불러오기 (최초 1회)
  React.useEffect(() => {
    Promise.all([
      fetch("/api/games").then(res => res.json()),
      fetch("/api/dashboard").then(res => res.json())
    ]).then(([gamesData, dashboardData]) => {
      setGameList(gamesData);
      setDashboardData(dashboardData);
      setLoading(false);
    }).catch(error => {
      console.error('데이터 로딩 실패:', error);
      setLoading(false);
    });
  }, []);

  // 검색 입력 시 자동완성 후보 필터링
  React.useEffect(() => {
    if (!search.trim()) {
      setFilteredGames([]);
      setShowDropdown(false);
      return;
    }
    const q = search.trim().toLowerCase();
    const filtered = gameList.filter((g: any) =>
      g.name?.toLowerCase().includes(q) || g.tag?.toLowerCase().includes(q)
    );
    setFilteredGames(filtered);
    setShowDropdown(filtered.length > 0);
  }, [search, gameList]);

  // ESC/바깥 클릭으로 드롭다운 닫기
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-autocomplete-container")) setShowDropdown(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    // 상세페이지로 이동
    router.push(`/game/${encodeURIComponent(search.trim())}`);
  };

  const handleGameSelect = (gameName: string) => {
    setSearch(gameName);
    setShowDropdown(false);
    router.push(`/game/${encodeURIComponent(gameName)}`);
  };

  return (
    <main className="min-h-screen bg-[#f9fafb] flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h1 className="text-3xl font-bold text-[#222] mb-2 tracking-tight">껨값</h1>
        <p className="text-gray-500 mb-6 text-base leading-relaxed">중고거래 눈탱이, 치지도 말고 맞지도 말자 👊</p>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6 search-autocomplete-container relative">
          <Input
            className="flex-1 h-12 text-lg bg-[#f5f6fa] border-none focus:ring-2 focus:ring-[#3182f6]"
            placeholder="게임명을 입력하세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            onFocus={() => { if (filteredGames.length > 0) setShowDropdown(true); }}
          />
          <button
            type="submit"
            className="bg-[#3182f6] text-white font-bold rounded-lg px-5 h-12 text-lg shadow-sm hover:bg-[#2563eb] transition flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            검색
          </button>
          {showDropdown && filteredGames.length > 0 && (
            <ul className="absolute top-14 left-0 w-full bg-white border rounded shadow z-10 max-h-60 overflow-y-auto">
              {filteredGames.map((g, idx) => (
                <li
                  key={g.id}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                  onClick={() => handleGameSelect(g.name)}
          >
                  <div className="font-semibold">{g.name}</div>
                  {g.tag && <div className="text-gray-500">{g.tag}</div>}
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* 대시보드 섹션 */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : dashboardData ? (
          <>
            {/* 많이 찾은 게임 */}
            <div className="mb-7">
              <div className="text-lg font-extrabold text-[#2563eb] mb-3 pl-1 tracking-tight">
                많이 찾은 게임
        </div>
              {dashboardData.popularGames.map((game: DashboardGame) => (
                <Link
                  key={game.name}
                  href={`/game/${encodeURIComponent(game.name)}`}
                  className="block rounded-xl border border-gray-200 bg-[#f5f6fa] p-4 mb-3 shadow-sm hover:bg-[#e8f3ff] transition"
                >
                  <div className="text-lg font-bold text-[#222] mb-2">{game.name}</div>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="text-blue-600">최저가<br /><span className="font-bold text-base">{game.min.toLocaleString()}원</span></div>
                    <div className="text-gray-600">평균가<br /><span className="font-bold text-base">{game.avg.toLocaleString()}원</span></div>
                    <div className="text-red-500">최고가<br /><span className="font-bold text-base">{game.max.toLocaleString()}원</span></div>
                  </div>
                  <div className="mt-2 bg-[#e8f3ff] rounded-lg py-2 text-center text-[#3182f6] font-bold text-base tracking-tight">
                    추천 껨값 <span className="text-2xl">{game.recommend.toLocaleString()}원</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 떡상중인 타이틀 */}
            <div className="mb-7">
              <div className="text-lg font-extrabold text-[#2563eb] mb-3 pl-1 tracking-tight">
                떡상중인 타이틀
              </div>
              {dashboardData.risingGames.map((game: DashboardGame) => (
                <Link
                  key={game.name}
                  href={`/game/${encodeURIComponent(game.name)}`}
                  className="block rounded-xl border border-gray-200 bg-[#f5f6fa] p-4 mb-3 shadow-sm hover:bg-[#e8f3ff] transition"
                >
                  <div className="text-lg font-bold text-[#222] mb-2 flex items-center justify-between">
                    {game.name}
                    <span className="text-green-600 text-sm font-bold">+{game.changeRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="text-blue-600">최저가<br /><span className="font-bold text-base">{game.min.toLocaleString()}원</span></div>
                    <div className="text-gray-600">평균가<br /><span className="font-bold text-base">{game.avg.toLocaleString()}원</span></div>
                    <div className="text-red-500">최고가<br /><span className="font-bold text-base">{game.max.toLocaleString()}원</span></div>
                  </div>
                  <div className="mt-2 bg-[#e8f3ff] rounded-lg py-2 text-center text-[#3182f6] font-bold text-base tracking-tight">
                    추천 껨값 <span className="text-2xl">{game.recommend.toLocaleString()}원</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 떡락중인 타이틀 */}
            <div className="mb-7">
              <div className="text-lg font-extrabold text-[#2563eb] mb-3 pl-1 tracking-tight">
                떡락중인 타이틀
              </div>
              {dashboardData.fallingGames.map((game: DashboardGame) => (
                <Link
                  key={game.name}
                  href={`/game/${encodeURIComponent(game.name)}`}
                  className="block rounded-xl border border-gray-200 bg-[#f5f6fa] p-4 mb-3 shadow-sm hover:bg-[#e8f3ff] transition"
                >
                  <div className="text-lg font-bold text-[#222] mb-2 flex items-center justify-between">
                    {game.name}
                    <span className="text-red-600 text-sm font-bold">{game.changeRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="text-blue-600">최저가<br /><span className="font-bold text-base">{game.min.toLocaleString()}원</span></div>
                    <div className="text-gray-600">평균가<br /><span className="font-bold text-base">{game.avg.toLocaleString()}원</span></div>
                    <div className="text-red-500">최고가<br /><span className="font-bold text-base">{game.max.toLocaleString()}원</span></div>
                  </div>
                  <div className="mt-2 bg-[#e8f3ff] rounded-lg py-2 text-center text-[#3182f6] font-bold text-base tracking-tight">
                    추천 껨값 <span className="text-2xl">{game.recommend.toLocaleString()}원</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">데이터를 불러올 수 없습니다.</div>
        )}
      </div>

      {/* 가격 정보 섹션 */}
      <div className="w-full max-w-6xl mt-8">
        <PriceDisplay />
      </div>
    </main>
  );
}
