import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { multiDirectoryStatisticsScope, directoryStatisticsRecords, STATISTICS_DEFAULT_RANGE } from "@/store/imageStatistics";
import { imagesStore, imageTreeStore } from "@/store";

const titles = { total: "总图片数明细", varieties: "涉及品种明细", daily: "每日新增明细", abnormal: "异常图片明细" };
export type StatisticsSearch = { node: string; kind: keyof typeof titles; from: string; to: string };
export function statisticsDetailsSearch(search: Record<string, unknown>): StatisticsSearch {
  return { node: typeof search["node"] === "string" ? search["node"] : "all-images", kind: typeof search["kind"] === "string" && search["kind"] in titles ? search["kind"] as keyof typeof titles : "total", from: typeof search["from"] === "string" ? search["from"] : STATISTICS_DEFAULT_RANGE.from, to: typeof search["to"] === "string" ? search["to"] : STATISTICS_DEFAULT_RANGE.to };
}
export function ImageStatisticsDetails({ kind, from, to, node, role = "user" }: StatisticsSearch & { role?: "user" | "admin" }) {
  const [byNode] = imagesStore.useStore();
  const [tree] = imageTreeStore.useStore();
  const scope = multiDirectoryStatisticsScope(byNode, tree, node.split("|").filter(Boolean));
  const records = directoryStatisticsRecords(scope.groups, from, to);
  const grouped = new Map<string, { name: string; project: string; count: number }>();
  for (const record of records) {
    const count = kind === "abnormal" ? record.abnormal : record.count;
    if (kind !== "daily" && count === 0) continue;
    const key = kind === "daily" ? record.date : kind === "varieties" ? record.varietyId : `${record.date}:${record.varietyId}`;
    const row = grouped.get(key) ?? {
      name: kind === "daily" ? record.date : record.varietyName,
      project: kind === "daily" ? "全部品种" : kind === "varieties" ? scope.name : `${record.date} · ${scope.name}`,
      count: 0,
    };
    row.count += count;
    grouped.set(key, row);
  }
  const rows = [...grouped.values()];
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{titles[kind]}</h1><p className="mt-2 text-sm text-muted-foreground">{from} 至 {to} · 演示数据</p></div>
      <Button asChild variant="outline"><Link to={role === "admin" ? "/admin/images/statistics" : "/user/images/statistics"}>返回表型图片可视化</Link></Button>
    </div>
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b bg-muted"><tr><th className="p-4">{kind === "daily" ? "日期" : "目录名称"}</th><th className="p-4">{kind === "daily" ? "统计范围" : "日期 / 所属目录"}</th><th className="p-4 text-right">{kind === "abnormal" ? "异常图片数" : "图片数量"}</th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0 hover:bg-muted/40"><td className="p-4">{row.name}</td><td className="p-4 text-muted-foreground">{row.project}</td><td className="p-4 text-right tabular-nums">{row.count} 张</td></tr>)}{rows.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">暂无数据</td></tr>}</tbody>
      </table>
      <p className="border-t p-4 text-sm text-muted-foreground">共 {rows.length} 条 · 合计 {rows.reduce((sum, row) => sum + row.count, 0)} 张</p>
    </div>
  </div>;
}