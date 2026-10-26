import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, Images, LayoutGrid, Search, Table2 } from "lucide-react";
import { ChinaMap, regionSites } from "./regionKit";
import { AnalysisObjectSelector } from "./AnalysisObjectSelector";
import { ImageAnalysisCharts } from "./ImageAnalysisCharts";
import { countImages, fileContext, fileSamples, matchesRegion, nodePath } from "./analysisScope";
import { ChartBox, StatTooltip, BoxPlot, rawRows, stats, exportCsv, YEARS, SITES, type Trait } from "./analysisKit";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Legend, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TraitRadar } from "./TraitRadar";
import { comparisonConclusion, indicatorMaximum } from "./traitComparison";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Role } from "./Workbench";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "./ui";
import { FullPagination } from "./FullPagination";
import { materials, multiTrial, phenotypeFiles, traitByMaterial, typeShare, type TreeNode } from "@/lib/mock";
import { filesStore, imagesStore, imageTreeStore, dataTreeStore, trialStore, type Img } from "@/store";
import caseCorn from "@/assets/case-corn.jpg";
import caseWheat from "@/assets/case-wheat.jpg";
import demoRapeseed from "@/assets/demo-rapeseed.svg";
import demoSoybean from "@/assets/demo-soybean.svg";
import { lastAnalysisTabStore, matStore, searchQueryStore } from "@/store";
import { analysisSelectionStore, resolveAnalysisSelection, selectAnalysisObject, selectAnalysisObjects } from "@/store/analysisSelection";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// 外环标签：细引线 + 奇偶错位半径，避免文字重叠
const outerRingLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, index } = props;
  const RAD = Math.PI / 180;
  const sin = Math.sin(-RAD * midAngle);
  const cos = Math.cos(-RAD * midAngle);
  const endR = outerRadius + (index % 2 === 0 ? 12 : 24);
  const ex = cx + endR * cos;
  const ey = cy + endR * sin;
  return (
    <g>
      <line x1={cx + (outerRadius + 4) * cos} y1={cy + (outerRadius + 4) * sin} x2={ex} y2={ey} stroke="var(--border)" strokeWidth={1} />
      <text x={ex + (cos >= 0 ? 3 : -3)} y={ey} fill="var(--muted-foreground)" fontSize={10} textAnchor={cos >= 0 ? "start" : "end"} dominantBaseline="central">{name}</text>
    </g>
  );
};
const traits = ["株高", "穗长", "千粒重"] as const;
const unitOf: Record<string, string> = { 株高: "cm", 穗长: "cm", 千粒重: "g" };
/** 拥挤柱状图通用的 45° 倾斜 X 轴 */
const angledX = { angle: -45, textAnchor: "end" as const, height: 64, interval: 0, fontSize: 11 };

/* ---------- 数量统计：分析对象来自表型数据 / 表型图片仓库 ---------- */
type FileObj = { id: string; kind: "file"; name: string; group?: string; phenos: number; materials: number };
type ImgObj = { id: string; kind: "image"; name: string; group?: string; images: number; linked: number; list: Img[] };
type AnalysisObject = FileObj | ImgObj;
const traitRows = [
  { name: "DTA", full: "Days to anthesis", abbr: "DTA", cat: "花期", note: "—" },
  { name: "DTS", full: "Days to silking", abbr: "DTS", cat: "花期", note: "—" },
  { name: "ATI", full: "Anther-tassel interval", abbr: "ATI", cat: "花期", note: "—" },
  { name: "PH", full: "Plant height", abbr: "PH", cat: "株型", note: "—" },
  { name: "EH", full: "Ear height", abbr: "EH", cat: "株型", note: "—" },
  { name: "TL", full: "Tassel length", abbr: "TL", cat: "株型", note: "—" },
  { name: "TBN", full: "Tassel branch number", abbr: "TBN", cat: "株型", note: "—" },
  { name: "STI", full: "Stalk thickness", abbr: "STI", cat: "株型", note: "—" },
  { name: "SAI", full: "Stalk area index", abbr: "SAI", cat: "株型", note: "—" },
  { name: "LNAE", full: "Leaf number above ear", abbr: "LNAE", cat: "株型", note: "—" },
  { name: "LNBE", full: "Leaf number below ear", abbr: "LNBE", cat: "株型", note: "—" },
  { name: "CW", full: "Cob weight", abbr: "CW", cat: "产量", note: "—" },
  { name: "EW", full: "Ear weight", abbr: "EW", cat: "产量", note: "—" },
  { name: "KNPE", full: "Kernel number per ear", abbr: "KNPE", cat: "产量", note: "—" },
  { name: "KNPR", full: "Kernel number per row", abbr: "KNPR", cat: "产量", note: "—" },
  { name: "KWPE", full: "Kernel weight per ear", abbr: "KWPE", cat: "产量", note: "—" },
  { name: "ERN", full: "Ear row number", abbr: "ERN", cat: "产量", note: "—" },
  { name: "LBT", full: "Length of barren tip", abbr: "LBT", cat: "产量", note: "—" },
  { name: "SPAD", full: "叶绿素相对含量", abbr: "SPAD", cat: "未分类", note: "—" },
  { name: "NDVI", full: "归一化植被指数", abbr: "NDVI", cat: "未分类", note: "—" },
];
const demoImageRows = [
  { name: "DJI_20240312_001.jpg", time: "2024-03-12 10:24", material: "ZM-001", device: "大疆 M3M 无人机", cat: "冠层覆盖", src: "pool:0" },
  { name: "DJI_20240312_002.jpg", time: "2024-03-12 10:26", material: "ZM-014", device: "大疆 M3M 无人机", cat: "冠层覆盖", src: "pool:1" },
  { name: "DJI_20240319_045.jpg", time: "2024-03-19 15:02", material: "XN-979", device: "大疆 M3M 无人机", cat: "叶色", src: "pool:2" },
  { name: "RGB_20240321_112.jpg", time: "2024-03-21 09:41", material: "BN-207", device: "地面 RGB 相机", cat: "叶色", src: "pool:3" },
  { name: "DJI_20240402_078.jpg", time: "2024-04-02 11:15", material: "JM-22", device: "大疆 M3M 无人机", cat: "病斑", src: "pool:0" },
  { name: "RGB_20240405_203.jpg", time: "2024-04-05 14:30", material: "YD-6", device: "地面 RGB 相机", cat: "病斑", src: "pool:1" },
  { name: "DJI_20240408_090.jpg", time: "2024-04-08 10:05", material: "ZM-001", device: "大疆 M3M 无人机", cat: "未分类", src: "pool:2" },
  { name: "RGB_20240409_310.jpg", time: "2024-04-09 16:20", material: "ZM-014", device: "地面 RGB 相机", cat: "未分类", src: "pool:3" },
];
const ringOf = <T extends { cat: string }>(rows: T[], nameOf: (r: T) => string) => {
  const cats = [...new Set(rows.map((r) => r.cat))];
  return { inner: cats.map((c) => ({ name: c, value: rows.filter((r) => r.cat === c).length })), outer: rows.map((r) => ({ name: nameOf(r), cat: r.cat, value: 1 })) };
};
const traitRing = ringOf(traitRows, (r) => r.name);
const thumbs = [caseCorn, caseWheat, demoRapeseed, demoSoybean];
const imgSrc = (s: string) => (s.startsWith("pool:") ? thumbs[Number(s.slice(5)) % thumbs.length] : s);

export function AnalysisTools({ title = "分析工具", role = "user", tab: tabParam, mat: initMat = "ZM-001" }: { title?: string; role?: Role; tab?: string | undefined; mat?: string }) {
  const [mat, setMat] = useState(traitByMaterial.some((r) => r.material === initMat) ? initMat : "ZM-001");
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  // 子页：优先 URL ?tab=，否则恢复该角色上次停留的子页
  const tab = tabParam ?? lastAnalysisTabStore.get()[role] ?? "trait";
  const setTab = (v: string) => {
    lastAnalysisTabStore.set((m) => ({ ...m, [role]: v }));
    navigate({ to: ".", search: ((p: Record<string, unknown>) => ({ ...p, tab: v })) as never, replace: true });
  };
  useEffect(() => { if (!tabParam) setTab(tab); else lastAnalysisTabStore.set((m) => ({ ...m, [role]: tabParam })); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tabParam]);
  const [trait, setTrait] = useState<(typeof traits)[number]>("株高");
  const [q, setQ] = searchQueryStore.useStore();
  const [storedMaterials] = matStore.useStore();
  const selectedMaterial = storedMaterials.find((m) => m.code === mat);
  const hitMats = q ? materials.filter((m) => (m.code + m.name + m.crop + m.target).includes(q)) : [];
  const hitFiles = q ? phenotypeFiles.filter((f) => (f.name + f.desc + f.crop).includes(q)) : [];
  const total = hitMats.length * 2 + hitFiles.length;
  const [raw, setRaw] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [savedSelections] = analysisSelectionStore.useStore();
  const setObjId = (id: string) => selectAnalysisObject(role, id);
  const [view, setView] = useState<"table" | "gallery">("table");
  const [allFiles] = filesStore.useStore();
  const [allImages] = imagesStore.useStore();
  const [imgTree] = imageTreeStore.useStore();
  const [dataTree] = dataTreeStore.useStore();
  const [trialsList] = trialStore.useStore();
  const setMultiIds = (ids: string[]) => selectAnalysisObjects(role, ids);
  const [regionView, setRegionView] = useState("files");
  const nodeName = (id: string): string => {
    const walk = (ns: TreeNode[]): string | undefined => { for (const n of ns) { if (n.id === id) return n.name; const r = n.children && walk(n.children); if (r) return r; } return undefined; };
    return walk(imgTree) ?? id;
  };
  const fileObjs: FileObj[] = allFiles.map((f) => ({ id: `f${f.id}`, kind: "file", name: f.name, group: nodePath(dataTree, f.nodeId), phenos: f.desc ? f.desc.split(/[·,，、]/).filter(Boolean).length : 1, materials: f.rows }));
  const imgObjs: ImgObj[] = Object.entries(allImages).filter(([, l]) => l.length > 0).map(([nid, list]) => ({ id: `i${nid}`, kind: "image", name: nodeName(nid), group: nodePath(imgTree, nid).split(" / ").slice(0, -1).join(" / "), images: list.length, linked: new Set(list.map((im) => im.variety).filter(Boolean)).size, list }));
  const analysisObjects: AnalysisObject[] = [...fileObjs, ...imgObjs];
  const { objectId: objId, multiIds: selectedMultiIds } = resolveAnalysisSelection(savedSelections[role], analysisObjects.map(o => o.id));
  const obj = analysisObjects.find((o) => o.id === objId);
  const isImage = obj?.kind === "image";
  const imageRows = obj?.kind === "image" ? obj.list.map((im) => ({ name: im.name ?? `图片-${im.id}`, time: im.date ?? "—", material: im.variety ?? "—", device: im.uploader ?? "—", cat: im.label || "未标注", src: im.src })) : demoImageRows;
  const imgRing = ringOf(imageRows, (r) => r.name.replace(/\.\w+$/, ""));
  const labelShare = [...imageRows.reduce((m, r) => m.set(r.cat, (m.get(r.cat) ?? 0) + 1), new Map<string, number>())].map(([name, value]) => ({ name, value }));
  const pieData = isImage ? labelShare : typeShare;
  const ringInner = isImage ? imgRing.inner : traitRing.inner;
  const ringOuter = isImage ? imgRing.outer : traitRing.outer;
  const catColor = (c: string) => colors[Math.max(0, ringInner.findIndex((d) => d.name === c)) % colors.length] ?? colors[0];
  const filteredTraits = traitRows.filter((r) => !cat || r.cat === cat || r.name === cat);
  const filteredImages = imageRows.filter((r) => !cat || r.cat === cat || r.name.startsWith(cat ?? ""));
  const toggleCat = (n?: string) => setCat((c) => (n && c !== n ? n : null));
  const [statPage, setStatPage] = useState(1);
  const [statSize, setStatSize] = useState(10);
  useEffect(() => setStatPage(1), [cat, objId]);
  const pagedTraits = filteredTraits.slice((statPage - 1) * statSize, statPage * statSize);
  const pagedImages = filteredImages.slice((statPage - 1) * statSize, statPage * statSize);
  const [siteName, setSiteName] = useState(regionSites[0]?.name ?? "河南 · 郑州");
  const [year, setYear] = useState("all");
  const [site, setSite] = useState("all");
  const traitObject = obj;
  const traitFile = traitObject?.kind === "file" ? allFiles.find(f => `f${f.id}` === traitObject.id) : undefined;
  const samples = traitFile ? fileSamples(traitFile, dataTree) : [];
  const availableMaterials = [...new Set(samples.map(r => r.material))];
  const currentMat = availableMaterials.includes(mat) ? mat : availableMaterials[0] ?? mat;
  const traitStat = (m: string, t: Trait) => stats(samples.filter(r => r.material === m).map(r => r[t]));
  const meanOf = (t: Trait) => stats(samples.map(r => r[t]));
  const matData = traits.map(t => ({ trait: t, 当前材料: traitStat(currentMat, t).mean, 群体均值: meanOf(t).mean }));
  const scopedMaterialData = availableMaterials.map(material => ({ material, ...Object.fromEntries(traits.map(t => [t, traitStat(material, t).mean])) }));
  const radarIndicators = matData.map(d => ({ trait: d.trait, unit: unitOf[d.trait] ?? "", current: d.当前材料, population: d.群体均值, max: indicatorMaximum(samples.map(r => r[d.trait])), currentStats: traitStat(currentMat, d.trait), populationStats: meanOf(d.trait) }));
  const multiFiles = allFiles.filter(f => selectedMultiIds.includes(`f${f.id}`));
  const multiImages = imgObjs.filter(o => selectedMultiIds.includes(o.id)).flatMap(o => o.list).filter(im => (year === "all" || im.date?.startsWith(year)) && (site === "all" || im.site?.includes(site)));
  const multiSamples = [...new Map(multiFiles.flatMap(f => fileSamples(f, dataTree)).map(r => [`${r.material}:${r.year}:${r.site}:${r.plot}`, r])).values()].filter(r => (year === "all" || r.year === year) && (site === "all" || r.site === site));
  const multiGroups = [...new Set(multiSamples.map(r => r.material))].map(m => ({ m, vals: multiSamples.filter(r => r.material === m).map(r => r.株高) }));
  const imageOnly = multiFiles.length === 0 && selectedMultiIds.length > 0;
  if (imageOnly) {
    const names = [...new Set(multiImages.map(im => im.variety || "未关联材料"))];
    const dates = [...new Set(multiImages.map(im => im.date || "未标注"))];
    multiGroups.push(...names.map(m => ({ m, vals: dates.map(date => multiImages.filter(im => (im.variety || "未关联材料") === m && (im.date || "未标注") === date).length) })));
  }
  const g = stats(multiGroups.flatMap(r => r.vals));
  const means = multiGroups.map(r => stats(r.vals));
  const varG = stats(means.map(r => r.mean)).sd ** 2;
  const varE = means.reduce((a, r) => a + r.sd ** 2, 0) / Math.max(1, means.length);
  const h2 = varG + varE > 0 ? varG / (varG + varE / Math.max(1, means[0]?.n ?? 0)) : 0;
  const multi = { h2, table: multiGroups.map((r, i) => { const st = means[i] ?? stats([]); return { material: r.m, ...st, cv: st.mean ? `${(st.sd / st.mean * 100).toFixed(1)}%` : "—", blup: +(g.mean + h2 * (st.mean - g.mean)).toFixed(2), h2, points: r.vals }; }) };
  const mapSites = regionSites.map(s => {
    const files = allFiles.filter(f => matchesRegion(nodePath(dataTree, f.nodeId), s.name));
    const images = Object.entries(allImages).flatMap(([nid, list]) => list.filter(im => matchesRegion(im.site || nodePath(imgTree, nid), s.name)));
    const trials = trialsList.filter(t => matchesRegion(t.site, s.name));
    return { ...s, files: files.length, materials: files.reduce((n, f) => n + f.rows, 0), images: images.length, trials, fileList: files, imageList: images };
  });
  const spot = mapSites.find(s => s.name === siteName) ?? mapSites[0];
  const multiYears = [...new Set([...allFiles.map(f => fileContext(f, dataTree).year), ...Object.values(allImages).flat().map(im => im.date?.slice(0, 4) ?? "")])].filter(Boolean).sort();
  const multiSites = [...new Set([...allFiles.map(f => fileContext(f, dataTree).site), ...Object.values(allImages).flat().map(im => im.site || "未标注")])];
  const onBar = (m: string) => (e: unknown) => { const p = (e as { payload?: { material?: string } })?.payload; setRaw(p?.material ?? m); };
  const itemCls = "flex items-center gap-3 py-3 px-2 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors";

  return (
    <div>
      <Tabs key={initMat} value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="trait">性状分析</TabsTrigger>
          <TabsTrigger value="stat">数量统计</TabsTrigger>
          <TabsTrigger value="multi">多试验分析</TabsTrigger>
          <TabsTrigger value="region">地区管理</TabsTrigger>
          <TabsTrigger value="material">材料与系谱</TabsTrigger>
          <TabsTrigger value="search">全局搜索</TabsTrigger>
        </TabsList>

        {/* ============ 性状分析 ============ */}
        <TabsContent value="trait" className="mt-4 space-y-5">
          <Panel><AnalysisObjectSelector options={analysisObjects} value={traitObject?.id} onChange={setObjId} /></Panel>
          {traitObject?.kind === "image" ? <ImageAnalysisCharts images={traitObject.list} /> : samples.length === 0 ? <Panel><p className="py-12 text-center text-sm text-muted-foreground">所选文件暂无可用性状测量记录</p></Panel> : <>
          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">选择材料</span>
              <Select value={currentMat} onValueChange={setMat}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{availableMaterials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
              <span className="text-sm text-muted-foreground">选择性状</span>
              <Select value={trait} onValueChange={(v) => setTrait(v as typeof trait)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{traits.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              <span className="text-xs text-muted-foreground">点击图表柱子可查看原始数据明细</span>
            </div>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-5">
            <Panel title={`${currentMat} · 多性状表现（含群体均值对比）`} className="rounded-lg">
              <ChartBox name={`${currentMat}_多性状表现`} csv={() => matData.map((d) => ({ 性状: d.trait, 当前材料: d.当前材料, 标准差: traitStat(currentMat, d.trait).sd, 样本量: traitStat(currentMat, d.trait).n, 群体均值: d.群体均值 }))}>
                <ResponsiveContainer><BarChart data={matData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="trait" /><YAxis /><Tooltip content={<StatTooltip info={(p) => { const t = p.payload?.["trait"] as Trait; const s = p.name === "当前材料" ? traitStat(currentMat, t) : meanOf(t); return { sd: s.sd, n: s.n }; }} />} /><Legend />
                  <Bar dataKey="当前材料" fill="var(--chart-1)" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={() => setRaw(currentMat)}>
                    <LabelList dataKey="当前材料" position="top" fontSize={11} fill="var(--chart-1)" />
                  </Bar>
                  <Bar dataKey="群体均值" fill="var(--chart-2)" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={() => setRaw(currentMat)}>
                    <LabelList dataKey="群体均值" position="top" fontSize={11} fill="var(--chart-2)" />
                  </Bar></BarChart></ResponsiveContainer>
              </ChartBox>
            </Panel>
            <Panel title="多性状综合表现 (Radar Chart)" className="rounded-lg">
              <ChartBox name={`${currentMat}_雷达图`} csv={() => radarIndicators.map((d) => ({ 性状: d.trait, 单位: d.unit, 指标最大值: d.max, 当前材料: d.current, 群体均值: d.population, 材料均值: d.currentStats.mean, 材料标准差: d.currentStats.sd, 材料样本量: d.currentStats.n, 群体样本均值: d.populationStats.mean, 群体标准差: d.populationStats.sd, 群体样本量: d.populationStats.n }))}>
                <TraitRadar material={currentMat} indicators={radarIndicators} />
              </ChartBox>
            </Panel>
            </div>
            <div className="flex min-w-0 flex-col gap-5 lg:border-l lg:pl-5">
            <Panel title="材料信息" className="shrink-0 rounded-lg">
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {[
                  ["当前材料", currentMat],
                  ["试验年份", traitFile ? fileContext(traitFile, dataTree).year : "—"],
                  ["试验地点", traitFile ? fileContext(traitFile, dataTree).site : "—"],
                  ["育种单位", storedMaterials.find(m => m.code === currentMat)?.source === "河南农科院" ? "河南省农科院" : storedMaterials.find(m => m.code === currentMat)?.source || "—"],
                  ["样本量", traitStat(currentMat, trait).n],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title={`${trait} · 各材料对比（含平均值对比线）`} className="flex min-h-0 flex-1 flex-col rounded-lg">
              <ChartBox name={`${trait}_各材料对比`} wrapperClassName="flex min-h-0 flex-1 flex-col" className="h-72 min-h-72 flex-1 lg:h-0" csv={() => scopedMaterialData.map((r) => ({ 材料: r.material, [trait]: traitStat(r.material, trait).mean, 标准差: traitStat(r.material, trait).sd, 样本量: traitStat(r.material, trait).n }))}>
                <ResponsiveContainer><BarChart data={scopedMaterialData} margin={{ bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="material" tick={angledX} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} /><Tooltip content={<StatTooltip info={(p) => { const s = traitStat(String(p.payload?.["material"]), trait); return { sd: s.sd, n: s.n, extra: ` · 平均值 ${meanOf(trait).mean}${unitOf[trait]}` }; }} />} /><Legend />
                  <ReferenceLine y={meanOf(trait).mean} stroke="var(--chart-2)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `平均值 ${meanOf(trait).mean}`, position: "insideTopRight", fontSize: 11, fill: "var(--chart-2)" }} />
                  <Bar dataKey={trait} name={`该材料值（${unitOf[trait]}）`} fill="var(--chart-1)" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={onBar(currentMat)}>
                    <LabelList dataKey={trait} position="top" fontSize={10} fill="var(--chart-1)" />
                  </Bar></BarChart></ResponsiveContainer>
              </ChartBox>
            </Panel>
            </div>
          </div>
          <Panel title={`${currentMat} · 性状数据明细表`} extra={<Button size="sm" variant="ghost" className="ml-auto shrink-0 h-7 text-xs" onClick={() => exportCsv(`${currentMat}_性状明细`, matData.map((d) => ({ 性状: d.trait, 单位: unitOf[d.trait], 该材料值: d.当前材料, 群体均值: d.群体均值, 差值: +(d.当前材料 - d.群体均值).toFixed(2), 对比结论: comparisonConclusion(+(d.当前材料 - d.群体均值).toFixed(2)), 标准差: traitStat(currentMat, d.trait).sd, 样本量: traitStat(currentMat, d.trait).n })))}><FileDown />导出CSV数据</Button>}>
            <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["性状", "单位", "该材料值", "群体均值", "差值", "对比结论", "标准差", "样本量"].map((h) => <th key={h} className="text-left p-2.5 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{matData.map((d) => { const s = traitStat(currentMat, d.trait); const diff = +(d.当前材料 - d.群体均值).toFixed(2); return (
                <tr key={d.trait} className="border-t hover:bg-muted/40">
                  <td className="p-2.5 font-medium">{d.trait}</td><td className="p-2.5 text-muted-foreground">{unitOf[d.trait]}</td>
                  <td className="p-2.5 font-display font-semibold text-chart-1">{d.当前材料}</td><td className="p-2.5 font-display">{d.群体均值}</td>
                  <td className={`p-2.5 font-display ${diff > 0 ? "text-chart-3" : diff < 0 ? "text-chart-2" : ""}`}>{diff > 0 ? `+${diff}` : diff}</td>
                  <td className="p-2.5"><span className={`inline-flex whitespace-nowrap rounded px-2 py-0.5 text-xs ${diff > 0 ? "bg-primary-soft text-primary" : diff < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{comparisonConclusion(diff)}</span></td>
                  <td className="p-2.5 font-display">±{s.sd}</td><td className="p-2.5 font-display">{s.n}</td>
                </tr>); })}</tbody>
            </table></div>
          </Panel>
          </>}
        </TabsContent>

        {/* ============ 数量统计 ============ */}
        <TabsContent value="stat" className="mt-4 space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full"><AnalysisObjectSelector options={analysisObjects} value={obj?.id} onChange={v => { setObjId(v); setCat(null); }} /></div>
              <span className="text-sm font-medium">{obj && (obj.kind === "image" ? <>图片数量: <b className="font-display">{obj.images}</b> | 关联材料: <b className="font-display">{obj.linked}</b></> : <>表型数量: <b className="font-display">{obj.phenos}</b> | 材料数量: <b className="font-display">{obj.materials}</b></>)}</span>
              {cat && <Button size="sm" variant="outline" onClick={() => setCat(null)}>清除分类「{cat}」</Button>}
              <span className="text-xs text-muted-foreground">点击环形图分类可筛选下方明细</span>
            </div>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={isImage ? "图像标签占比" : "表型类型占比"}>
              <ChartBox name={isImage ? "图像标签占比" : "表型类型占比"} csv={() => pieData.map((d) => ({ 类型: d.name, 数量: d.value }))}>
                <ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius="62%" paddingAngle={2} label={(p) => `${p.name} ${(Number(p.percent) * 100).toFixed(1)}%`} fontSize={11}>
                  {pieData.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length] ?? ""} />)}</Pie>
                  <Tooltip content={<StatTooltip hint="" info={() => ({})} />} /><Legend /></PieChart></ResponsiveContainer>
              </ChartBox>
            </Panel>
            <Panel title={isImage ? "图像性状分类占比" : "性状分类环形图"}>
              <ChartBox name={isImage ? "图像性状分类占比" : "性状分类环形图"} className="h-80" csv={() => ringOuter.map((d) => ({ 分类: d.cat, 名称: d.name }))}>
                <div className="relative h-full">
                <ResponsiveContainer><PieChart>
                  <Pie data={ringInner} dataKey="value" nameKey="name" innerRadius={0} outerRadius={56} label={(p) => p.name} fontSize={10} className="cursor-pointer" onClick={(d) => toggleCat((d as { name?: string }).name)}>
                    {ringInner.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length] ?? ""} fillOpacity={!cat || cat === d.name || ringOuter.some((r) => r.cat === d.name && r.name === cat) ? 1 : 0.3} stroke={cat === d.name ? "var(--foreground)" : undefined} />)}</Pie>
                  <Pie data={ringOuter} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={1} label={outerRingLabel} labelLine={false} className="cursor-pointer" onClick={(d) => toggleCat((d as { name?: string }).name)}>
                    {ringOuter.map((d) => <Cell key={d.name} fill={catColor(d.cat)} fillOpacity={!cat || cat === d.name || cat === d.cat ? 0.95 : 0.25} stroke={cat === d.name ? "var(--foreground)" : undefined} />)}</Pie>
                  <Tooltip content={<StatTooltip hint="点击筛选下方明细" info={() => ({})} />} />
                </PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded-full bg-card px-2 py-1 text-sm font-bold shadow-sm">{isImage ? "图像性状" : "植物性状"}</span></div>
                </div>
              </ChartBox>
            </Panel>
          </div>
          <Panel title={`${isImage ? "图片明细" : "性状明细"}${cat ? ` · ${cat}` : ""}`} extra={
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant={view === "table" ? "default" : "ghost"} className="h-7 text-xs" onClick={() => setView("table")}><Table2 />表格</Button>
              <Button size="sm" variant={view === "gallery" ? "default" : "ghost"} className="h-7 text-xs" onClick={() => setView("gallery")}><LayoutGrid />画廊</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => exportCsv(isImage ? "图片明细" : "性状明细", isImage ? filteredImages.map((r, i) => ({ 序号: i + 1, 图片文件名: r.name, 拍摄时间: r.time, 关联材料: r.material, 拍摄设备: r.device })) : filteredTraits.map((r, i) => ({ 序号: i + 1, 性状名称: r.name, 全称: r.full, 缩写: r.abbr, 所属分类: r.cat, 备注: r.note })))}><FileDown />导出CSV数据</Button>
            </div>}>
            {view === "table" ? (
              <>
              <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">
                {isImage ? (<>
                  <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["序号", "图片文件名", "拍摄时间", "关联材料", "拍摄设备"].map((h) => <th key={h} className="text-left p-2.5 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{pagedImages.map((r, i) => <tr key={r.name} className="border-t hover:bg-muted/40"><td className="p-2.5 font-display">{(statPage - 1) * statSize + i + 1}</td><td className="p-2.5 font-medium">{r.name}</td><td className="p-2.5 font-display text-muted-foreground">{r.time}</td><td className="p-2.5 font-mono text-xs">{r.material}</td><td className="p-2.5">{r.device}</td></tr>)}</tbody>
                </>) : (<>
                  <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["序号", "性状名称", "全称", "缩写", "所属分类", "备注"].map((h) => <th key={h} className="text-left p-2.5 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{pagedTraits.map((r, i) => <tr key={r.name} className="border-t hover:bg-muted/40"><td className="p-2.5 font-display">{(statPage - 1) * statSize + i + 1}</td><td className="p-2.5 font-medium">{r.name}</td><td className="p-2.5 text-muted-foreground">{r.full}</td><td className="p-2.5 font-mono text-xs">{r.abbr}</td><td className="p-2.5"><span className="inline-flex rounded px-2 py-0.5 text-xs bg-primary-soft text-primary">{r.cat}</span></td><td className="p-2.5 text-muted-foreground">{r.note}</td></tr>)}</tbody>
                </>)}
              </table></div>
              <FullPagination total={isImage ? filteredImages.length : filteredTraits.length} page={statPage} pageSize={statSize} onPage={setStatPage} onPageSize={setStatSize} sizes={[10, 20, 50]} />
              </>
            ) : isImage ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredImages.map((r, i) => (
                  <figure key={r.name} className="relative overflow-hidden rounded-xl border">
                    <img src={imgSrc(r.src)} alt={r.name} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-foreground/60 px-2 py-1 text-xs text-background backdrop-blur-sm"><span className="font-mono font-semibold">{r.material}</span> · {r.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredTraits.map((r) => (
                  <div key={r.name} className="rounded-xl border p-3"><p className="font-medium text-sm">{r.name}</p><p className="mt-1 text-xs text-muted-foreground">{r.full}</p><span className="mt-2 inline-flex rounded px-2 py-0.5 text-xs bg-primary-soft text-primary">{r.cat}</span></div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* ============ 多试验分析 ============ */}
        <TabsContent value="multi" className="mt-4 space-y-5">
          <Panel><AnalysisObjectSelector options={analysisObjects} multiple selected={selectedMultiIds} onSelected={setMultiIds} /></Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={year} onValueChange={setYear}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">全部年份</SelectItem>{multiYears.map((y) => <SelectItem key={y} value={y}>{y} 年</SelectItem>)}</SelectContent></Select>
            <Select value={site} onValueChange={setSite}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">全部地点</SelectItem>{multiSites.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            {!imageOnly && <span className="text-sm text-muted-foreground">广义遗传力 H² = <b className="font-display text-foreground">{multi.h2.toFixed(3)}</b></span>}
          </div>
          {multi.table.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">所选对象在当前筛选条件下暂无可用记录</p>}
          {multiFiles.length > 0 && multiImages.length > 0 && <ImageAnalysisCharts images={multiImages} />}
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title={imageOnly ? "各材料每日图片数量统计" : "所选文件 · 株高统计"} extra={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => exportCsv("多试验统计", multi.table.map(({ points: _p, ...r }) => r))}><FileDown />导出CSV数据</Button>}>
              <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["材料", "均值", "最大值", "最小值", "标准差", "变异系数", "BLUP值", "遗传力"].map((h) => <th key={h} className="text-left p-2 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{multi.table.map((r) => <tr key={r.material} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => setRaw(r.material)}><td className="p-2 font-medium">{r.material}</td><td className="p-2 font-display">{r.mean.toFixed(2)}</td><td className="p-2 font-display">{r.max.toFixed(2)}</td><td className="p-2 font-display">{r.min.toFixed(2)}</td><td className="p-2 font-display">{r.sd.toFixed(2)}</td><td className="p-2 font-display">{r.cv}</td><td className="p-2 font-display text-chart-1">{imageOnly ? "—" : r.blup.toFixed(2)}</td><td className="p-2 font-display">{imageOnly ? "—" : r.h2.toFixed(3)}</td></tr>)}</tbody>
              </table></div>
            </Panel>
            <Panel title={imageOnly ? "每日图片数量箱线图" : "株高箱线图 · 分布"}>
              <ChartBox name="多试验_箱线图" className="h-56" csv={() => multi.table.map((r) => ({ 材料: r.material, 最小值: r.min, Q1: r.q1, 中位数: r.median, Q3: r.q3, 最大值: r.max, 样本量: r.n }))}>
                <BoxPlot unit={imageOnly ? " 张" : " cm"} data={multi.table.map((r) => ({ label: r.material, s: r, points: r.points }))} />
              </ChartBox>
            </Panel>
          </div>
          <Panel title="均值与极值对比">
            <ChartBox name="多试验_均值与极值" className="h-72" csv={() => multi.table.map((r) => ({ 材料: r.material, 最小值: r.min, 均值: r.mean, 最大值: r.max, 标准差: r.sd, 样本量: r.n }))}>
              <ResponsiveContainer><ComposedChart data={multi.table} margin={{ bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="material" tick={angledX} />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip content={<StatTooltip info={(p) => ({ sd: Number(p.payload?.["sd"]), n: Number(p.payload?.["n"]) })} />} />
                <Legend />
                <Bar dataKey="min" name="最小值" fill="var(--chart-3)" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={onBar("")} />
                <Bar dataKey="max" name="最大值" fill="var(--chart-2)" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={onBar("")} />
                <Line type="monotone" dataKey="mean" name="均值" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--chart-1)" }} className="cursor-pointer" onClick={onBar("")} />
              </ComposedChart></ResponsiveContainer>
            </ChartBox>
          </Panel>
        </TabsContent>

        {/* ============ 地区管理 ============ */}
        <TabsContent value="region" className="mt-4 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Panel title="试验地点分布"><ChinaMap sites={mapSites} selected={siteName} onSelect={setSiteName} /></Panel>
          {spot && <Panel title={spot.name}>
            <Tabs value={regionView} onValueChange={setRegionView}>
              <TabsList className="h-auto flex-wrap"><TabsTrigger value="files">数据文件 ({spot.files})</TabsTrigger><TabsTrigger value="images">图片 ({spot.images})</TabsTrigger><TabsTrigger value="experiments">试验 ({spot.trials.length})</TabsTrigger></TabsList>
              <TabsContent value="files"><div className="max-h-96 overflow-auto divide-y">{spot.fileList.map(f => <div key={f.id} className="py-3"><p className="break-all text-sm font-medium">{f.name}</p><p className="mt-1 text-xs text-muted-foreground">{f.crop} · {f.rows} 条 · {f.owner} · {f.date}</p></div>)}{!spot.files && <p className="py-8 text-center text-sm text-muted-foreground">该地区暂无数据文件</p>}</div></TabsContent>
              <TabsContent value="images"><div className="max-h-96 overflow-auto divide-y">{spot.imageList.map(im => <div key={im.id} className="py-3"><p className="break-all text-sm font-medium">{im.name || `图片-${im.id}`}</p><p className="mt-1 text-xs text-muted-foreground">{im.variety || "未关联材料"} · {im.label} · {im.date}</p></div>)}{!spot.images && <p className="py-8 text-center text-sm text-muted-foreground">该地区暂无图片</p>}</div></TabsContent>
              <TabsContent value="experiments"><div className="divide-y">{spot.trials.map(t => <div key={t.code} className="py-3"><p className="text-sm font-medium">{t.name}</p><p className="mt-1 text-xs text-muted-foreground">{t.design} · {t.status}</p></div>)}{!spot.trials.length && <p className="py-8 text-center text-sm text-muted-foreground">该地区暂无试验</p>}</div></TabsContent>
            </Tabs>
            <ChartBox name={`${spot.name}_数据规模`} className="h-48" csv={() => [{ 类型: "数据文件", 数量: spot.files }, { 类型: "图片", 数量: spot.images }, { 类型: "试验", 数量: spot.trials.length }]}>
              <ResponsiveContainer><BarChart data={[{ name: "数据文件", value: spot.files }, { name: "图片", value: spot.images }, { name: "试验", value: spot.trials.length }]}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip content={<StatTooltip hint="" info={() => ({})} />} /><Bar dataKey="value" name="数量" fill="var(--chart-3)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </ChartBox>
          </Panel>}
        </TabsContent>

        {/* ============ 材料与系谱 ============ */}
        <TabsContent value="material" className="mt-4">
          <Panel title="材料基本信息">
            <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["编号", "名称", "作物", "来源", "系谱（母本 × 父本）", "育种目标"].map((h) => <th key={h} className="text-left p-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>{materials.map((m) => <tr key={m.code} className="border-t hover:bg-muted/40"><td className="p-2.5 font-mono text-xs">{m.code}</td><td className="p-2.5 font-medium"><Link to={isAdmin ? "/admin/materials/$code" : "/user/materials/$code"} params={{ code: m.code }} className="text-primary hover:underline">{m.name}</Link></td><td className="p-2.5">{m.crop}</td><td className="p-2.5">{m.source}</td><td className="p-2.5 text-primary">{m.pedigree}</td><td className="p-2.5">{m.target}</td></tr>)}</tbody>
            </table></div>
          </Panel>
        </TabsContent>

        {/* ============ 全局搜索 ============ */}
        <TabsContent value="search" className="mt-4">
          <Panel>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索材料、作物、性状、文件…（如：小麦、抗旱、wheat）" className="pl-9" /></div>
            <ul className="mt-4 divide-y">
              {hitMats.map((m) => (
                <li key={m.code} className="py-1">
                  <Link to={isAdmin ? "/admin/materials/$code" : "/user/materials/$code"} params={{ code: m.code }} className={itemCls}>
                    <span className="text-xs rounded bg-primary-soft text-accent-foreground px-1.5 py-0.5">材料</span>{m.code} {m.name}（{m.crop}）
                  </Link>
                  <Link to={isAdmin ? "/admin/analysis" : "/user/analysis"} search={{ tab: "trait", mat: m.code }} className={itemCls}>
                    <span className="text-xs rounded bg-info/15 text-info px-1.5 py-0.5">性状分析</span>{m.code} 的性状数据（雷达图 / 柱状图）
                  </Link>
                </li>
              ))}
              {hitFiles.map((f) => (
                <li key={f.id}><Link to={isAdmin ? "/admin/data" : "/user/data"} className={itemCls}>
                  <span className="text-xs rounded bg-muted px-1.5 py-0.5">文件</span>{f.id} {f.name}
                </Link></li>
              ))}
              {q && total === 0 && <li className="py-6 text-center text-sm text-muted-foreground">无结果</li>}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={!!raw} onOpenChange={(o) => !o && setRaw(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>原始数据明细：{raw}</DialogTitle><DialogDescription>3 年 × 2 地点 × 3 重复，共 {raw ? rawRows(raw).length : 0} 条记录</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-xl border"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground sticky top-0"><tr>{["年份", "地点", "重复", "小区", "株高(cm)", "穗长(cm)", "千粒重(g)"].map((h) => <th key={h} className="p-2 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody>{raw && rawRows(raw).map((x, i) => <tr key={i} className="border-t"><td className="p-2 font-display">{x.year}</td><td className="p-2">{x.site}</td><td className="p-2">{x.rep}</td><td className="p-2 font-mono text-xs">{x.plot}</td><td className="p-2 font-display">{x.株高.toFixed(1)}</td><td className="p-2 font-display">{x.穗长.toFixed(1)}</td><td className="p-2 font-display">{x.千粒重.toFixed(1)}</td></tr>)}</tbody>
          </table></div>
          <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => raw && exportCsv(`${raw}_原始数据`, rawRows(raw))}><FileDown />导出CSV数据</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

