import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HardDrive, Server, Gauge, AlertOctagon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/workbench/ui";
import { monitorStore, canRetryEndpoint, completeDemoRetry, refreshMonitorSnapshot, demoPerformanceTrend } from "@/store/monitor";
import { logAction } from "@/store";
import { useMonitorRefresh } from "@/hooks/use-monitor-refresh";

export const Route = createFileRoute("/admin/monitor")({
  head: () => ({ meta: [
    { title: "运维监控 — 作物表型管理平台" },
    { name: "description", content: "查看平台接口状态、异常日志和存储分布，管理监控刷新与接口重试。" },
    { property: "og:title", content: "运维监控 — 作物表型管理平台" },
    { property: "og:description", content: "作物表型管理平台的运维状态与异常处理。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Monitor,
});

const storage = [{ name: "原图", percent: 62 }, { name: "缩略图", percent: 8 }, { name: "表型文件", percent: 5 }, { name: "备份", percent: 21 }, { name: "回收站", percent: 4 }];

function Monitor() {
  const [state, setState] = monitorStore.useStore();
  const [drawer, setDrawer] = useState<"logs" | "storage" | "endpoint" | "availability" | "response" | null>(null);
  const performanceView = drawer === "availability" || drawer === "response";
  const [endpointPath, setEndpointPath] = useState<string | null>(null);
  const selectedEndpoint = state.endpoints.find((endpoint) => endpoint.path === endpointPath);
  const endpointLogs = state.logs.filter((log) => log.endpoint === endpointPath);
  const [retrying, setRetrying] = useState<string | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useMonitorRefresh(state.autoRefresh, refreshMonitorSnapshot);
  useEffect(() => {
    refreshMonitorSnapshot();
    return () => { if (retryTimer.current !== null) clearTimeout(retryTimer.current); };
  }, []);

  function retry(path: string) {
    if (retryTimer.current !== null) return;
    setRetrying(path);
    retryTimer.current = setTimeout(() => {
      if (completeDemoRetry(path)) {
        logAction(`运维监控：模拟重试 ${path}，连接恢复`, "成功", "admin");
        toast.success("模拟重试成功，接口状态已更新");
      } else toast.error("当前接口无需重试");
      setRetrying(null);
      retryTimer.current = null;
    }, 800);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="运维监控" desc="数据量、存储、接口与异常" actions={<>
        <label className="flex items-center gap-2 text-sm"><Switch checked={state.autoRefresh} onCheckedChange={(autoRefresh) => setState((prev) => ({ ...prev, autoRefresh }))} aria-label="自动刷新（每30秒）" />自动刷新（30秒）</label>
        <Button onClick={() => { refreshMonitorSnapshot(); toast.success("监控快照已刷新"); }}><RefreshCw className="h-4 w-4" />刷新</Button>
      </>} />
      <div className="flex justify-end text-xs text-muted-foreground">
        <span aria-live="polite">最近刷新：{state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString("zh-CN", { hour12: false }) : "—"}</span>
      </div>
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HardDrive} label="存储使用" value="1.56" unit="TB / 2 TB" delta="78%" tone="warning" onClick={() => setDrawer("storage")} />
        <StatCard icon={Server} label="接口可用率" value="99.92" unit="%" delta="近 30 天" onClick={() => setDrawer("availability")} />
        <StatCard icon={Gauge} label="平均响应" value={182} unit="ms" tone="info" onClick={() => setDrawer("response")} />
        <StatCard icon={AlertOctagon} label="今日异常" value={state.logs.length} unit="次" delta={`待处理 ${state.logs.filter((log) => !log.resolved).length} 次`} tone="destructive" onClick={() => setDrawer("logs")} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="存储分布" extra={<Button variant="outline" size="sm" onClick={() => setDrawer("storage")}>查看详情</Button>}>
          {storage.map(({ name, percent }) => (
            <div key={name} className="mb-3"><div className="flex justify-between text-sm mb-1"><span>{name}</span><span className="font-display">{percent}%</span></div><Progress value={percent} /></div>
          ))}
        </Panel>
        <Panel title="接口状态">
          <ul className="divide-y text-sm">{state.endpoints.map((endpoint) => <li key={endpoint.path} className="py-2.5 flex flex-wrap items-center gap-3">
            <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start gap-3 px-0 py-2 text-left" aria-label={`查看接口记录 ${endpoint.path}`} onClick={() => { setEndpointPath(endpoint.path); setDrawer("endpoint"); }}>
              <code className="min-w-0 flex-1 whitespace-normal break-all font-mono text-xs">{endpoint.path}</code>
              <span className="shrink-0 text-xs text-muted-foreground">{endpoint.response}</span>
              <StatusBadge status={retrying === endpoint.path ? "进行中" : endpoint.status} />
            </Button>
            <div className="w-20">{canRetryEndpoint(endpoint) && <Button size="sm" variant="outline" disabled={retrying !== null} onClick={() => retry(endpoint.path)}><RefreshCw className={`h-3.5 w-3.5 ${retrying === endpoint.path ? "motion-safe:animate-spin" : ""}`} />{retrying === endpoint.path ? "重试中" : "重试"}</Button>}</div>
          </li>)}</ul>
        </Panel>
      </div>
      <Sheet open={drawer !== null} onOpenChange={(open) => { if (!open) setDrawer(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{drawer === "logs" ? "今日异常日志" : drawer === "endpoint" ? "接口请求记录" : drawer === "availability" ? "近期接口可用率趋势" : drawer === "response" ? "近期接口响应趋势" : "存储详情"}</SheetTitle>
            <SheetDescription>{performanceView ? "近30天性能趋势（示例数据），尚未接入真实监控服务。" : drawer === "logs" ? "演示异常记录及处理状态" : drawer === "endpoint" ? "示例接口状态及关联请求记录，尚未接入真实请求日志。" : "演示存储使用量：1.56 TB / 2 TB，剩余 0.44 TB"}</SheetDescription>
          </SheetHeader>
          {performanceView ? <div className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">{drawer === "availability" ? "当前可用率" : "当前平均响应"}<strong className="ml-3 text-2xl text-foreground">{drawer === "availability" ? "99.92%" : "182 ms"}</strong></p>
            <div className="h-64 w-full min-w-0" aria-label={drawer === "availability" ? "接口可用率趋势图" : "接口响应时间趋势图"}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoPerformanceTrend} margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="period" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} minTickGap={16} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} width={64} domain={drawer === "availability" ? [99.8, 100] : [0, "auto"]} unit={drawer === "availability" ? "%" : "ms"} />
                  <Tooltip formatter={(value: number) => [drawer === "availability" ? `${value.toFixed(2)}%` : `${value} ms`, drawer === "availability" ? "可用率" : "平均响应"]} />
                  <Line type="monotone" dataKey={drawer === "availability" ? "availability" : "response"} stroke={drawer === "availability" ? "var(--primary)" : "var(--info)"} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-sm"><thead><tr className="border-b text-muted-foreground"><th className="py-2 text-left font-medium">时间</th><th className="py-2 text-right font-medium">{drawer === "availability" ? "可用率" : "平均响应"}</th></tr></thead><tbody>{demoPerformanceTrend.map((point) => <tr key={point.period} className="border-b"><td className="py-2">{point.period}</td><td className="py-2 text-right">{drawer === "availability" ? `${point.availability.toFixed(2)}%` : `${point.response} ms`}</td></tr>)}</tbody></table>
          </div> : drawer === "logs" ? <ul className="mt-6 divide-y">{state.logs.map((log) => <li key={log.id} className="space-y-2 py-4">
            <div className="flex justify-between gap-2"><time className="text-xs text-muted-foreground">{log.time}</time><StatusBadge status={log.resolved ? "已完成" : "失败"} /></div>
            <code className="block break-all text-sm">{log.endpoint}</code>
            <p className="text-sm text-muted-foreground">{log.message}</p>
            {log.resolved && <p className="text-xs text-primary">模拟重试已恢复连接，原始报错保留。</p>}
          </li>)}</ul> : drawer === "endpoint" && selectedEndpoint ? <div className="mt-6 space-y-5">
            <code className="block break-all text-sm">{selectedEndpoint.path}</code>
            <dl className="divide-y text-sm">
              <div className="flex justify-between gap-3 py-3"><dt className="text-muted-foreground">当前状态</dt><dd><StatusBadge status={retrying === selectedEndpoint.path ? "进行中" : selectedEndpoint.status} /></dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-muted-foreground">响应时间</dt><dd>{selectedEndpoint.response}</dd></div>
              <div className="flex justify-between gap-3 py-3"><dt className="text-muted-foreground">最近刷新</dt><dd>{state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString("zh-CN", { hour12: false }) : "—"}</dd></div>
            </dl>
            <h3 className="text-sm font-semibold">关联请求记录</h3>
            {endpointLogs.length ? <ul className="divide-y">{endpointLogs.map((log) => <li key={log.id} className="space-y-2 py-3">
              <div className="flex justify-between gap-2"><time className="text-xs text-muted-foreground">{log.time}</time><StatusBadge status={log.resolved ? "已完成" : "失败"} /></div>
              <p className="text-sm text-muted-foreground">{log.message}</p>
              {log.resolved && <p className="text-xs text-primary">模拟重试已恢复连接。</p>}
            </li>)}</ul> : <p className="text-sm text-muted-foreground">暂无关联异常请求记录。</p>}
            {canRetryEndpoint(selectedEndpoint) && <Button disabled={retrying !== null} onClick={() => retry(selectedEndpoint.path)}><RefreshCw className="h-4 w-4" />{retrying === selectedEndpoint.path ? "重试中" : "重试"}</Button>}
          </div> : <div className="mt-6 divide-y">{storage.map(({ name, percent }) => <div key={name} className="flex items-center justify-between gap-3 py-4 text-sm"><span>{name}</span><span>{(1.56 * 1000 * percent / 100).toFixed(1)} GB <span className="text-muted-foreground">（{percent}%）</span></span></div>)}</div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
