import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Img } from "@/store";
import { ChartBox, StatTooltip } from "./analysisKit";
import { countImages } from "./analysisScope";
import { Panel } from "./ui";

export function ImageAnalysisCharts({ images }: { images: Img[] }) {
  const materials = countImages(images, im => im.variety || "未关联材料");
  const labels = countImages(images, im => im.label || "未标注");
  return <div className="grid gap-5 lg:grid-cols-2">
    <Panel title="各材料图片数量"><ChartBox name="材料图片数量" csv={() => materials.map(r => ({ 材料: r.name, 图片数量: r.value }))}>
      <ResponsiveContainer><BarChart data={materials} margin={{ left: 8, right: 16, bottom: 50 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} tickFormatter={name => name.length > 18 ? name.slice(0, 18) + "…" : name} /><YAxis allowDecimals={false} /><Tooltip content={<StatTooltip hint="" info={() => ({})} />} /><Bar name="图片数量" dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
    </ChartBox></Panel>
    <Panel title="图片标签分布"><ChartBox name="图片标签分布" csv={() => labels.map(r => ({ 标签: r.name, 数量: r.value }))}>
      <ResponsiveContainer><PieChart><Pie data={labels} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="68%" label>{labels.map((r, i) => <Cell key={r.name} fill={`var(--chart-${i % 5 + 1})`} />)}</Pie><Tooltip content={<StatTooltip hint="" info={() => ({})} />} /><Legend /></PieChart></ResponsiveContainer>
    </ChartBox></Panel>
  </div>;
}