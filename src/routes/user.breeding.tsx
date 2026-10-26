import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, GitMerge, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel } from "@/components/workbench/ui";
import { materials } from "@/lib/mock";

export const Route = createFileRoute("/user/breeding")({
  head: () => ({ meta: [{ title: "智能育种决策 · 作物表型管理平台" }, { name: "description", content: "表型预测、杂交推荐与种植建议（前端模拟）" }] }),
  component: BreedingPage,
});

const traits: Record<string, { unit: string; base: number }> = { 株高: { unit: "cm", base: 80 }, 穗长: { unit: "cm", base: 9 }, 千粒重: { unit: "g", base: 43 }, 产量: { unit: "kg/亩", base: 560 } };
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const nameOf = (code: string) => materials.find((m) => m.code === code)?.name ?? code;

const plantTips: Record<string, { region: string; sow: string; density: string; note: string }> = {
  小麦: { region: "黄淮冬麦区（河南、山东、皖北）", sow: "10 月上中旬", density: "基本苗 18–22 万/亩", note: "注意春季倒春寒与后期干热风" },
  玉米: { region: "黄淮海夏播区、东北春播区", sow: "夏播 6 月上旬 / 春播 4 月下旬", density: "4500–5500 株/亩", note: "耐密品种可适当增密，注意防倒伏" },
  水稻: { region: "长江中下游单季稻区", sow: "5 月中下旬播种，6 月中旬移栽", density: "1.6–1.8 万穴/亩", note: "分蘖期控水晒田，注意褐飞虱监测" },
};

function BreedingPage() {
  const [code, setCode] = useState("ZM-001");
  const [trait, setTrait] = useState("株高");
  const [pred, setPred] = useState<null | { v: number; lo: number; hi: number }>(null);
  const [p1, setP1] = useState("ZM-001");
  const [p2, setP2] = useState("XN-979");
  const [rec, setRec] = useState<null | { combo: string; score: number; desc: string }>(null);
  const [plantCode, setPlantCode] = useState("ZM-001");

  const predict = () => {
    const t = traits[trait.trim()];
    if (!code.trim() || !t) { toast.error("请输入材料编号，性状可选：株高、穗长、千粒重、产量"); return; }
    const k = 0.9 + (hash(code.trim() + trait) % 200) / 1000;
    const v = +(t.base * k).toFixed(1);
    setPred({ v, lo: +(v * 0.95).toFixed(1), hi: +(v * 1.05).toFixed(1) });
  };
  const recommend = () => {
    if (p1 === p2) { toast.error("请选择两个不同的亲本"); return; }
    const a = materials.find((m) => m.code === p1)!, b = materials.find((m) => m.code === p2)!;
    if (a.crop !== b.crop) { toast.error(`${a.crop}与${b.crop}无法杂交，请选择同一作物`); return; }
    const score = 70 + (hash(p1 + p2) % 28);
    setRec({ combo: `${a.name} × ${b.name}`, score, desc: `预期结合「${a.target}」与「${b.target}」特性，产量较双亲均值提高约 ${(score / 10 - 2).toFixed(1)}%，后代分离稳定性${score > 85 ? "较好" : "中等"}。` });
  };
  const pm = materials.find((m) => m.code === plantCode)!;
  const tip = plantTips[pm.crop]!;

  const matSelect = (v: string, on: (v: string) => void) => (
    <Select value={v} onValueChange={on}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{materials.map((m) => <SelectItem key={m.code} value={m.code}>{m.code} {m.name}（{m.crop}）</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader title="智能育种决策" desc="基于历史表型数据的预测与推荐（演示数据，前端模拟）" />
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="表型预测">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>材料编号</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="如 ZM-001" /></div>
            <div className="space-y-1.5"><Label>性状名称</Label>
              <Select value={trait} onValueChange={setTrait}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(traits).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={predict} className="w-full"><TrendingUp />预测</Button>
            {pred && (
              <div className="rounded-xl bg-primary-soft p-4">
                <p className="text-xs text-muted-foreground">{code} {nameOf(code)} · {trait}</p>
                <p className="text-3xl font-bold font-display mt-1">{pred.v}<span className="text-sm font-normal ml-1">{traits[trait]!.unit}</span></p>
                <p className="text-xs text-muted-foreground mt-1">95% 区间 {pred.lo} – {pred.hi}</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="杂交推荐">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>母本</Label>{matSelect(p1, setP1)}</div>
            <div className="space-y-1.5"><Label>父本</Label>{matSelect(p2, setP2)}</div>
            <Button onClick={recommend} className="w-full"><GitMerge />推荐</Button>
            {rec && (
              <div className="rounded-xl bg-primary-soft p-4 space-y-1">
                <p className="font-semibold">{rec.combo}</p>
                <p className="text-sm">综合评分 <span className="font-display font-bold">{rec.score}</span> / 100</p>
                <p className="text-xs text-muted-foreground">{rec.desc}</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="种植建议">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>材料</Label>{matSelect(plantCode, setPlantCode)}</div>
            <dl className="rounded-xl bg-muted/60 p-4 text-sm space-y-2">
              <div className="flex items-start gap-2"><Sprout className="h-4 w-4 text-primary mt-0.5" /><span className="font-medium">{pm.name}（{pm.target}）</span></div>
              <div><dt className="text-xs text-muted-foreground">适宜地区</dt><dd>{tip.region}</dd></div>
              <div><dt className="text-xs text-muted-foreground">播期</dt><dd>{tip.sow}</dd></div>
              <div><dt className="text-xs text-muted-foreground">种植密度</dt><dd>{tip.density}</dd></div>
              <div><dt className="text-xs text-muted-foreground">注意事项</dt><dd>{tip.note}</dd></div>
            </dl>
          </div>
        </Panel>
      </div>
    </div>
  );
}
