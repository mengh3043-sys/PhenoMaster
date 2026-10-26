import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { CalendarIcon, Download, RotateCcw, ZoomIn, Images, Sprout, TrendingUp, TriangleAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { exportCsv, exportPng } from "./analysisKit";
import { ALL_IMAGES_NODE, multiDirectoryStatisticsScope, statisticsNodesStore, directoryStatisticsRecords, statisticsRecords, STATISTICS_DEFAULT_RANGE, summarizeStatistics } from "@/store/imageStatistics";
import { imagesStore, imageTreeStore, lastNodeStore } from "@/store";
import { StatisticsDirectoryTree } from "./StatisticsDirectoryTree";
import { cn } from "@/lib/utils";

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
function VarietyTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const name = payload?.value ?? "";
  return <g transform={`translate(${x},${y})`}><text transform="rotate(-45)" textAnchor="end" dy={12} fill="var(--muted-foreground)" fontSize={11}><title>{name}</title>{name.length > 22 ? `${name.slice(0, 22)}…` : name}</text></g>;
}
function ChartTooltip({ active, payload, label, bar = false }: { active?: boolean; payload?: readonly { name?: string; value?: number; color?: string; payload?: { name: string; project: string } }[]; label?: string; bar?: boolean }) {
  if (!active || !payload?.length) return null;
  return <div className="max-w-72 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-card">
    <p className="mb-2 font-semibold break-words">{bar ? payload[0]?.payload?.name : label}</p>
    {bar ? <><p>图片数量：<strong>{payload[0]?.value} 张</strong></p><p className="mt-2 text-muted-foreground">目录：{payload[0]?.payload?.project}</p></> : payload.map((p) => <p key={p.name} className="flex items-center justify-between gap-6 py-1"><span>{p.name}</span><strong>{p.value} 张</strong></p>)}
  </div>;
}

export function ImageStatistics({ role = "user" }: { role?: "user" | "admin" }) {
  const [byNode] = imagesStore.useStore();
  const [tree] = imageTreeStore.useStore();
  const [lastNodes] = lastNodeStore.useStore();
  const [selectedNodes, setSelectedNodes] = statisticsNodesStore.useStore();
  useEffect(() => { if (selectedNodes.length === 0) setSelectedNodes([lastNodes[`${role}:images`] ?? ALL_IMAGES_NODE]); }, []);
  const selectionKey = selectedNodes.join("|");
  const scope = useMemo(() => multiDirectoryStatisticsScope(byNode, tree, selectedNodes), [byNode, tree, selectedNodes]);
  const images = scope.images;
  const statisticsVarieties = scope.groups.map((g, i) => ({ id: g.id, name: g.name, label: g.name, project: scope.name, color: `var(--chart-${i % 5 + 1})`, tone: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][i % 5] ?? "bg-chart-1" }));
  const [range, setRange] = useState<DateRange | undefined>({ from: parseISO(STATISTICS_DEFAULT_RANGE.from), to: parseISO(STATISTICS_DEFAULT_RANGE.to) });
  const [hidden, setHidden] = useState<string[]>([]);
  const [zoom, setZoom] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const from = range?.from ? format(range.from, "yyyy-MM-dd") : STATISTICS_DEFAULT_RANGE.from;
  const to = range?.to ? format(range.to, "yyyy-MM-dd") : from;
  const summary = useMemo(() => summarizeStatistics(statisticsRecords(images, from, to), from, to), [images, from, to]);
  const directoryRecords = useMemo(() => directoryStatisticsRecords(scope.groups, from, to), [scope, from, to]);
  useEffect(() => { setHidden([]); }, [selectionKey]);
  const totals = statisticsVarieties.map((v) => ({ ...v, count: directoryRecords.filter((r) => r.varietyId === v.id).reduce((s, r) => s + r.count, 0) }));
  const rows = useMemo(() => {
    const days = new Map<string, Record<string, string | number>>();
    for (const r of directoryRecords) {
      const day = days.get(r.date) ?? { date: r.date };
      day[r.varietyId] = r.count;
      days.set(r.date, day);
    }
    return [...days.values()].sort((a, b) => String(a["date"]).localeCompare(String(b["date"])));
  }, [directoryRecords]);
  const toggle = (id: string) => setHidden((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  const kpis = [
    { kind: "total", label: "总图片数", value: summary.total.toLocaleString(), unit: "张", icon: Images, tone: "text-primary bg-primary-soft" },
    { kind: "varieties", label: "涉及品种数", value: summary.varieties, unit: "个", icon: Sprout, tone: "text-info bg-info/10" },
    { kind: "daily", label: "平均每日新增", value: summary.average.toFixed(2), unit: "张 / 天", icon: TrendingUp, tone: "text-primary bg-primary-soft" },
    { kind: "abnormal", label: "异常图片数", value: summary.abnormal, unit: "张", icon: TriangleAlert, tone: "text-destructive bg-destructive/10" },
  ] as const;
  const legend = <ul className="flex flex-wrap gap-1 max-h-56 overflow-y-auto lg:w-36 lg:shrink-0 lg:flex-col" aria-label="目录图例">{statisticsVarieties.map((v) => <li key={v.id}><Button variant="ghost" size="sm" aria-label={`显示或隐藏${v.label}`} aria-pressed={!hidden.includes(v.id)} title={v.name} onClick={() => toggle(v.id)} className={cn("h-auto min-h-9 w-full justify-start gap-2 px-2 text-xs font-normal whitespace-normal text-left", hidden.includes(v.id) && "opacity-40")}><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", v.tone)} /><span className={cn(hidden.includes(v.id) && "line-through")}>{v.name}</span></Button></li>)}</ul>;
  const lineChart = (height: number) => <ResponsiveContainer width="100%" height={height}><LineChart data={rows} margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
    <CartesianGrid vertical={false} stroke="var(--border)" />
    <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={32} interval="preserveStartEnd" height={40} />
    <YAxis domain={[0, (max: number) => Math.max(8, Math.ceil(max / 2) * 2)]} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={30} />
    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }} />
    {statisticsVarieties.map((v) => <Line key={v.id} name={v.label} dataKey={v.id} hide={hidden.includes(v.id)} type="monotone" stroke={v.color} strokeWidth={2} dot={{ r: 2.5, fill: v.color, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />)}
  </LineChart></ResponsiveContainer>;

  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">表型图片可视化 <span className="ml-2 align-middle rounded border px-2 py-0.5 text-xs font-normal text-muted-foreground">演示数据</span></h1></div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">日期选择：</span><Popover><PopoverTrigger asChild><Button variant="outline" aria-label="选择日期范围" className="max-w-full justify-start bg-card text-xs sm:text-sm"><CalendarIcon className="h-4 w-4 shrink-0" />{from} 至 {range?.to ? to : "选择结束日期"}</Button></PopoverTrigger><PopoverContent align="end" className="w-auto p-0"><Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={range?.from ?? parseISO(STATISTICS_DEFAULT_RANGE.from)} locale={zhCN} captionLayout="dropdown" startMonth={new Date(2020, 0)} endMonth={new Date(2030, 11)} className="pointer-events-auto p-3" /></PopoverContent></Popover></div>
    </div>
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row">
      <StatisticsDirectoryTree tree={tree} selected={selectedNodes} onChange={setSelectedNodes} />
      <div className="min-w-0 flex-1 space-y-4">
      <h2 className="font-semibold" aria-label="当前统计目录">{scope.name}</h2>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{kpis.map(({ kind, label, value, unit, icon: Icon, tone }) => <Button asChild variant="outline" key={label} className="h-auto justify-start gap-3 rounded-lg border bg-card p-4 text-left whitespace-normal shadow-none transition-all hover:bg-card hover:border-primary/40 hover:shadow-card motion-safe:hover:-translate-y-1"><Link to={role === "admin" ? "/admin/images/statistics/details" : "/user/images/statistics/details"} search={{ kind, from, to, node: selectionKey }} aria-label={`查看${label}明细`}><span className={cn("hidden h-10 w-10 shrink-0 place-items-center rounded-lg sm:grid", tone)}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 flex flex-wrap items-baseline gap-1.5 text-2xl font-semibold font-display">{value}<span className="text-xs font-normal text-muted-foreground">{unit}</span></p></div></Link></Button>)}</div>
    <section className="rounded-lg border bg-card p-4 sm:p-5" aria-label="图片数量统计">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 className="font-semibold">图片数量统计</h2><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="导出数量统计图片" title="导出图片" onClick={() => exportPng("图片数量统计", barRef.current)}><Download className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="导出数量统计CSV" title="导出 CSV" onClick={() => exportCsv("图片数量统计", totals.map((v) => ({ 目录: v.name, 图片数量: v.count, 上级目录: v.project })))}><span className="text-[10px] font-bold">CSV</span></Button></div></div>
      <div className="overflow-x-auto"><div ref={barRef} className={totals.length > 6 ? "min-w-[1200px]" : "min-w-[480px]"}><ResponsiveContainer width="100%" height={340}><BarChart data={totals} margin={{ top: 24, right: 18, bottom: 12, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={<VarietyTick />} interval={0} height={112} tickLine={false} axisLine={{ stroke: "var(--border)" }} /><YAxis tick={axisTick} domain={[0, (max: number) => Math.max(20, Math.ceil(max / 5) * 5)]} allowDecimals={false} tickLine={false} axisLine={false} width={35} /><Tooltip content={<ChartTooltip bar />} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="count" name="图片数量" radius={[3, 3, 0, 0]} maxBarSize={36} isAnimationActive={false}>{totals.map((v) => <Cell key={v.id} fill={v.color} />)}<LabelList dataKey="count" position="top" fill="var(--foreground)" fontSize={12} /></Bar>
      </BarChart></ResponsiveContainer></div></div>
    </section>
    <section className="rounded-lg border bg-card p-4 sm:p-5" aria-label="图片数量变化统计"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-semibold">图片数量变化统计</h2><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="放大查看" title="放大查看" onClick={() => setZoom(true)}><ZoomIn className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="导出变化统计图片" title="导出图片" onClick={() => exportPng("图片数量变化统计", lineRef.current)}><Download className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="导出变化统计CSV" title="导出 CSV" onClick={() => exportCsv("图片数量变化统计", directoryRecords.map((r) => ({ 日期: r.date, 目录: r.varietyName, 数量: r.count })))}><span className="text-[10px] font-bold">CSV</span></Button><Button size="icon" variant="ghost" className="h-8 w-8 transition-all hover:bg-primary-soft hover:text-primary hover:shadow-card motion-safe:hover:-translate-y-0.5" aria-label="刷新数据" title="刷新数据" onClick={() => { setHidden([]); toast.success("数据已刷新"); }}><RotateCcw className="h-4 w-4" /></Button></div></div><div ref={lineRef} className="flex min-w-0 flex-col gap-3 lg:flex-row">{legend}<div className="min-w-0 flex-1">{lineChart(270)}</div></div></section>
    </div></div>
    <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="max-w-5xl"><DialogTitle>图片数量变化统计</DialogTitle><DialogDescription>{from} 至 {to}</DialogDescription><div className="flex min-w-0 flex-col gap-3 lg:flex-row">{legend}<div className="min-w-0 flex-1">{lineChart(400)}</div></div></DialogContent></Dialog>
  </div>;
}
