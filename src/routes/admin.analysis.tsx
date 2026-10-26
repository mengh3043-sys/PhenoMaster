import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";
import { AnalysisTools } from "@/components/workbench/AnalysisTools";
import { Panel } from "@/components/workbench/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analysis")({
  head: () => ({ meta: [
    { title: "表型分析管理 — 作物表型管理平台" },
    { name: "description", content: "管理作物表型统计分析，比较材料性状并定位异常试验数据。" },
    { property: "og:title", content: "表型分析管理 — 作物表型管理平台" },
    { property: "og:description", content: "材料性状对比、统计明细和异常数据定位。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  validateSearch: z.object({ tab: z.string().optional(), mat: z.string().optional(), file: z.string().optional() }),
  component: Page,
});

const ndviRows = [
  { plot: "D01", date: "2025-07-02", ndvi: 0.62 }, { plot: "D02", date: "2025-07-02", ndvi: 0.68 },
  { plot: "D03", date: "2025-07-02", ndvi: 1.24 }, { plot: "D04", date: "2025-07-09", ndvi: 0.71 },
  { plot: "D05", date: "2025-07-09", ndvi: 1.08 }, { plot: "D06", date: "2025-07-16", ndvi: 0.77 },
  { plot: "D07", date: "2025-07-16", ndvi: 0.81 }, { plot: "D08", date: "2025-07-23", ndvi: 1.36 },
];

function Page() {
  const { tab, mat, file } = Route.useSearch();
  return (
    <div className="space-y-5">
      {file && (
        <Panel title={`异常值定位：${file}`}>
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-destructive" />NDVI 理论取值范围为 -1 ~ 1，红色行为超出范围的异常值（{ndviRows.filter((r) => r.ndvi > 1).length} 条）。</p>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-2.5 text-left font-medium">行号</th><th className="p-2.5 text-left font-medium">小区</th><th className="p-2.5 text-left font-medium">采集日期</th><th className="p-2.5 text-left font-medium">NDVI</th></tr></thead>
            <tbody>{ndviRows.map((r, i) => (
              <tr key={r.plot} className={cn("border-t", r.ndvi > 1 && "bg-destructive/10 text-destructive font-medium")}>
                <td className="p-2.5 font-display">{i + 2}</td><td className="p-2.5">{r.plot}</td><td className="p-2.5 font-display">{r.date}</td><td className="p-2.5 font-display">{r.ndvi}{r.ndvi > 1 && " ⚠ 异常"}</td>
              </tr>))}</tbody>
          </table></div>
        </Panel>
      )}
      <AnalysisTools role="admin" title="表型分析" tab={tab} mat={mat ?? "ZM-001"} />
    </div>
  );
}
