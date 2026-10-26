import type { FileRow } from "./index";

export type MergeStrategy = "material" | "plot";
export const mergeStrategyLabel = (strategy: MergeStrategy) => strategy === "plot" ? "按小区编号合并" : "按材料名称合并";

/** Creates a simulated output and immutable source provenance; no source records are edited. */
export function createMergedFile(sources: FileRow[], strategy: MergeStrategy, options: { id: number; nodeId: string; owner: string; date: string }): FileRow {
  if (new Set(sources.map((file) => file.id)).size < 2) throw new Error("请至少选择两个文件");
  const first = sources[0];
  if (!first) throw new Error("请选择来源文件");
  const stem = first.name.replace(/\.csv$/i, "").replace(/[\\/]/g, "_");
  return {
    ...options,
    name: `Merged_${options.date.replace(/-/g, "")}_${stem}.csv`,
    desc: `模拟横向合并 · ${mergeStrategyLabel(strategy)} · ${sources.length} 个来源文件`,
    crop: [...new Set(sources.map((file) => file.crop).filter(Boolean))].join("、"),
    size: `${sources.reduce((sum, file) => sum + (parseFloat(file.size) || 0), 0).toFixed(1)} MB`,
    rows: Math.max(...sources.map((file) => file.rows)),
    public: false,
    status: "待审核",
    merge: { strategy, sources: sources.map(({ id, name, nodeId, date, owner, rows }) => ({ id, name, nodeId, date, owner, rows })) },
  };
}