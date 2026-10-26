import type { TreeNode } from "@/lib/mock";

export type Img = { id: number; src: string; label: string; name?: string; date?: string; demoDateVersion?: number; uploader?: string; batch?: string; size?: string; fileSize?: number; res?: string; variety?: string; site?: string; project?: string };
export const mockVarieties = [
  { id: "demo-maize-cubic-beijing", crop: "玉米", group: "CUBIC自交系", name: "玉米 CUBIC自交系 北京-2014", site: "北京", project: "CUBIC自交系多地点表型采集", count: 17, src: "pool:4" },
  { id: "demo-maize-cubic-hebei", crop: "玉米", group: "CUBIC自交系", name: "玉米 CUBIC自交系 河北-2014", site: "河北", project: "CUBIC自交系多地点表型采集", count: 12, src: "pool:4" },
  { id: "demo-maize-cubic-henan", crop: "玉米", group: "CUBIC自交系", name: "玉米 CUBIC自交系 河南-2014", site: "河南", project: "CUBIC自交系多地点表型采集", count: 18, src: "pool:4" },
  { id: "demo-maize-cubic-jilin", crop: "玉米", group: "CUBIC自交系", name: "玉米 CUBIC自交系 吉林-2014", site: "吉林", project: "CUBIC自交系多地点表型采集", count: 18, src: "pool:4" },
  { id: "demo-maize-cubic-liaoning", crop: "玉米", group: "CUBIC自交系", name: "玉米 CUBIC自交系 辽宁-2014", site: "辽宁", project: "CUBIC自交系多地点表型采集", count: 12, src: "pool:4" },
  { id: "demo-maize-hybrid-liaoning", crop: "玉米", group: "CUBIC杂交系", name: "玉米 CUBIC杂交系 辽宁-2014", site: "辽宁", project: "玉米杂交群体鉴定", count: 14, src: "pool:4" },
  { id: "demo-maize-amp-chongqing", crop: "玉米", group: "AMP杂交系", name: "玉米 AMP杂交系 重庆-2011", site: "重庆", project: "AMP群体多环境鉴定", count: 15, src: "pool:4" },
  { id: "demo-maize-amp-sichuan", crop: "玉米", group: "AMP杂交系", name: "玉米 AMP杂交系 四川-2011", site: "四川", project: "AMP群体多环境鉴定", count: 12, src: "pool:4" },
  { id: "demo-rice-jiangsu", crop: "水稻", group: "扬稻6号", name: "水稻 扬稻6号 江苏-2014", site: "江苏", project: "水稻苗期表型采集", count: 12, src: "pool:2" },
  { id: "demo-wheat-henan", crop: "小麦", group: "郑麦001", name: "小麦 郑麦001 河南-2014", site: "河南", project: "小麦苗期高通量成像", count: 20, src: "pool:0" },
  { id: "demo-soybean-beijing", crop: "大豆", group: "中黄13", name: "大豆 中黄13 北京-2014", site: "北京", project: "大豆种质资源表型采集", count: 15, src: "pool:5" },
  { id: "demo-rapeseed-hubei", crop: "油菜", group: "中双11号", name: "油菜 中双11号 湖北-2014", site: "湖北", project: "油菜苗期生长监测", count: 1, src: "pool:6" },
];
export const DEMO_DEFAULT_NODE = "demo-maize-cubic-beijing";
const demoDate = (i: number, n: number, count: number) => new Date(Date.UTC(2024, 0, 11 + ((Math.floor(n * 90 / count) + i * 7 + (n * 13 + i * 3) % 5) % 91))).toISOString().slice(0, 10);
export const mockImageTree: TreeNode[] = [{ id: "demo-images", name: "表型图片", public: true, children:
  [...new Set(mockVarieties.map((v) => v.crop))].map((crop) => ({ id: `demo-crop-${crop}`, name: crop, public: true, children:
    [...new Set(mockVarieties.filter((v) => v.crop === crop).map((v) => v.group))].map((group) => ({ id: `demo-group-${crop}-${group}`, name: group, public: true, children:
      mockVarieties.filter((v) => v.crop === crop && v.group === group).map((v) => ({ id: v.id, name: `${v.site}-${v.name.endsWith("2011") ? "2011" : "2014"}`, public: true }))
    }))
  }))
}];
export const mockImageData: Img[] = mockVarieties.flatMap((v, i) => Array.from({ length: v.count }, (_, n) => ({
  id: 40000 + i * 100 + n, src: v.src, name: `${v.name}_${String(n + 1).padStart(3, "0")}.jpg`,
  date: demoDate(i, n, v.count), demoDateVersion: 2,
  label: n === 9 ? "倒伏" : "健康", uploader: ["曾老师", "张同学", "李同学"][i % 3] ?? "曾老师", batch: `B2024-${String(i + 1).padStart(2, "0")}`, size: `${(1.8 + ((i * 7 + n * 3) % 13) * 0.1).toFixed(1)} MB`, fileSize: +(1.8 + ((i * 7 + n * 3) % 13) * 0.1).toFixed(1), res: "4000×3000",
  variety: v.name, site: v.site, project: v.project,
})));
export const mockImagesByNode: Record<string, Img[]> = Object.fromEntries(mockVarieties.map((v) => [v.id, mockImageData.filter((im) => im.variety === v.name)]));
/** Replace only the old demo rows once; uploaded images and user folders remain untouched. */
export function migrateDemoImages(saved: Record<string, Img[]>) {
  if (mockVarieties.some((v) => Object.hasOwn(saved, v.id))) {
    let changed = false;
    const updated = Object.fromEntries(Object.entries(saved).map(([id, images]) => [id, images.map((im) => {
      const seed = mockImageData.find((s) => s.id === im.id && s.src === im.src && s.name === im.name);
      if (!seed || im.demoDateVersion === 2) return im;
      changed = true;
      return { ...im, date: seed.date ?? "2024-01-11", demoDateVersion: 2 };
    })]));
    return changed ? updated : saved;
  }
  const kept = Object.fromEntries(Object.entries(saved).map(([id, images]) => [id, images.filter((im) => !(im.id >= 3000 && im.id < 3100 && im.src.startsWith("pool:") && im.name?.endsWith(".jpg")))]));
  return { ...kept, ...mockImagesByNode };
}
export function migrateDemoTree(saved: TreeNode[]) {
  return saved.some((node) => node.id === "demo-images") ? saved : [...mockImageTree, ...saved];
}
export const imageDate = (im: Img) => im.date ?? `2024-${String((im.id % 9) + 3).padStart(2, "0")}-${String((im.id % 27) + 1).padStart(2, "0")}`;
export const isAbnormalImage = (im: Img) => ["倒伏", "病害", "叶色异常", "模糊", "过曝"].includes(im.label);
export function visibleImages(byNode: Record<string, Img[]>, tree: TreeNode[], includePrivate = false) {
  const result: (Img & { nodeId: string })[] = [];
  const walk = (nodes: TreeNode[]) => nodes.forEach((node) => {
    if (!includePrivate && !node.public) return;
    result.push(...(byNode[node.id] ?? []).map((im) => ({ ...im, nodeId: node.id, variety: im.variety ?? node.name, project: im.project ?? node.name })));
    if (node.children) walk(node.children);
  });
  walk(tree);
  return result;
}