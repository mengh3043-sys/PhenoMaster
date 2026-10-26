import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ImageManager } from "@/components/workbench/ImageManager";

export const Route = createFileRoute("/admin/images")({
  head: () => ({ meta: [
    { title: "管理员表型图片 — 作物表型管理平台" },
    { name: "description", content: "按树状目录搜索、分页浏览和管理表型图片及公开状态。" },
    { property: "og:title", content: "管理员表型图片 — 作物表型管理平台" },
    { property: "og:description", content: "表型图片目录、搜索与管理。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: z.object({ node: z.string().optional(), issue: z.string().optional(), img: z.coerce.number().optional() }),
  component: Page,
});

function Page() {
  const s = Route.useSearch();
  return <ImageManager key={`${s.node}-${s.issue}-${s.img}`} role="admin" node={s.node} issue={s.issue} img={s.img} />;
}
