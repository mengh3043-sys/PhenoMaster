import { createFileRoute } from "@tanstack/react-router";
import { DataStatistics } from "@/components/workbench/DataStatistics";

export const Route = createFileRoute("/user/data_/statistics")({
  head: () => ({ meta: [
    { title: "表型数据可视化 — 作物表型管理平台" },
    { name: "description", content: "按目录与日期统计表型数据文件数量、AI 识别与待审核情况。" },
    { property: "og:title", content: "表型数据可视化 — 作物表型管理平台" },
    { property: "og:description", content: "表型数据文件数量统计与变化趋势。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DataStatistics,
});
