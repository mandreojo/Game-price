'use client';

import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface SearchHistoryProps {
  onSelect: (gameName: string) => void;
  className?: string;
}

export default function SearchHistory({ onSelect, className = '' }: SearchHistoryProps) {
  const { searchHistory, removeFromHistory, clearHistory, formatRelativeTime } = useSearchHistory();

  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">최근 검색</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          전체 삭제
        </Button>
      </div>

      {/* 검색 히스토리 목록 */}
      <div className="space-y-2">
        {searchHistory.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <button
              onClick={() => onSelect(item.gameName)}
              className="flex-1 text-left text-sm text-card-foreground hover:text-blue-400 transition-colors truncate"
            >
              {item.gameName}
            </button>
            
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(item.timestamp)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromHistory(item.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 