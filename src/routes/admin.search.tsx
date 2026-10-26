import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { SearchResults } from "@/components/workbench/SearchResults";
import { searchQueryStore } from "@/store";

export const Route = createFileRoute("/admin/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "全局搜索结果 · 作物表型管理平台" }, { name: "description", content: "按材料、表型数据、图片、试验分组展示搜索结果" }] }),
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  useEffect(() => { if (q) searchQueryStore.set(q); }, [q]);
  return <SearchResults role="admin" q={q ?? ""} />;
}
