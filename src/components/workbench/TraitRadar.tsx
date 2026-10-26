import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { normalizeIndicator } from "./traitComparison";

export type RadarIndicator = {
  trait: string;
  unit: string;
  max: number;
  current: number;
  population: number;
  currentStats: { mean: number; sd: number; n: number };
  populationStats: { mean: number; sd: number; n: number };
};

function RadarTooltip({ active, payload, material }: {
  active?: boolean;
  payload?: { payload?: RadarIndicator }[];
  material: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="rounded-lg border bg-popover text-popover-foreground shadow-card p-3 text-xs space-y-2">
    <p className="font-semibold">{point.trait}（{point.unit}）</p>
    <div><p className="text-chart-1 font-medium">当前材料 ({material})：{point.current}</p>
      <p>样本均值 {point.currentStats.mean} · 标准差 ±{point.currentStats.sd} · 样本量 n={point.currentStats.n}</p></div>
    <div><p className="text-chart-2 font-medium">群体均值：{point.population}</p>
      <p>样本均值 {point.populationStats.mean} · 标准差 ±{point.populationStats.sd} · 样本量 n={point.populationStats.n}</p></div>
  </div>;
}

/** Recharts uses a common drawing radius; each axis is normalized by its own physical maximum. */
export function TraitRadar({ material, indicators }: { material: string; indicators: RadarIndicator[] }) {
  const data = indicators.map((d) => ({ ...d,
    axis: `${d.trait} (${d.unit}，0–${d.max})`,
    currentRadius: normalizeIndicator(d.current, d.max),
    populationRadius: normalizeIndicator(d.population, d.max),
  }));
  return <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} outerRadius="65%" margin={{ top: 22, right: 24, bottom: 12, left: 24 }}>
      <PolarGrid stroke="var(--border)" />
      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
      <Radar name={`当前材料 (${material})`} dataKey="currentRadius" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.2} dot={{ r: 4 }} isAnimationActive={false} />
      <Radar name="群体均值" dataKey="populationRadius" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="6 4" fill="var(--chart-2)" fillOpacity={0} dot={{ r: 3 }} isAnimationActive={false} />
      <Tooltip content={<RadarTooltip material={material} />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </RadarChart>
  </ResponsiveContainer>;
}