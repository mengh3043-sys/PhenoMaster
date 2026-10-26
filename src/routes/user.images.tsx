import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ImageManager } from "@/components/workbench/ImageManager";

export const Route = createFileRoute("/user/images")({
  head: () => ({ meta: [
    { title: "表型图片 — 作物表型管理平台" },
    { name: "description", content: "按作物、群体和地区年份管理表型图片，预览并导出采集记录。" },
    { property: "og:title", content: "表型图片 — 作物表型管理平台" },
    { property: "og:description", content: "作物表型图片目录与采集记录管理。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: z.object({ node: z.string().optional(), issue: z.string().optional(), img: z.coerce.number().optional() }),
  component: Page,
});

function Page() {
  const s = Route.useSearch();
  return <ImageManager key={`${s.node}-${s.issue}-${s.img}`} role="user" node={s.node} issue={s.issue} img={s.img} />;
}
