import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileSpreadsheet, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, StatusBadge } from "@/components/workbench/ui";
import { trialStore, designText, logAction } from "@/store";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";

export const Route = createFileRoute("/user/trial/$code")({
  head: () => ({ meta: [{ title: "试验详情 · 作物表型管理平台" }, { name: "description", content: "试验基本信息、试验设计设置与关联的表型数据和图片" }] }),
  component: TrialDetail,
});

const designTypes = ["随机区组", "裂区设计", "完全随机", "拉丁方"];

function TrialDetail() {
  const { code } = Route.useParams();
  const [trs, setTrs] = trialStore.useStore();
  const t = trs.find((x) => x.code === code);
  const [form, setForm] = useState({ designType: "随机区组", reps: "3", treatments: "1" });
  useEffect(() => {
    if (!t) return;
    const guess = designTypes.find((d) => t.design.includes(d)) ?? "随机区组";
    const n = (re: RegExp) => t.design.match(re)?.[1] ?? "";
    setForm({ designType: t.designType ?? guess, reps: String(t.reps ?? (n(/(\d+)\s*重复/) || "3")), treatments: String(t.treatments ?? (n(/(\d+)\s*处理/) || "1")) });
  }, [t?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!t) {
    return <Panel className="text-center py-16"><p className="font-semibold">未找到试验 {code}</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/user/trials" search={{ tab: "trial" }}><ArrowLeft />返回试验列表</Link></Button></Panel>;
  }

  const save = () => {
    const reps = Number(form.reps), treatments = Number(form.treatments);
    if (!(reps >= 1) || !(treatments >= 1)) { toast.error("重复次数和处理数需为正整数"); return; }
    setTrs(trs.map((x) => (x.code === t.code ? { ...x, designType: form.designType, reps, treatments, plots: reps * treatments * 8, design: designText(form.designType, reps, treatments) } : x)));
    logAction(`设置试验设计「${t.name}」`);
    toast.success("试验设计已保存");
  };

  const files = [
    { name: `${t.code.toLowerCase()}_plant_height.csv`, rows: 240, date: `${t.year}-06-12` },
    { name: `${t.code.toLowerCase()}_yield.csv`, rows: 96, date: `${t.year}-09-03` },
    { name: `${t.code.toLowerCase()}_ndvi.csv`, rows: 512, date: `${t.year}-07-20` },
  ];
  const imgs = [wheat, corn, rice, wheat, corn, rice];

  return (
    <div>
      <PageHeader title={t.name} desc={`试验编号 ${t.code}`} actions={<Button variant="outline" asChild><Link to="/user/trials" search={{ tab: "trial" }}><ArrowLeft />返回试验列表</Link></Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="基本信息">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[["名称", t.name], ["编号", t.code], ["年份", t.year], ["地点", t.site], ["试验设计", t.design], ["小区数", t.plots]].map(([k, v]) => (
              <div key={String(k)}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
            ))}
            <div><dt className="text-xs text-muted-foreground">状态</dt><dd className="mt-1"><StatusBadge status={t.status} /></dd></div>
          </dl>
        </Panel>
        <Panel title="试验设计设置">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>试验设计类型</Label>
              <Select value={form.designType} onValueChange={(v) => setForm({ ...form, designType: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{designTypes.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>重复次数</Label><Input type="number" min={1} value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>处理数</Label><Input type="number" min={1} value={form.treatments} onChange={(e) => setForm({ ...form, treatments: e.target.value })} /></div>
          </div>
          <Button className="mt-4" onClick={save}><Save />保存</Button>
        </Panel>
        <Panel title="表型数据">
          <ul className="divide-y text-sm">{files.map((f) => (
            <li key={f.name} className="py-2.5 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-primary" /><span className="flex-1 truncate">{f.name}</span><span className="text-xs text-muted-foreground">{f.rows} 行 · {f.date}</span></li>
          ))}</ul>
        </Panel>
        <Panel title="图片">
          <div className="grid grid-cols-3 gap-2">{imgs.map((src, i) => <img key={i} src={src} alt={`${t.name} 图片 ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover rounded-lg" />)}</div>
        </Panel>
      </div>
    </div>
  );
}
