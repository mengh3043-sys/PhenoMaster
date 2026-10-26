import type { TreeNode, ReviewStatus } from "@/lib/mock";
import type { FileRow } from "./index";
import { createPersistedStore } from "./persist";

export const ALL_DATA_NODE = "all-data";
export const dataStatisticsNodesStore = createPersistedStore<string[]>("dataStatisticsNodes", []);

/** 演示：补充的目录（地区-年份 + 品种/群体）。 */
const demoLeaves: { parent: string; id: string; name: string; crop: string; variety: string; code: string; count: number }[] = [
  { parent: "d1", id: "d13", name: "河南-2024 郑麦001 群体", crop: "小麦", variety: "郑麦 001", code: "wheat_zm001_ha", count: 14 },
  { parent: "d1", id: "d14", name: "郑州-2024 济麦22 株高时序", crop: "小麦", variety: "济麦 22", code: "wheat_jm22_zz", count: 9 },
  { parent: "d2", id: "d23", name: "吉林-2024 CUBIC 自交系", crop: "玉米", variety: "CUBIC 自交系", code: "maize_cubic_jl", count: 16 },
  { parent: "d2", id: "d24", name: "重庆-2024 AMP 杂交系", crop: "玉米", variety: "AMP 杂交系", code: "maize_amp_cq", count: 11 },
  { parent: "d3", id: "d32", name: "江苏-2024 扬稻6号", crop: "水稻", variety: "扬稻 6 号", code: "rice_yd6_js", count: 12 },
  { parent: "d4", id: "d41", name: "北京-2024 中黄13 品比", crop: "大豆", variety: "中黄 13", code: "soybean_zh13_bj", count: 10 },
  { parent: "d5", id: "d51", name: "湖北-2024 中双11号 密度", crop: "油菜", variety: "中双 11 号", code: "rapeseed_zs11_hb", count: 7 },
];
const traits = [["ph", "株高 PH、茎粗"], ["spad", "叶绿素 SPAD 时序"], ["ndvi", "UAV 多光谱 NDVI"], ["lai", "叶面积指数 LAI"], ["tkw", "千粒重 TKW、穗长 SL"], ["yield", "小区产量与倒伏"]] as const;
const owners = ["曾老师", "张同学", "李同学", "王芳"];
const statuses: ReviewStatus[] = ["已审核", "待审核", "已审核", "用户私有", "草稿"];

export const demoDataFiles: FileRow[] = demoLeaves.flatMap((leaf, li) => Array.from({ length: leaf.count }, (_, i) => {
  const day = Math.round(((i + 0.5) / leaf.count) * 89 + ((li * 7 + i * 3) % 5) - 2);
  const d = new Date(Date.UTC(2024, 0, 11 + Math.max(0, Math.min(89, day))));
  const [t, desc] = traits[(i + li) % traits.length]!;
  const ai = (i + li) % 4 === 0;
  return {
    id: 60000 + li * 100 + i, name: `${leaf.code}_2024_${t}_t${String(i + 1).padStart(2, "0")}.csv`,
    desc: ai ? `AI 识别结果 · ${leaf.variety} · ${desc}` : `${leaf.variety} · ${desc}`,
    crop: leaf.crop, owner: owners[(i + li) % owners.length]!, size: `${(0.6 + ((i * 7 + li) % 40) / 10).toFixed(1)} MB`,
    rows: 240 + ((i * 131 + li * 57) % 1800), public: !ai, status: ai ? "用户私有" : statuses[(i + li) % statuses.length]!,
    date: d.toISOString().slice(0, 10), nodeId: leaf.id,
  };
}));
export const fileVariety = (f: FileRow) => { const d = f.desc.replace(/^AI 识别结果 · /, ""); return d.includes(" · ") ? d.split(" · ")[0]! : f.crop; };

export function migrateDemoDataTree(tree: TreeNode[]): TreeNode[] {
  const root = tree.find((n) => n.id === "d0");
  if (!root || demoLeaves.every((l) => JSON.stringify(tree).includes(`"${l.id}"`))) return tree;
  const children = [...(root.children ?? [])];
  for (const [id, name] of [["d4", "大豆文档"], ["d5", "油菜文档"]] as const) if (!children.some((c) => c.id === id)) children.push({ id, name, public: true, children: [] });
  const next = children.map((c) => {
    const add = demoLeaves.filter((l) => l.parent === c.id && !(c.children ?? []).some((x) => x.id === l.id));
    return add.length ? { ...c, children: [...(c.children ?? []), ...add.map((l) => ({ id: l.id, name: l.name, public: true }))] } : c;
  });
  return tree.map((n) => (n.id === "d0" ? { ...n, children: next } : n));
}
export function migrateDemoFiles(files: FileRow[]): FileRow[] {
  const ids = new Set(files.map((f) => f.id));
  const add = demoDataFiles.filter((f) => !ids.has(f.id));
  return add.length ? [...files, ...add] : files;
}

const publicSubtree = (n: TreeNode): string[] => (n.public ? [n.id, ...(n.children ?? []).flatMap(publicSubtree)] : []);
const find = (nodes: TreeNode[], id: string): TreeNode | undefined => {
  for (const n of nodes) { if (!n.public) continue; if (n.id === id) return n; const f = find(n.children ?? [], id); if (f) return f; }
  return undefined;
};
export function dataDirectoryScope(files: FileRow[], tree: TreeNode[], nodeId: string) {
  const node = nodeId === ALL_DATA_NODE ? undefined : find(tree, nodeId);
  const roots = node ? [node] : tree;
  const inIds = (ids: string[]) => files.filter((f) => ids.includes(f.nodeId));
  const all = inIds(roots.flatMap(publicSubtree));
  // 选根节点时下钻到第一层大类（如小麦文档、玉米文档），避免只出现一个「表型数据」柱子
  const base = node ?? (tree.length === 1 && tree[0]!.public ? tree[0] : undefined);
  const kids = (base ? base.children ?? [] : tree).filter((n) => n.public);
  const groups = kids.map((c) => ({ id: c.id, name: c.name, files: inIds(publicSubtree(c)) }));
  if (base) { const direct = inIds([base.id]); if (direct.length) groups.unshift({ id: base.id, name: base.name, files: direct }); }
  return { files: all, groups: groups.filter((g) => g.files.length > 0), name: node?.name ?? "全部表型数据" };
}
export function multiDataScope(files: FileRow[], tree: TreeNode[], ids: string[]) {
  if (ids.includes(ALL_DATA_NODE)) return dataDirectoryScope(files, tree, ALL_DATA_NODE);
  const contains = (n: TreeNode | undefined, id: string) => !!n && publicSubtree(n).slice(1).includes(id);
  const unique = [...new Set(ids)].filter((id, _, all) => find(tree, id) && !all.some((o) => o !== id && contains(find(tree, o), id)));
  if (!unique.length) return { files: [], groups: [], name: "未选择目录" };
  const scopes = unique.map((id) => dataDirectoryScope(files, tree, id));
  return { files: scopes.flatMap((s) => s.files), groups: scopes.flatMap((s) => s.groups), name: scopes.map((s) => s.name).join("、") };
}
