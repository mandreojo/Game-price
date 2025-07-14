'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Clock } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface AutoCompleteResult {
  id: string;
  name: string;
  tag?: string;
  matchType: 'name' | 'tag';
}

interface AutoCompleteProps {
  onSelect: (gameName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AutoComplete({ onSelect, placeholder = "게임명을 입력하세요", className = "" }: AutoCompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutoCompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { searchHistory, formatRelativeTime } = useSearchHistory();

  // 검색어 변경 시 자동완성 API 호출
  useEffect(() => {
    const searchGames = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setShowDropdown(data.results && data.results.length > 0);
        }
      } catch (error) {
        console.error('자동완성 검색 실패:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // 디바운싱 (300ms 지연)
    const timeoutId = setTimeout(searchGames, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems = results.length + (query.length < 2 ? Math.min(searchHistory.length, 5) : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          } else if (query.length < 2 && searchHistory.length > 0) {
            const historyIndex = selectedIndex - results.length;
            const historyItem = searchHistory[historyIndex];
            if (historyItem) {
              handleSelect({ id: historyItem.id, name: historyItem.gameName, matchType: 'name' as const });
            }
          }
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 게임 선택 처리
  const handleSelect = (result: AutoCompleteResult) => {
    setQuery(result.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSelect(result.name);
  };

  // 검색어 하이라이트 함수
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-600/30 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setShowDropdown(true)}
          onBlur={() => {
            // 드롭다운 클릭 시 즉시 닫히지 않도록 지연
            setTimeout(() => setShowDropdown(false), 150);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-background text-foreground"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* 자동완성 드롭다운 */}
      {showDropdown && (results.length > 0 || (query.length < 2 && searchHistory.length > 0)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {/* 검색 결과가 있을 때 */}
          {results.length > 0 && (
            <>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-muted transition-colors ${
                    index === selectedIndex ? 'bg-blue-950/20 border-l-4 border-blue-400' : ''
                  }`}
                  onClick={() => handleSelect(result)}
                >
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-card-foreground">
                        {highlightText(result.name, query)}
                      </div>
                      {result.tag && (
                        <div className="text-xs text-muted-foreground mt-1">
                          태그: {highlightText(result.tag, query)}
                        </div>
                      )}
                    </div>
                    {result.matchType === 'tag' && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        태그 매치
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* 검색어가 없을 때 최근 검색 기록 표시 */}
          {query.length < 2 && searchHistory.length > 0 && (
            <>
              <div className="px-4 py-2 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  최근 검색
                </div>
              </div>
              {searchHistory.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-muted transition-colors ${
                    index + results.length === selectedIndex ? 'bg-blue-950/20 border-l-4 border-blue-400' : ''
                  }`}
                  onClick={() => handleSelect({ id: item.id, name: item.gameName, matchType: 'name' as const })}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-card-foreground">
                        {item.gameName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {showDropdown && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 text-muted-foreground text-center">
            검색 결과가 없습니다
          </div>
        </div>
      )}
    </div>
  );
} 