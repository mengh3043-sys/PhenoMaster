import { createFileRoute } from "@tanstack/react-router";
import { DataStatistics } from "@/components/workbench/DataStatistics";

export const Route = createFileRoute("/admin/data_/statistics")({
  head: () => ({ meta: [
    { title: "管理员表型数据可视化 — 作物表型管理平台" },
    { name: "description", content: "按目录和日期查看表型文件数量、待审核情况与变化趋势。" },
    { property: "og:title", content: "管理员表型数据可视化 — 作物表型管理平台" },
    { property: "og:description", content: "表型文件目录统计与审核情况可视化。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <DataStatistics role="admin" />,
});