import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DataManager } from "@/components/workbench/DataManager";

export const Route = createFileRoute("/user/data")({
  head: () => ({ meta: [
    { title: "表型数据 — 作物表型管理平台" },
    { name: "description", content: "按物种、群体、年份与地区浏览表型数据文件，查看审核状态、数据详情和历史版本。" },
    { property: "og:title", content: "表型数据 — 作物表型管理平台" },
    { property: "og:description", content: "集中浏览和筛选表型数据文件、群体信息与审核状态。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  validateSearch: z.object({ node: z.string().optional(), file: z.coerce.number().optional(), action: z.string().optional() }),
  component: Page,
});

function Page() {
  const s = Route.useSearch();
  return <DataManager key={`${s.node}-${s.file}-${s.action}`} role="user" focus={s} />;
}
