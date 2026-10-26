import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ImagePlus, FlaskConical, Database, Images, LineChart, Sparkles, Leaf, ClipboardList, Clock, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, StatCard, StatusBadge, TaskModule } from "@/components/workbench/ui";
import { phenotypeFiles } from "@/lib/mock";
import { filesStore, noticeStore, profileStore } from "@/store";

export const Route = createFileRoute("/user/")({ component: UserHome });

function UserHome() {
  const mine = phenotypeFiles.slice(0, 5);
  const [profiles] = profileStore.useStore();
  const [files] = filesStore.useStore();
  const [notices] = noticeStore.useStore();
  const pendingFiles = files.filter((f) => f.status === "草稿" || f.status === "已驳回").length;
  const unreadFeedback = (notices.user ?? []).filter((n) => !n.read).length;
  const nick = profiles.user.nick || "老师";
  const greet = nick.endsWith("老师") ? nick : `${nick.charAt(0)}老师`;
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 flex flex-wrap items-center gap-6 shadow-lift">
        <div className="flex-1 min-w-60">
          <p className="text-sm opacity-80">下午好，</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{greet}，欢迎回来</h1>
          <p className="text-sm opacity-80 mt-2">{pendingFiles + unreadFeedback === 0 ? "目前没有待处理事项" : `你有 ${pendingFiles} 个文件待补充，${unreadFeedback} 条审核反馈未读。`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><Link to="/user/data"><Upload />上传表型数据</Link></Button>
          <Button asChild variant="secondary"><Link to="/user/images"><ImagePlus />上传图片</Link></Button>
          <Button asChild variant="secondary"><Link to="/user/trials" search={{ tab: "trial", create: "1" }}><FlaskConical />新建试验</Link></Button>
        </div>
      </section>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Leaf} to="/user/trials" search={{ tab: "mat" }} label="我的材料" value={128} unit="份" delta="本月 +12" />
        <StatCard icon={FlaskConical} to="/user/trials" search={{ tab: "trial" }} label="我的试验" value={3} unit="个" delta="2 个进行中" tone="info" />
        <StatCard icon={Database} to="/user/data" label="我的表型文件" value={46} unit="个" delta="已审核 41" />
        <StatCard icon={Images} to="/user/images" label="我的图片" value="3,812" unit="张" delta="本周 +420" tone="warning" />
      </div>

      <div>
        <h2 className="font-semibold mb-3">任务模块</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TaskModule to="/user/data" icon={Database} title="表型数据管理" desc="树状节点 · 上传、查询、修改、导出、预览 CSV" />
          <TaskModule to="/user/images" icon={Images} title="表型图片管理" desc="上传、查看高清大图、标注、批量管理" />
          <TaskModule to="/user/analysis" icon={LineChart} title="可视化分析" desc="性状分析、多试验分析、全局搜索" />
          <TaskModule to="/user/trials" icon={FlaskConical} title="我的材料 / 试验" desc="权限范围内的材料、试验设计与小区" />
          <TaskModule to="/user/breeding" icon={Sparkles} title="智能育种决策" desc="表型预测、杂交推荐、种植建议" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="最近上传" extra={<Link to="/user/data" className="text-sm text-primary">全部</Link>}>
          <ul className="divide-y">
            {mine.map((f) => (
              <li key={f.id} className="py-3 flex items-center gap-3 text-sm">
                <Database className="h-4 w-4 text-primary" />
                <span className="flex-1 min-w-0 truncate">{f.name}</span>
                <span className="hidden sm:inline text-xs text-muted-foreground">{f.date}</span>
                <StatusBadge status={f.status} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="待办任务">
          <ul className="space-y-3">
            {[
              { icon: Clock, t: "待上传", d: "2025 新乡干旱胁迫 · 第 3 次采样数据", tone: "text-info", search: { node: "d12", action: "upload" } },
              { icon: ClipboardList, t: "待补充", d: "wheat_xx_2025_drought.csv 缺少单位字段", tone: "text-warning", search: { file: 10232, action: "edit" } },
              { icon: MessageSquareWarning, t: "审核反馈", d: "rice_yield_2024.csv 被驳回：重复记录 14 条", tone: "text-destructive", search: { file: 10236, action: "rejected" } },
            ].map((x) => (
              <li key={x.d}>
                <Link to="/user/data" search={x.search} className="flex gap-3 rounded-xl bg-muted/60 p-3 cursor-pointer hover:bg-muted transition-colors">
                  <x.icon className={`h-5 w-5 shrink-0 ${x.tone}`} />
                  <div className="flex-1"><p className="text-sm font-medium">{x.t}</p><p className="text-xs text-muted-foreground mt-0.5">{x.d}</p></div>
                  <span className="text-xs text-primary self-center">去处理</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
