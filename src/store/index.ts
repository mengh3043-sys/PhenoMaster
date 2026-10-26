import { createPersistedStore } from "./persist";
import { dataTree, imageTree, phenotypeFiles, type TreeNode } from "@/lib/mock";
import { migrateDemoDataTree, migrateDemoFiles, demoDataFiles } from "./dataStatistics";
import { mockImagesByNode, mockImageTree, migrateDemoImages, migrateDemoTree, type Img } from "./imageData";
export type { Img } from "./imageData";

export type FileRow = (typeof phenotypeFiles)[number] & { nodeId: string; merge?: { strategy: "material" | "plot"; sources: { id: number; name: string; nodeId: string; date: string; owner: string; rows: number }[] } };
export type NodeMeta = { device: string; time: string; method: string; keywords: string };
export type Profile = { nick: string; phone: string; email: string; group: string };

const cropNode: Record<string, string> = { 小麦: "d11", 玉米: "d21", 水稻: "d31" };

export const dataTreeStore = createPersistedStore<TreeNode[]>("dataTree", migrateDemoDataTree(dataTree), migrateDemoDataTree);
export const filesStore = createPersistedStore<FileRow[]>("files", phenotypeFiles.map((f) => ({ ...f, nodeId: cropNode[f.crop] ?? "d0" })).concat(demoDataFiles), migrateDemoFiles);
export const imageTreeStore = createPersistedStore<TreeNode[]>("imageTree", [...mockImageTree, ...imageTree], migrateDemoTree);
export const imagesStore = createPersistedStore<Record<string, Img[]>>("images", mockImagesByNode, migrateDemoImages);
export const nodeMetaStore = createPersistedStore<Record<string, NodeMeta>>("nodeMeta", {});
/** 当前登录身份（前端模拟）：登录时写入，退出时清空。 */
export const sessionStore = createPersistedStore<{ role: "user" | "admin" } | null>("session", null);
/** 分析工具「全局搜索」最近一次的关键词，返回搜索页时恢复。 */
export const searchQueryStore = createPersistedStore<string>("searchQuery", "");

export const profileStore = createPersistedStore<Record<"user" | "admin", Profile>>("profile", {
  user: { nick: "曾老师", phone: "13900002231", email: "zeng@lab.cn", group: "小麦育种课题组" },
  admin: { nick: "超级管理员", phone: "13800000001", email: "admin@lab.cn", group: "平台研发组" },
});

/** Read a local image file as a data URL so it survives page reloads. */
export function fileToDataUrl(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Registry for list pages (system management, metadata, etc.) keyed by name.
const registry = new Map<string, ReturnType<typeof createPersistedStore<unknown>>>();
export function getListStore<T>(key: string, initial: T) {
  if (!registry.has(key)) registry.set(key, createPersistedStore<unknown>(`list:${key}`, initial));
  return registry.get(key)! as unknown as ReturnType<typeof createPersistedStore<T>>;
}

export type OpLog = { id: number; desc: string; time: string; status: "成功" | "失败" };
const seedLogs: OpLog[] = [
  { id: 1, desc: "登录系统", time: "2026-09-28 08:55", status: "成功" },
];
/** 操作记录（按角色区分），最新的在最前。 */
export const opLogStore = createPersistedStore<Record<"user" | "admin", OpLog[]>>("opLogs", { user: seedLogs, admin: seedLogs });
const pad = (n: number) => String(n).padStart(2, "0");
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
export function logAction(desc: string, status: OpLog["status"] = "成功", role?: "user" | "admin") {
  const r = role ?? sessionStore.get()?.role ?? "user";
  opLogStore.set((all) => ({ ...all, [r]: [{ id: Date.now() + Math.random(), desc, time: now(), status }, ...(all[r] ?? [])].slice(0, 200) }));
  if (status === "成功") pushNotice(desc, r);
}

/* ---------- 消息通知（按角色区分，最新在前）---------- */
export type Notice = { id: number; desc: string; time: string; to: string; read: boolean };
export const noticeStore = createPersistedStore<Record<"user" | "admin", Notice[]>>("notices", {
  user: [{ id: 1, desc: "wheat_zz_2024_plant_height.csv 已通过审核", time: "2026-09-28 10:12:00", to: "/user/data", read: false }],
  admin: [{ id: 1, desc: "李明 提交了 rice_bph_2025.csv 待审核", time: "2026-10-03 09:00:00", to: "/admin/review", read: false }],
});
function noticeTarget(desc: string, r: "user" | "admin") {
  const base = `/${r}`;
  if (/资料/.test(desc)) return `${base}/profile`;
  if (/图片/.test(desc)) return `${base}/images`;
  if (/文件|节点/.test(desc)) return `${base}/data`;
  if (/试验/.test(desc)) return `${base}/materials`;
  return base;
}
export function pushNotice(desc: string, r: "user" | "admin") {
  noticeStore.set((all) => ({ ...all, [r]: [{ id: Date.now() + Math.random(), desc, time: now(), to: noticeTarget(desc, r), read: false }, ...(all[r] ?? [])].slice(0, 100) }));
}

/* ---------- 物种（基本信息）---------- */
type SpeciesRow = { name: string; latin: string; count: number | string };
export const speciesSeed: SpeciesRow[] = [{ name: "小麦", latin: "Triticum aestivum", count: 2310 }, { name: "玉米", latin: "Zea mays", count: 1520 }, { name: "水稻", latin: "Oryza sativa", count: 1582 }];
const speciesDict: { name: string; latin: string; keys: string[] }[] = [
  { name: "小麦", latin: "Triticum aestivum", keys: ["wheat", "小麦"] },
  { name: "玉米", latin: "Zea mays", keys: ["maize", "corn", "玉米"] },
  { name: "水稻", latin: "Oryza sativa", keys: ["rice", "水稻"] },
  { name: "黄瓜", latin: "Cucumis sativus", keys: ["cucumber", "黄瓜"] },
  { name: "大豆", latin: "Glycine max", keys: ["soybean", "soy", "大豆"] },
  { name: "番茄", latin: "Solanum lycopersicum", keys: ["tomato", "番茄", "西红柿"] },
  { name: "棉花", latin: "Gossypium hirsutum", keys: ["cotton", "棉花"] },
  { name: "高粱", latin: "Sorghum bicolor", keys: ["sorghum", "高粱"] },
  { name: "辣椒", latin: "Capsicum annuum", keys: ["pepper", "chili", "辣椒"] },
  { name: "油菜", latin: "Brassica napus", keys: ["rapeseed", "canola", "油菜"] },
  { name: "马铃薯", latin: "Solanum tuberosum", keys: ["potato", "马铃薯", "土豆"] },
];
export const speciesStore = () => getListStore<SpeciesRow[]>("meta:物种", speciesSeed);
/** 从文件名/描述中识别作物，写入物种列表。increment=true 时已存在的物种材料数 +1。 */
export function registerSpecies(text: string, increment = true): string | null {
  const t = text.toLowerCase();
  const hit = speciesDict.find((s) => s.keys.some((k) => t.includes(k)));
  if (!hit) return null;
  const store = speciesStore();
  store.set((rows) => {
    const i = rows.findIndex((r) => r.name === hit.name);
    if (i < 0) return [...rows, { name: hit.name, latin: hit.latin, count: 0 }];
    if (!increment) return rows;
    return rows.map((r, j) => (j === i ? { ...r, count: Number(r.count || 0) + 1 } : r));
  });
  return hit.name;
}

/* ---------- 管理员首页异常预警 ---------- */
export type AlertKind = "missing" | "ndvi" | "blur";
export type AlertItem = { id: AlertKind; text: string };
export const alertsStore = createPersistedStore<AlertItem[]>("alerts", [
  { id: "missing", text: "rice_yield_2024.csv 缺失率 12.4%" },
  { id: "ndvi", text: "maize_density NDVI 存在 > 1 的异常值" },
  { id: "blur", text: "水稻虫害节点 12 张图片模糊/过曝" },
]);

/* ---------- 我的材料 / 我的试验 ---------- */
import { materials as seedMaterials, trials as seedTrials } from "@/lib/mock";
export type Trial = { code: string; name: string; site: string; design: string; plots: number; status: string; year: string; designType?: string; reps?: number; treatments?: number };
export const matStore = getListStore("materials", seedMaterials);
export const trialStore = getListStore<Trial[]>("trials", seedTrials.map((t) => ({ ...t, year: t.code.slice(2, 6) })));
/** 试验设计显示文本，如「随机区组 · 3 重复 · 4 处理」 */
export const designText = (type: string, reps?: number, treatments?: number) =>
  [type, reps ? `${reps} 重复` : "", treatments ? `${treatments} 处理` : ""].filter(Boolean).join(" · ") || "待设置";

/** AI 识别结果：按表型数据节点 ID 归档，并记录来源图片节点 ID，实现图片模块 → 数据模块联动。 */
export type AiRecord = { imageId: number; disease: string; confidence: number; height: number; leafArea: number; coverage: number; health: string };
export type AiBatch = { id: number; fileId: number; dataNodeId: string; imageNodeId: string; model: string; time: string; records: AiRecord[] };
export const aiResultsStore = createPersistedStore<AiBatch[]>("aiResults", []);
/** 最近一次 AI 识别归档的表型数据节点：进入「表型数据」页时默认选中，立即看到新文件。 */
export const lastAiTargetStore = createPersistedStore<string | null>("lastAiTarget", null);

/** 每个页面（角色+模块）上次浏览的节点，用于标签页切回时恢复。 */
export const lastNodeStore = createPersistedStore<Record<string, string>>("lastNode", {});
/** 工作台顶部已打开的标签页（完整地址，含查询参数）。 */
/** 每个标签都是独立实例：id 唯一，同一模块可多开，href 保存该实例自己的地址与子页状态。 */
export type WbTab = { tabId: string; title: string; subTitle?: string; path: string; query: Record<string, string>; href: string };
export const tabsStore = createPersistedStore<Record<string, WbTab[]>>("wbTabs3", {});
/** 每个角色当前激活的标签实例 id。 */
export const activeTabStore = createPersistedStore<Record<string, string>>("wbActiveTab", {});
/** 「分析工具」上次停留的子页（按角色），重新进入时恢复。 */
export const lastAnalysisTabStore = createPersistedStore<Record<string, string>>("lastAnalysisTab", {});
