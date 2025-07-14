import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text = '불러오는 중...', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {/* 스피너 애니메이션 */}
      <div className="relative mb-4">
        <div className={`${sizeClasses[size]} border-2 border-muted rounded-full animate-spin`}>
          <div className="absolute inset-0 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      
      {/* 로딩 텍스트 */}
      <div className="text-muted-foreground text-sm font-medium">
        {text}
      </div>
      
      {/* 점 애니메이션 */}
      <div className="flex space-x-1 mt-2">
        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

// 게임 카드용 스켈레톤 로딩
export function GameCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 mb-4 animate-fade-in">
      <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded mb-2 animate-skeleton bg-[length:200px_100%]"></div>
      <div className="flex justify-between mb-1">
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-16 animate-skeleton bg-[length:200px_100%]"></div>
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-16 animate-skeleton bg-[length:200px_100%]"></div>
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-16 animate-skeleton bg-[length:200px_100%]"></div>
      </div>
      <div className="mt-2 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md py-2 h-12 animate-skeleton bg-[length:200px_100%]"></div>
    </div>
  );
}

// 가격 카드용 스켈레톤 로딩
export function PriceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 mb-4 animate-fade-in">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-20 animate-skeleton bg-[length:200px_100%]"></div>
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-20 animate-skeleton bg-[length:200px_100%]"></div>
        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-20 animate-skeleton bg-[length:200px_100%]"></div>
      </div>
      <div className="mt-2 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md py-2 h-16 animate-skeleton bg-[length:200px_100%]"></div>
      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-32 mt-1 ml-auto animate-skeleton bg-[length:200px_100%]"></div>
    </div>
  );
}

// 매물 목록용 스켈레톤 로딩
export function ItemListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="py-3 flex justify-between items-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded mb-1 animate-skeleton bg-[length:200px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-20 animate-skeleton bg-[length:200px_100%]"></div>
          </div>
          <div className="flex flex-col items-end ml-2">
            <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-16 mb-1 animate-skeleton bg-[length:200px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-12 animate-skeleton bg-[length:200px_100%]"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 