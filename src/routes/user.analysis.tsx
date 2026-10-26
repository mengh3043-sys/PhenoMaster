import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AnalysisTools } from "@/components/workbench/AnalysisTools";

export const Route = createFileRoute("/user/analysis")({
  head: () => ({ meta: [
    { title: "分析工具 — 作物表型管理平台" },
    { name: "description", content: "比较作物材料的多性状表现、群体均值和试验数据，查看统计明细。" },
    { property: "og:title", content: "分析工具 — 作物表型管理平台" },
    { property: "og:description", content: "作物材料多性状对比与试验统计分析。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  validateSearch: z.object({ tab: z.string().optional(), mat: z.string().optional() }),
  component: Page,
});

function Page() {
  const { tab, mat } = Route.useSearch();
  return <AnalysisTools role="user" tab={tab} mat={mat ?? "ZM-001"} />;
}
