import { createFileRoute } from "@tanstack/react-router";
import { ImageStatistics } from "@/components/workbench/ImageStatistics";

export const Route = createFileRoute("/user/images_/statistics")({
  head: () => ({
    meta: [
      { title: "表型图片可视化 — 作物表型管理平台" },
      { name: "description", content: "按日期范围统计各作物表型图片数量与变化趋势。" },
      { property: "og:title", content: "表型图片可视化 — 作物表型管理平台" },
      { property: "og:description", content: "表型图片数量统计与变化趋势可视化。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImageStatistics,
});
