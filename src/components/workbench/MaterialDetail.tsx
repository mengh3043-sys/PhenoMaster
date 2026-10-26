import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { FileSpreadsheet } from "lucide-react";
import { filesStore, imagesStore, imageTreeStore } from "@/store";
import { findNode } from "./TreePanel";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";
import hero from "@/assets/hero-field.jpg";
import { ArrowLeft, LineChart } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "./ui";
import type { Role } from "./Workbench";
import { materials, traitByMaterial } from "@/lib/mock";

export function radarData(code: string) {
  const row = traitByMaterial.find((r) => r.material === code);
  if (!row) return null;
  const keys = ["株高", "穗长", "千粒重"] as const;
  return keys.map((k) => {
    const max = Math.max(...traitByMaterial.map((r) => r[k]));
    return { trait: k, value: Math.round((row[k] / max) * 100), raw: row[k] };
  });
}

const pool = [wheat, corn, rice, hero];
const srcOf = (s: string) => (s.startsWith("pool:") ? pool[Number(s.slice(5))] ?? wheat : s);
const cropKeys: Record<string, string[]> = { 小麦: ["wheat", "小麦"], 玉米: ["maize", "corn", "玉米"], 水稻: ["rice", "水稻"] };
const cropImgNodes: Record<string, string[]> = { 小麦: ["i11", "i12", "i1"], 玉米: ["i2"], 水稻: ["i3"] };
// 祖代系谱（演示数据）
const ancestry: Record<string, string> = {
  周麦18: "温麦6号 × 周麦13", 矮抗58: "周麦11 × 温麦6号", 郑麦9023: "小偃6号 × 西农65", 百农207: "周麦16 × 矮抗58",
  新麦26: "新麦9号 × 郑麦366", 周麦22: "周麦12 × 温麦6号", 京724: "京24 × 黄早四", 京92: "京89 × 掖478", "9311 选系": "扬稻4号 × 3021",
};

/** 系谱树状图：vis-network 仅在浏览器端动态加载 */
function PedigreeGraph({ name, pedigree }: { name: string; pedigree: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let net: { destroy: () => void } | undefined; let dead = false;
    (async () => {
      const { Network } = await import("vis-network/standalone");
      if (dead || !ref.current) return;
      const cs = getComputedStyle(document.documentElement);
      const c = (v: string) => cs.getPropertyValue(v).trim();
      const nodes: { id: string; label: string; level: number; color?: object; font?: object }[] = [];
      const edges: { from: string; to: string }[] = [];
      const add = (label: string, level: number, child?: string) => {
        const id = `${level}:${label}`;
        if (!nodes.some((n) => n.id === id)) nodes.push({ id, label, level, ...(level === 0 ? { color: { background: c("--primary"), border: c("--primary") }, font: { color: c("--primary-foreground") } } : {}) });
        if (child) edges.push({ from: id, to: child });
        return id;
      };
      const root = add(name, 0);
      pedigree.split(" × ").forEach((p, i) => {
        const pid = add(`${i ? "♂" : "♀"} ${p}`, 1, root);
        ancestry[p]?.split(" × ").forEach((g) => add(g, 2, pid));
      });
      net = new Network(ref.current, { nodes, edges }, {
        layout: { hierarchical: { direction: "DU", sortMethod: "directed", levelSeparation: 90, nodeSpacing: 130 } },
        nodes: { shape: "box", margin: { top: 8, bottom: 8, left: 10, right: 10 }, color: { background: c("--muted"), border: c("--border") }, font: { color: c("--foreground"), size: 14 } },
        edges: { arrows: "to", color: c("--muted-foreground"), smooth: { enabled: true, type: "cubicBezier", roundness: 0.4 } },
        physics: false, interaction: { dragNodes: true, zoomView: true },
      });
    })();
    return () => { dead = true; net?.destroy(); };
  }, [name, pedigree]);
  return <div ref={ref} className="h-80 w-full rounded-xl border bg-card" />;
}

export function MaterialDetail({ role, code }: { role: Role; code: string }) {
  const m = materials.find((x) => x.code === code);
  const [files] = filesStore.useStore();
  const [byNode] = imagesStore.useStore();
  const [imgTree] = imageTreeStore.useStore();
  const base = role === "admin" ? "/admin" : "/user";
  if (!m) {
    return (
      <Panel className="text-center py-16">
        <p className="font-semibold">未找到材料 {code}</p>
        <Button asChild variant="outline" className="mt-4"><Link to={role === "admin" ? "/admin/analysis" : "/user/analysis"} search={{ tab: "search" }}><ArrowLeft />返回搜索</Link></Button>
      </Panel>
    );
  }
  const keys = [m.code.toLowerCase(), m.name, ...(cropKeys[m.crop] ?? [])];
  const relFiles = files.filter((f) => (role === "admin" || f.public) && keys.some((k) => `${f.name} ${f.desc} ${f.crop}`.toLowerCase().includes(k.toLowerCase())));
  const relImgs = (cropImgNodes[m.crop] ?? []).flatMap((id) => { const n = findNode(imgTree, id); return n && (role === "admin" || n.public) ? (byNode[id] ?? []).map((im) => ({ ...im, nodeId: id, nodeName: n.name })) : []; }).slice(0, 8);
  const radar = radarData(m.code);
  return (
    <div>
      <PageHeader title={`${m.name}`} desc={`材料编号 ${m.code} · ${m.crop}`} actions={<>
        <Button variant="outline" asChild><Link to={role === "admin" ? "/admin/analysis" : "/user/analysis"} search={{ tab: "search" }}><ArrowLeft />返回搜索</Link></Button>
        <Button asChild><Link to={role === "admin" ? "/admin/analysis" : "/user/analysis"} search={{ tab: "trait", mat: m.code }}><LineChart />性状分析</Link></Button>
      </>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="基本信息">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[["名称", m.name], ["编号", m.code], ["作物", m.crop], ["来源", m.source], ["育种目标", m.target], ["所属", base === "/admin" ? "全平台" : "小麦育种课题组"]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title="系谱树状图（可拖拽、滚轮缩放）">
          <PedigreeGraph name={m.name} pedigree={m.pedigree} />
        </Panel>
        <Panel title="性状概览（相对群体最大值 %）" className="lg:col-span-2">
          {radar ? (
            <div className="h-72"><ResponsiveContainer><RadarChart data={radar}><PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="trait" /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} /></RadarChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">该材料暂无已入库的性状数据</p>}
        </Panel>
        <Panel title={`关联表型文件（${relFiles.length}）`}>
          {relFiles.length ? <ul className="divide-y text-sm">{relFiles.map((f) => (
            <li key={f.id}><Link to={role === "admin" ? "/admin/data" : "/user/data"} search={{ file: f.id, action: "detail" }} className="flex items-center gap-2 py-2.5 hover:text-primary"><FileSpreadsheet className="h-4 w-4 text-primary" /><span className="flex-1 truncate">{f.name}</span><span className="text-xs text-muted-foreground">{f.date}</span></Link></li>
          ))}</ul> : <p className="text-sm text-muted-foreground py-6 text-center">暂无关联文件</p>}
        </Panel>
        <Panel title={`关联图片（${relImgs.length}）`}>
          {relImgs.length ? <div className="grid grid-cols-4 gap-2">{relImgs.map((im) => (
            <Link key={`${im.nodeId}-${im.id}`} to={role === "admin" ? "/admin/images" : "/user/images"} search={{ node: im.nodeId, img: im.id }} className="block aspect-square overflow-hidden rounded-lg"><img src={srcOf(im.src)} alt={`图片 ${im.id}`} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform" /></Link>
          ))}</div> : <p className="text-sm text-muted-foreground py-6 text-center">暂无关联图片</p>}
        </Panel>
      </div>
    </div>
  );
}
