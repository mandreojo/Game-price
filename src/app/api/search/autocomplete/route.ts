import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return Response.json({ results: [] });
    }

    if (!adminDb) {
      return Response.json({ error: "데이터베이스 연결 실패" }, { status: 500 });
    }

    const searchTerm = query.trim().toLowerCase();
    
    // gamelist 컬렉션에서 검색
    const gamesSnapshot = await adminDb.collection('gamelist').get();
    const results: Array<{id: string, name: string, tag?: string, matchType: 'name' | 'tag'}> = [];
    
    gamesSnapshot.forEach((doc) => {
      const data = doc.data();
      const name = data.name || '';
      const tag = data.tag || '';
      
      // 이름에서 검색
      if (name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: doc.id,
          name: name,
          tag: tag,
          matchType: 'name'
        });
      }
      // 태그에서 검색 (이름과 중복되지 않는 경우만)
      else if (tag.toLowerCase().includes(searchTerm)) {
        results.push({
          id: doc.id,
          name: name,
          tag: tag,
          matchType: 'tag'
        });
      }
    });

    // 정확도 순으로 정렬 (이름 매치가 우선, 길이 순)
    results.sort((a, b) => {
      // 이름 매치가 태그 매치보다 우선
      if (a.matchType !== b.matchType) {
        return a.matchType === 'name' ? -1 : 1;
      }
      
      // 같은 타입 내에서는 길이 순 (짧은 것이 더 정확할 가능성)
      return a.name.length - b.name.length;
    });

    // 최대 10개까지만 반환
    const limitedResults = results.slice(0, 10);

    return Response.json({ 
      results: limitedResults,
      total: results.length
    });

  } catch (error) {
    console.error("자동완성 검색 에러:", error);
    return Response.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 });
  }
} 