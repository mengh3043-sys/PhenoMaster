import { createFileRoute } from "@tanstack/react-router";
import { ImageStatisticsDetails, statisticsDetailsSearch } from "@/components/workbench/ImageStatisticsDetails";
export const Route = createFileRoute("/admin/images_/statistics_/details")({
  validateSearch: statisticsDetailsSearch,
  head: () => ({ meta: [
    { title: "管理员图片统计明细 — 作物表型管理平台" },
    { name: "description", content: "按所选目录和日期查看图片数量、品种与异常明细。" },
    { property: "og:title", content: "管理员图片统计明细 — 作物表型管理平台" },
    { property: "og:description", content: "图片目录数量与异常明细。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});
function Page() { return <ImageStatisticsDetails {...Route.useSearch()} role="admin" />; }
