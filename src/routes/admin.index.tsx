import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/workbench/NodeDialogs";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Database, Images, Leaf, ClipboardCheck, AlertTriangle, BookMarked, Users, Activity, LineChart as LC, FlaskConical, Sprout, Tags, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, StatCard, TaskModule } from "@/components/workbench/ui";
import { uploadTrend } from "@/lib/mock";
import { filesStore, alertsStore, type AlertItem } from "@/store";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const [files] = filesStore.useStore();
  const pending = files.filter((f) => f.status === "待审核");
  const [alerts, setAlerts] = alertsStore.useStore();
  const [ignore, setIgnore] = useState<AlertItem | null>(null);
  const alertLink = (a: AlertItem) => {
    const cls = "flex-1 min-w-0 cursor-pointer hover:underline";
    if (a.id === "missing") return <Link to="/admin/data" search={{ file: 10236, action: "missing" }} className={cls}>{a.text}</Link>;
    if (a.id === "ndvi") return <Link to="/admin/analysis" search={{ tab: "stat", file: "maize_density_2025_ndvi.csv" }} className={cls}>{a.text}</Link>;
    return <Link to="/admin/images" search={{ node: "i3", issue: "blur" }} className={cls}>{a.text}</Link>;
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">管理员工作台</h1><p className="text-sm text-muted-foreground mt-1">数据概览 · 统计截至 2026-10-06</p></div>
        <Button asChild><Link to="/admin/review"><ClipboardCheck />去审核</Link></Button>
      </div>
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard to="/admin/data" icon={Database} label="表型文件总数" value="1,286" unit="个" delta="较上月 +104" />
        <StatCard to="/admin/images" icon={Images} label="图片总数" value="48,930" unit="张" delta="较上月 +2,430" tone="info" />
        <StatCard to="/admin/analysis" search={{ tab: "material" }} icon={Leaf} label="材料数量" value="5,412" unit="份" delta="5 个物种" />
        <StatCard to="/admin/review" icon={ClipboardCheck} label="待审核数量" value={pending.length} unit="项" delta="表型文件" tone="warning" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="上传趋势（近 6 个月）">
          <div className="h-72"><ResponsiveContainer><LineChart data={uploadTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" /><YAxis yAxisId="l" /><YAxis yAxisId="r" orientation="right" /><Tooltip /><Legend />
            <Line yAxisId="l" type="monotone" dataKey="表型文件" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="r" type="monotone" dataKey="图片" stroke="var(--chart-3)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="数据资产概览" extra={<Link to="/admin/metadata" className="text-sm text-primary">管理</Link>}>
          <div className="divide-y text-sm">
            {[
              { icon: Database, label: "表型数据文件", value: "1,286", to: "/admin/data" },
              { icon: Images, label: "表型图片", value: "48,930", to: "/admin/images" },
              { icon: Sprout, label: "研究材料", value: "5,412", to: "/admin/analysis" },
              { icon: FlaskConical, label: "在研试验", value: "36", to: "/admin/analysis" },
              { icon: Tags, label: "性状指标", value: "87", to: "/admin/metadata" },
              { icon: Mountain, label: "试验地点", value: "18", to: "/admin/analysis" },
            ].map(({ icon: Icon, label, value, to }) => (
              <Link key={label} to={to as never} className="flex items-center justify-between py-2.5 hover:text-primary transition-colors">
                <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" />{label}</span>
                <span className="font-semibold font-display">{value}</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="待审核的表型数据" extra={<Link to="/admin/review" className="text-sm text-primary">全部</Link>} className="flex flex-col">
          {pending.length === 0 ? <p className="py-6 flex-1 grid place-items-center text-sm text-muted-foreground">暂无待审核的表型数据</p> : <ul className="divide-y text-sm flex-1 content-start">{pending.map((f) => <li key={f.id} className="py-2.5"><p className="truncate">{f.name}</p><p className="text-xs text-muted-foreground">{f.owner} · {f.date}</p></li>)}</ul>}
          <Link to="/admin/review" className="mt-auto pt-3 text-xs text-muted-foreground hover:text-primary transition-colors">共 {pending.length} 条待审核 · 去处理 →</Link>
        </Panel>
        <Panel title="待审核的图片" extra={<Link to="/admin/review" className="text-sm text-primary">全部</Link>} className="flex flex-col">
          <ul className="divide-y text-sm flex-1 content-start">{[["水稻虫害 · 120 张", "李明"], ["实验田一 · 64 张", "王芳"], ["test11 · 32 张", "曾老师"]].map(([a, b]) => <li key={a} className="py-2.5"><p>{a}</p><p className="text-xs text-muted-foreground">{b} 提交</p></li>)}</ul>
          <Link to="/admin/review" className="mt-auto pt-3 text-xs text-muted-foreground hover:text-primary transition-colors">共 216 张待审核 · 去处理 →</Link>
        </Panel>
        <Panel title="异常预警" className="flex flex-col">
          {alerts.length === 0 ? <p className="py-6 flex-1 grid place-items-center text-sm text-muted-foreground">暂无异常预警</p> : <ul className="space-y-2 text-sm flex-1 content-start">{alerts.map((a) => <li key={a.id} className="flex items-start gap-2 rounded-xl bg-destructive/5 p-2.5"><AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />{alertLink(a)}<button className="text-xs text-muted-foreground hover:text-foreground shrink-0" onClick={() => setIgnore(a)}>忽略</button></li>)}</ul>}
          <ConfirmDialog open={!!ignore} title="确认忽略该预警？" desc={ignore?.text} confirmText="忽略" onClose={() => setIgnore(null)}
            onConfirm={() => { setAlerts(alerts.filter((x) => x.id !== ignore?.id)); setIgnore(null); toast.success("已忽略该预警"); }} />
        </Panel>
      </div>
      <div>
        <h2 className="font-semibold mb-3">任务模块</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TaskModule to="/admin/review" icon={ClipboardCheck} title="数据审核 / 清洗 / 归档" desc="审核用户上传的表型、图片，去重、修正、合并、归档" />
          <TaskModule to="/admin/data" icon={Database} title="表型数据" desc="全部文件增删改查与公开控制" />
          <TaskModule to="/admin/images" icon={Images} title="表型图片" desc="节点管理、自动上传、批量操作" />
          <TaskModule to="/admin/analysis" icon={LC} title="表型分析" desc="性状、多试验、地区、系谱分析" />
          <TaskModule to="/admin/metadata" icon={BookMarked} title="基本信息（元数据）" desc="物种、群体、性状、环境因子" />
          <TaskModule to="/admin/system" search={{ tab: "users" }} icon={Users} title="系统管理" desc="用户、角色、菜单、部门、岗位、字典" />
          <TaskModule to="/admin/monitor" icon={Activity} title="运维监控" desc="存储、接口、登录日志与异常" />
        </div>
      </div>
    </div>
  );
}
