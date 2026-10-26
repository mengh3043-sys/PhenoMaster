import { imageDate, isAbnormalImage, visibleImages, type Img } from "./imageData";
import type { TreeNode } from "@/lib/mock";
import { createPersistedStore } from "./persist";

export const ALL_IMAGES_NODE = "all-images";
export const statisticsNodesStore = createPersistedStore<string[]>("imageStatisticsNodes", []);
export function multiDirectoryStatisticsScope(byNode: Record<string, Img[]>, tree: TreeNode[], nodeIds: string[]) {
  if (nodeIds.includes(ALL_IMAGES_NODE)) return directoryStatisticsScope(byNode, tree, ALL_IMAGES_NODE);
  if (nodeIds.length === 0) return { images: [], groups: [], name: "未选择目录" };
  const contains = (nodes: TreeNode[], id: string): boolean => nodes.some((n) => n.public && (n.id === id || contains(n.children ?? [], id)));
  const locate = (nodes: TreeNode[], id: string): TreeNode | undefined => {
    for (const n of nodes) { if (!n.public) continue; if (n.id === id) return n; const found = locate(n.children ?? [], id); if (found) return found; }
    return undefined;
  };
  const unique = [...new Set(nodeIds)].filter((id, _, ids) => locate(tree, id) && !ids.some((other) => other !== id && contains(locate(tree, other)?.children ?? [], id)));
  const scopes = unique.map((id) => directoryStatisticsScope(byNode, tree, id));
  return { images: scopes.flatMap((s) => s.images), groups: scopes.flatMap((s) => s.groups), name: scopes.map((s) => s.name).join("、") };
}
export function directoryStatisticsScope(byNode: Record<string, Img[]>, tree: TreeNode[], nodeId: string) {
  const find = (nodes: TreeNode[]): TreeNode | undefined => {
    for (const node of nodes) {
      if (!node.public) continue;
      if (node.id === nodeId) return node;
      const found = find(node.children ?? []);
      if (found) return found;
    }
    return undefined;
  };
  const node = find(tree);
  const roots = node ? [node] : tree;
  const images = visibleImages(byNode, roots);
  const children = (node ? node.children ?? [] : tree).filter((n) => n.public);
  const groups = children.map((child) => ({ id: child.id, name: child.name, images: visibleImages(byNode, [child]) }));
  // Files stored on the selected parent are counted once, without inventing a folder.
  if (node) {
    const directImages = visibleImages(byNode, [{ ...node, children: [] }]);
    if (directImages.length > 0) groups.unshift({ id: node.id, name: node.name, images: directImages });
  }
  return { images, groups: groups.filter((group) => group.images.length > 0), name: node?.name ?? "全部图片" };
}
export function directoryStatisticsRecords(groups: ReturnType<typeof directoryStatisticsScope>["groups"], from: string, to: string) {
  return groups.flatMap((group) => statisticsRecords(group.images.map((im) => ({ ...im, variety: group.id })), from, to).map((r) => ({ ...r, varietyName: group.name })));
}

export const STATISTICS_DEFAULT_RANGE = { from: "2024-01-11", to: "2024-04-10" };
export function getStatisticsVarieties(images: Img[]) {
  const tones = ["bg-chart-3", "bg-chart-1", "bg-chart-4", "bg-chart-2", "bg-chart-5"];
  const colors = [3, 1, 4, 2, 5];
  return [...new Set(images.map((im) => im.variety ?? "未分类"))].map((name, i) => ({ id: name, name, label: name, project: images.find((im) => im.variety === name)?.project ?? "未关联项目", color: `var(--chart-${colors[i % 5]})`, tone: tones[i % 5] ?? "bg-chart-3" }));
}
export type StatisticsRecord = { date: string; varietyId: string; varietyName: string; count: number; abnormal: number };
export function statisticsRecords(images: Img[], from: string, to: string): StatisticsRecord[] {
  const grouped = new Map<string, StatisticsRecord>();
  const varieties = getStatisticsVarieties(images);
  const start = Date.parse(from), end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return [];
  for (let time = start; time <= end; time += 86400000) {
    const date = new Date(time).toISOString().slice(0, 10);
    varieties.forEach((v) => grouped.set(`${date}:${v.id}`, { date, varietyId: v.id, varietyName: v.name, count: 0, abnormal: 0 }));
  }
  images.forEach((im) => {
    const row = grouped.get(`${imageDate(im)}:${im.variety ?? "未分类"}`);
    if (row) { row.count++; if (isAbnormalImage(im)) row.abnormal++; }
  });
  return [...grouped.values()];
}
export function summarizeStatistics(records: StatisticsRecord[], from: string, to: string) {
  const filtered = records.filter((r) => r.date >= from && r.date <= to);
  const total = filtered.reduce((sum, r) => sum + r.count, 0);
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1);
  return { records: filtered, total, varieties: new Set(filtered.filter((r) => r.count > 0).map((r) => r.varietyId)).size, average: total / days, abnormal: filtered.reduce((sum, r) => sum + r.abnormal, 0) };
}