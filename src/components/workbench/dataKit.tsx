import type { TreeNode } from "@/lib/mock";
import type { FileRow } from "@/store";

/** 旧节点名 → 补全「地区-年份」后的新名（兼容本地已保存的目录树）。 */
export const NodeRename: Record<string, string> = {
  "2024试验": "郑州-2024 小麦试验",
  "2025 新乡干旱胁迫": "新乡-2025 干旱胁迫",
  "2024 自交系群体": "北京-2024 自交系群体",
  "2025 密植试验": "北京-2025 密植试验",
  "2025 褐飞虱抗性": "武汉-2025 褐飞虱抗性",
};
export function migrateNames(tree: TreeNode[]): { tree: TreeNode[]; changed: boolean } {
  let changed = false;
  const walk = (ns: TreeNode[]): TreeNode[] => ns.map((n) => {
    const name = NodeRename[n.name];
    if (name) changed = true;
    return { ...n, name: name ?? n.name, children: n.children && walk(n.children) };
  });
  const t = walk(tree);
  return { tree: t, changed };
}

export const isAiFile = (f: FileRow) => f.desc.startsWith("AI 识别结果");

/** 从文件所属节点（含祖先）名称中解析地区、年份。 */
export function fileMeta(f: FileRow, path: string[]): { year: string; region: string } {
  let year = "", region = "";
  for (const name of [...path].reverse()) {
    const m = name.match(/^(\S+?)-(\d{4})/);
    if (m) { region ||= m[1]!; year ||= m[2]!; }
  }
  return { year: year || f.date.slice(0, 4), region: region || "未标注" };
}

export type Version = { v: string; date: string; author: string; note: string; rows: number };
export function mockVersions(f: FileRow): Version[] {
  return [
    { v: "v3", date: f.date, author: f.owner, note: "修正 5 个性状值，新增 2 行", rows: f.rows },
    { v: "v2", date: "2026-09-10", author: f.owner, note: "补充 CW、ATI 性状", rows: Math.max(f.rows - 2, 0) },
    { v: "v1", date: "2026-08-22", author: f.owner, note: "初次上传", rows: Math.max(f.rows - 34, 0) },
  ];
}

export const traitCols = ["材料", "重复", "小区", "株高PH(cm)", "穗长SL(cm)", "千粒重TKW(g)", "ATI", "CW(cm)", "LAI", "SPAD", "NDVI", "分蘖数", "单株产量(g)", "抽穗期(d)", "成熟期(d)"];
export const traitRows: (string | number)[][] = Array.from({ length: 40 }, (_, i) => {
  const r = (a: number, b: number) => +(a + ((i * 37 + b * 13) % 100) / 100 * b).toFixed(2);
  return [`ZM-${String(i + 1).padStart(3, "0")}`, (i % 3) + 1, `${"ABC"[i % 3]}${String(i + 1).padStart(2, "0")}`, r(72, 15), r(7.5, 3), r(38, 9), r(0.6, 0.35), r(12, 6), r(3, 2.5), r(38, 12), r(0.55, 0.3), Math.round(r(4, 6)), r(18, 12), Math.round(r(108, 12)), Math.round(r(148, 14))];
});

/** 版本对比：返回 [行, 类型]，类型 added=新增行，modified 时附修改的列索引。 */
export function diffRows(): { row: (string | number)[]; kind: "same" | "added" | "modified"; cells: number[] }[] {
  return traitRows.slice(0, 8).map((row, i) => {
    if (i === 6 || i === 7) return { row: [...row.slice(0, 3), ...row.slice(3, 8)], kind: "added" as const, cells: [] };
    const r = row.slice(0, 8);
    if (i === 1) return { row: [...r.slice(0, 3), +(Number(r[3]) + 2.1).toFixed(2), ...r.slice(4)], kind: "modified" as const, cells: [3] };
    if (i === 4) return { row: [...r.slice(0, 5), +(Number(r[5]) - 1.4).toFixed(2), +(Number(r[6]) + 0.05).toFixed(2), r[7]!], kind: "modified" as const, cells: [5, 6] };
    return { row: r, kind: "same" as const, cells: [] };
  });
}
