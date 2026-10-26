import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import chinaData from "@/data/china-provinces.json";
import { typeShare } from "@/lib/mock";

/* ---------- 数量统计：按年份 × 分类（演示数据） ---------- */
const yearFactor: Record<string, number> = { "2023": 0.28, "2024": 0.33, "2025": 0.39 };
const catMeta: Record<string, { mats: number; rec: number; miss: number; ex: string }> = {
  形态性状: { mats: 3.2, rec: 260, miss: 1.2, ex: "株高、穗长、叶面积、茎粗" },
  产量性状: { mats: 4.1, rec: 300, miss: 2.1, ex: "千粒重、穗粒数、单株产量" },
  生理生化: { mats: 2.6, rec: 180, miss: 2.8, ex: "SPAD、净光合速率、可溶性糖" },
  抗逆性状: { mats: 3.6, rec: 210, miss: 1.9, ex: "抗旱指数、褐飞虱抗性评分" },
  品质性状: { mats: 2.9, rec: 150, miss: 1.4, ex: "蛋白质含量、湿面筋、直链淀粉" },
};
export function statByYear(year: string) {
  const f = year === "all" ? 1 : yearFactor[year] ?? 1;
  return typeShare.map((d, i) => {
    const m = catMeta[d.name]!;
    const phenos = Math.max(1, Math.round(d.value * f));
    const adj = year === "all" ? 0 : (Number(year) - 2024) * 0.3;
    return { name: d.name, phenos, materials: Math.round(phenos * m.mats * 2.1), records: Math.round(phenos * m.rec * (1 + i * 0.05)), missing: +Math.max(0.3, m.miss - adj).toFixed(1), examples: m.ex };
  });
}

/* ---------- 地区管理 ---------- */
export type Site = { name: string; lon: number; lat: number; files: number; materials: number; images: number; trait: string; climate: string; trials: { name: string; design: string; status: string }[] };
export const regionSites: Site[] = [
  { name: "河南 · 郑州", lon: 113.65, lat: 34.76, files: 46, materials: 168, images: 1820, trait: "株高均值 81.6 cm", climate: "暖温带大陆性季风气候",
    trials: [{ name: "2024 郑州小麦区试", design: "随机区组 3 重复", status: "已完成" }, { name: "2025 郑州密植试验", design: "裂区设计", status: "进行中" }, { name: "2026 郑州小麦区试", design: "随机区组 3 重复", status: "进行中" }] },
  { name: "河南 · 新乡", lon: 113.93, lat: 35.3, files: 28, materials: 96, images: 940, trait: "SPAD 均值 46.2", climate: "暖温带大陆性季风气候",
    trials: [{ name: "2025 新乡干旱胁迫", design: "裂区设计 2 处理", status: "进行中" }, { name: "2024 新乡抗旱鉴定", design: "完全随机", status: "已完成" }] },
  { name: "江苏 · 扬州", lon: 119.41, lat: 32.39, files: 19, materials: 72, images: 1160, trait: "抗性评分 3.1", climate: "亚热带季风气候",
    trials: [{ name: "2025 扬州褐飞虱抗性", design: "完全随机 4 重复", status: "进行中" }] },
  { name: "北京 · 海淀", lon: 116.3, lat: 39.96, files: 12, materials: 54, images: 610, trait: "穗长均值 18.4 cm", climate: "暖温带半湿润季风气候",
    trials: [{ name: "2024 海淀玉米自交系", design: "随机区组 2 重复", status: "已完成" }, { name: "2025 龙门架表型平台", design: "完全随机", status: "进行中" }] },
];

// Province GeoJSON: DataV public administrative boundaries, bundled locally.
const geography = chinaData as FeatureCollection;
const projection = geoMercator().fitExtent([[20, 12], [620, 420]], geography);
const provincePath = geoPath(projection);
export function ChinaMap({ sites, selected, onSelect }: { sites: Site[]; selected: string; onSelect: (name: string) => void }) {
  const max = Math.max(1, ...sites.map(s => s.files));
  return <svg role="img" aria-label="中国省界与试验地点地图" viewBox="0 0 640 445" className="h-auto w-full">
    {geography.features.map((feature, i) => <path key={i} d={provincePath(feature) ?? ""} fill="var(--map-land)" stroke="var(--map-border)" strokeWidth={0.7}><title>{String(feature.properties?.["name"] ?? "")}</title></path>)}
    {sites.map((s, i) => {
      const point = projection([s.lon, s.lat]);
      if (!point) return null;
      const [x, y] = point;
      const r = 5 + Math.sqrt(s.files / max) * 8;
      const active = s.name === selected;
      const left = s.name.includes("郑州");
      const offsetY = s.name.includes("新乡") ? -20 : s.name.includes("郑州") ? 16 : 0;
      const labelX = x + (left ? -22 : 22);
      const labelY = y + offsetY;
      return <g key={s.name} role="button" tabIndex={0} aria-label={s.name} aria-pressed={active} className="cursor-pointer outline-none" onClick={() => onSelect(s.name)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.name); } }}>
        <title>{`${s.name}：${s.files} 个文件 · ${s.images} 张图片`}</title>
        {active && <circle cx={x} cy={y} r={r + 4} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />}
        <circle cx={x} cy={y} r={r} fill={`var(--chart-${i % 5 + 1})`} fillOpacity={0.9} stroke="var(--card)" strokeWidth={1.5} />
        <line x1={x} y1={y} x2={labelX} y2={labelY} stroke="var(--muted-foreground)" strokeWidth={0.7} />
        <text x={labelX + (left ? -3 : 3)} y={labelY + 4} fontSize={12} textAnchor={left ? "end" : "start"} fill="var(--foreground)" stroke="var(--card)" strokeWidth={3} paintOrder="stroke" fontWeight={active ? 700 : 500}>{s.name.split(" · ")[1]}</text>
      </g>;
    })}
    <text x={20} y={438} fontSize={9} fill="var(--muted-foreground)">省界数据：DataV · 地点气泡按文件数缩放</text>
  </svg>;
}
