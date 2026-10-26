import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { ImageDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { traitByMaterial } from "@/lib/mock";

/* ---------- 模拟原始数据（确定性随机，同一材料每次一致） ---------- */
export const TRAITS = ["株高", "穗长", "千粒重"] as const;
export type Trait = (typeof TRAITS)[number];
export const YEARS = ["2023", "2024", "2025"];
export const SITES = ["郑州", "新乡"];

function rand(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
export type RawRow = { material: string; year: string; site: string; rep: number; plot: string; 株高: number; 穗长: number; 千粒重: number };
const cache = new Map<string, RawRow[]>();
/** 每个材料：3 年 × 2 地点 × 3 重复 = 18 条原始记录 */
export function rawRows(material: string): RawRow[] {
  if (cache.has(material)) return cache.get(material)!;
  const base = traitByMaterial.find((r) => r.material === material) ?? { 株高: 80, 穗长: 9, 千粒重: 43 };
  const r = rand(material);
  const rows: RawRow[] = [];
  YEARS.forEach((year, yi) => SITES.forEach((site, si) => [1, 2, 3].forEach((rep) => {
    const env = (yi - 1) * 1.2 + (si ? -1.5 : 0.8);
    const n = () => (r() + r() + r() - 1.5) * 2;
    rows.push({ material, year, site, rep, plot: `${"ABC"[yi]}${si + 1}${String(rep).padStart(2, "0")}`,
      株高: +(base.株高 + env + n() * 1.6).toFixed(1), 穗长: +(base.穗长 + env * 0.1 + n() * 0.25).toFixed(1), 千粒重: +(base.千粒重 - env * 0.3 + n() * 0.9).toFixed(1) });
  })));
  cache.set(material, rows);
  return rows;
}
export function stats(vals: number[]) {
  const n = vals.length;
  const mean = n ? vals.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const s = [...vals].sort((a, b) => a - b);
  const q = (p: number) => { if (!n) return 0; const i = (n - 1) * p, lo = Math.floor(i); return s[lo]! + (s[Math.ceil(i)]! - s[lo]!) * (i - lo); };
  return { n, mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: s[0] ?? 0, max: s[n - 1] ?? 0, q1: +q(0.25).toFixed(2), median: +q(0.5).toFixed(2), q3: +q(0.75).toFixed(2) };
}

/* ---------- 悬停提示：数值 + 标准差 + 样本量 ---------- */
type TipPayload = { name?: string; value?: number; color?: string; payload?: Record<string, unknown> };
export function StatTooltip({ active, payload, label, info, hint = "点击查看原始数据" }: { hint?: string; active?: boolean; payload?: TipPayload[]; label?: string | number; info: (p: TipPayload) => { sd?: number; n?: number; extra?: string } }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover text-popover-foreground shadow-lift px-3 py-2 text-xs space-y-1.5">
      {label !== undefined && <p className="font-semibold">{label}</p>}
      {payload.map((p, i) => {
        const x = info(p);
        return (
          <div key={i}>
            <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}：<b className="font-display">{p.value}</b></p>
            <p className="text-muted-foreground pl-3.5">{x.sd !== undefined && <>标准差 ±{x.sd} · </>}{x.n !== undefined && <>样本量 n={x.n}</>}{x.extra}</p>
          </div>
        );
      })}
      <p className="text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ---------- 导出图片 / CSV ---------- */
function download(name: string, href: string) {
  const a = document.createElement("a"); a.href = href; a.download = name; a.click();
}
export function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.error("没有可导出的数据"); return; }
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = "\uFEFF" + [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  download(`${name}.csv`, url); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success(`已导出 ${name}.csv`);
}
export function exportPng(name: string, box: HTMLElement | null) {
  const svg = box?.querySelector("svg");
  if (!svg) { toast.error("未找到图表"); return; }
  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width)); clone.setAttribute("height", String(height));
  // 内联 CSS 变量颜色，导出后仍保持配色
  const cs = getComputedStyle(document.documentElement);
  const src = new XMLSerializer().serializeToString(clone).replace(/var\((--[\w-]+)\)/g, (_, v: string) => cs.getPropertyValue(v).trim() || "#888");
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); const s = 2;
    c.width = width * s; c.height = height * s;
    const ctx = c.getContext("2d")!; ctx.fillStyle = cs.getPropertyValue("--card").trim() || "white"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.scale(s, s); ctx.drawImage(img, 0, 0);
    download(`${name}.png`, c.toDataURL("image/png")); toast.success(`已导出 ${name}.png`);
  };
  img.onerror = () => toast.error("导出图片失败");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
}

/** 图表容器：右上角【导出图片】【导出CSV数据】 */
export function ChartBox({ name, csv, className = "h-72", wrapperClassName, children }: { name: string; csv: () => Record<string, unknown>[]; className?: string; wrapperClassName?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={wrapperClassName}>
      <div className="flex justify-end gap-1.5 mb-1">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => exportPng(name, ref.current)}><ImageDown />导出图片</Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => exportCsv(name, csv())}><FileDown />导出CSV数据</Button>
      </div>
      <div ref={ref} className={className}>{children}</div>
    </div>
  );
}

/* ---------- 箱线图（SVG） ---------- */
export function BoxPlot({ data, unit = "" }: { data: { label: string; s: ReturnType<typeof stats>; points: number[] }[]; unit?: string }) {
  const W = 520, H = 260, L = 44, B = 28, T = 12;
  const all = data.flatMap((d) => [d.s.min, d.s.max]);
  if (!all.length) return <p className="text-sm text-muted-foreground py-10 text-center">筛选条件下无数据</p>;
  const lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const bw = (W - L) / data.length;
  const ticks = Array.from({ length: 5 }, (_, i) => +(lo + ((hi - lo) * i) / 4).toFixed(1));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {ticks.map((t) => <g key={t}><line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 3" /><text x={L - 6} y={y(t) + 4} fontSize="11" textAnchor="end" fill="var(--muted-foreground)">{t}</text></g>)}
      {data.map((d, i) => {
        const cx = L + bw * i + bw / 2, w = Math.min(46, bw * 0.45);
        return (
          <g key={d.label}>
            <title>{`${d.label}\n中位数 ${d.s.median}${unit}  Q1 ${d.s.q1}  Q3 ${d.s.q3}\n最小 ${d.s.min}  最大 ${d.s.max}  n=${d.s.n}`}</title>
            <line x1={cx} x2={cx} y1={y(d.s.max)} y2={y(d.s.min)} stroke="var(--foreground)" />
            <line x1={cx - w / 4} x2={cx + w / 4} y1={y(d.s.max)} y2={y(d.s.max)} stroke="var(--foreground)" />
            <line x1={cx - w / 4} x2={cx + w / 4} y1={y(d.s.min)} y2={y(d.s.min)} stroke="var(--foreground)" />
            <rect x={cx - w / 2} y={y(d.s.q3)} width={w} height={Math.max(1, y(d.s.q1) - y(d.s.q3))} fill="var(--chart-1)" fillOpacity={0.35} stroke="var(--chart-1)" rx={3} />
            <line x1={cx - w / 2} x2={cx + w / 2} y1={y(d.s.median)} y2={y(d.s.median)} stroke="var(--chart-1)" strokeWidth={2.5} />
            {d.points.map((p, j) => <circle key={j} cx={cx + ((j % 5) - 2) * 3} cy={y(p)} r={2} fill="var(--chart-3)" fillOpacity={0.7} />)}
            <text x={cx} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--muted-foreground)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
