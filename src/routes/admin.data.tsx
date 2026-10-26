import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DataManager } from "@/components/workbench/DataManager";

export const Route = createFileRoute("/admin/data")({
  head: () => ({ meta: [
    { title: "表型文件管理 — 作物表型管理平台" },
    { name: "description", content: "管理表型文件、公开状态、审核记录、合并文件及来源历史。" },
    { property: "og:title", content: "表型文件管理 — 作物表型管理平台" },
    { property: "og:description", content: "集中管理表型文件及其来源和历史版本。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  validateSearch: z.object({ node: z.string().optional(), file: z.coerce.number().optional(), action: z.string().optional() }),
  component: Page,
});

function Page() {
  const s = Route.useSearch();
  return <DataManager key={`${s.node}-${s.file}-${s.action}`} role="admin" focus={s} />;
}
