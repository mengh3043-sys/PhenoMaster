import { createFileRoute } from "@tanstack/react-router";
import { ImageStatistics } from "@/components/workbench/ImageStatistics";

export const Route = createFileRoute("/admin/images_/statistics")({
  head: () => ({ meta: [
    { title: "管理员表型图片可视化 — 作物表型管理平台" },
    { name: "description", content: "按图片目录和日期查看图片数量、品种与异常图片趋势。" },
    { property: "og:title", content: "管理员表型图片可视化 — 作物表型管理平台" },
    { property: "og:description", content: "图片目录数量统计与变化趋势。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <ImageStatistics role="admin" />,
});