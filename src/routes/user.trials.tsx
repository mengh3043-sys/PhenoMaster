import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, StatusBadge } from "@/components/workbench/ui";
import { ConfirmDialog } from "@/components/workbench/NodeDialogs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetailDialog, type DetailInfo } from "@/components/workbench/DetailDialog";
import { matStore, trialStore, designText } from "@/store";

export const designTypes = ["随机区组", "裂区设计", "完全随机", "拉丁方"];

export const Route = createFileRoute("/user/trials")({
  validateSearch: z.object({ tab: z.string().optional(), create: z.string().optional() }),
  component: Trials,
});

function Trials() {
  const { tab = "mat", create } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [mats, setMats] = matStore.useStore();
  const [trs, setTrs] = trialStore.useStore();
  const [open, setOpen] = useState(create === "1");
  const [delMat, setDelMat] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", year: "2026", site: "", designType: "随机区组", reps: "3" });
  const [detail, setDetail] = useState<DetailInfo | null>(null);

  return (
    <div>
      <PageHeader title="我的材料 / 我的试验" desc="只展示你权限范围内（本人及本课题组）的材料与试验"
        actions={<Button onClick={() => setOpen(true)}><Plus />新建试验</Button>} />
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>
        <TabsList><TabsTrigger value="mat">我的材料</TabsTrigger><TabsTrigger value="trial">我的试验</TabsTrigger></TabsList>
        <TabsContent value="mat" className="mt-4">
          <Panel>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>{["名称", "编号", "来源", "操作"].map((h) => <th key={h} className="text-left p-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>{mats.map((m) => (
                <tr key={m.code} className="border-t hover:bg-muted/40">
                  <td className="p-2.5 font-medium">{m.name}</td><td className="p-2.5 font-mono text-xs">{m.code}</td><td className="p-2.5">{m.source}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setDetail({ title: `材料详情：${m.name}`, desc: `编号 ${m.code}`, fields: [["名称", m.name], ["编号", m.code], ["作物", m.crop], ["来源", m.source], ["系谱", m.pedigree], ["育种目标", m.target]] })}><Eye />详情</Button>
                    <Button size="sm" variant="ghost" asChild><Link to="/user/materials/$code" params={{ code: m.code }}>详情页</Link></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelMat(m.code)}><Trash2 />删除</Button>
                  </td>
                </tr>))}</tbody>
            </table></div>
          </Panel>
        </TabsContent>
        <TabsContent value="trial" className="mt-4">
          <Panel>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>{["试验名称", "年份", "地点", "试验设计", "状态", "操作"].map((h) => <th key={h} className="text-left p-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>{trs.map((t) => (
                <tr key={t.code} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => navigate({ to: "/user/trial/$code", params: { code: t.code } })}>
                  <td className="p-2.5 font-medium text-primary">{t.name}</td><td className="p-2.5 font-display">{t.year}</td><td className="p-2.5">{t.site}</td><td className="p-2.5">{t.design}</td><td className="p-2.5"><StatusBadge status={t.status} /></td>
                  <td className="p-2.5 whitespace-nowrap"><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail({ title: `试验详情：${t.name}`, desc: `编号 ${t.code}`, fields: [["名称", t.name], ["编号", t.code], ["年份", t.year], ["地点", t.site], ["试验设计", t.design], ["小区数", t.plots], ["状态", t.status]] }); }}><Eye />详情</Button></td>
                </tr>))}</tbody>
            </table></div>
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建试验</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2"><Label>试验名称</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="2026 郑州小麦区试" /></div>
            <div className="space-y-1.5"><Label>年份</Label><Input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>地点</Label><Input value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} placeholder="郑州" /></div>
            <div className="space-y-1.5"><Label>试验设计类型</Label>
              <Select value={f.designType} onValueChange={(v) => setF({ ...f, designType: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{designTypes.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>重复次数</Label><Input type="number" min={1} value={f.reps} onChange={(e) => setF({ ...f, reps: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={() => {
              if (!f.name.trim()) { toast.error("请填写试验名称"); return; }
              const reps = Number(f.reps) || undefined;
              setTrs([{ code: `T-${f.year}-${Date.now() % 1000}`, name: f.name, site: f.site || "—", design: designText(f.designType, reps), designType: f.designType, ...(reps ? { reps } : {}), plots: 0, status: "进行中", year: f.year }, ...trs]);
              setOpen(false); setF({ name: "", year: "2026", site: "", designType: "随机区组", reps: "3" }); navigate({ search: { tab: "trial" } }); toast.success("试验已创建");
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DetailDialog info={detail} onClose={() => setDetail(null)} />
      <ConfirmDialog open={!!delMat} title={`确认删除材料 ${delMat ?? ""}？`} onClose={() => setDelMat(null)}
        onConfirm={() => { setMats(mats.filter((m) => m.code !== delMat)); setDelMat(null); toast.success("已删除"); }} />
    </div>
  );
}
