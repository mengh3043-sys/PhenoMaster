import { Link } from "@tanstack/react-router";
import { ArrowLeft, Leaf, FileSpreadsheet, Images, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "./ui";
import type { Role } from "./Workbench";
import { filesStore, imagesStore, imageTreeStore, matStore, trialStore } from "@/store";
import { findNode } from "./TreePanel";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";
import hero from "@/assets/hero-field.jpg";

const pool = [wheat, corn, rice, hero];
const srcOf = (s: string) => (s.startsWith("pool:") ? pool[Number(s.slice(5))] ?? wheat : s);
// 中文作物名 ↔ 英文文件名关键词，便于“小麦”命中 wheat_*.csv
const alias: Record<string, string[]> = { 小麦: ["wheat"], 玉米: ["maize", "corn"], 水稻: ["rice"], 黄瓜: ["cucumber"] };

export function SearchResults({ role, q }: { role: Role; q: string }) {
  const isAdmin = role === "admin";
  const base = isAdmin ? "/admin" : "/user";
  const [mats] = matStore.useStore();
  const [files] = filesStore.useStore();
  const [trials] = trialStore.useStore();
  const [imgTree] = imageTreeStore.useStore();
  const [byNode] = imagesStore.useStore();

  const kw = q.trim().toLowerCase();
  const terms = kw ? [kw, ...(alias[q.trim()] ?? [])] : [];
  const hit = (...vals: unknown[]) => terms.length > 0 && vals.some((v) => terms.some((t) => String(v ?? "").toLowerCase().includes(t)));

  const mRes = mats.filter((m) => hit(m.code, m.name, m.crop, m.source, m.pedigree, m.target));
  const fRes = files.filter((f) => (isAdmin || f.public) && hit(f.id, f.name, f.desc, f.crop));
  const tRes = trials.filter((t) => hit(t.code, t.name, t.site, t.design));
  const iRes = Object.entries(byNode).flatMap(([nodeId, list]) => {
    const node = findNode(imgTree, nodeId);
    if (!node || (!isAdmin && !node.public)) return [];
    return list.filter((im) => hit(im.id, im.label, node.name) || (terms.some((t) => (alias[q.trim()] ?? []).includes(t)) && im.src === `pool:${["wheat", "corn", "rice"].indexOf(alias[q.trim()]?.[0] ?? "")}`)).map((im) => ({ ...im, nodeId, nodeName: node.name }));
  }).slice(0, 12);
  const total = mRes.length + fRes.length + tRes.length + iRes.length;

  const item = "flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors";
  const Empty = () => <p className="text-sm text-muted-foreground py-2">无匹配结果</p>;

  return (
    <div>
      <PageHeader title={`搜索「${q}」`} desc={`共找到 ${total} 条结果`} actions={<Button variant="outline" asChild><Link to={isAdmin ? "/admin" : "/user"}><ArrowLeft />返回</Link></Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`材料（${mRes.length}）`}>
          {mRes.length ? <ul>{mRes.map((m) => <li key={m.code}><Link to={isAdmin ? "/admin/materials/$code" : "/user/materials/$code"} params={{ code: m.code }} className={item}><Leaf className="h-4 w-4 text-primary" /><span className="font-mono text-xs">{m.code}</span>{m.name}<span className="text-muted-foreground">（{m.crop}）</span></Link></li>)}</ul> : <Empty />}
        </Panel>
        <Panel title={`表型数据（${fRes.length}）`}>
          {fRes.length ? <ul>{fRes.map((f) => <li key={f.id}><Link to={isAdmin ? "/admin/data" : "/user/data"} search={{ file: f.id, action: "detail" }} className={item}><FileSpreadsheet className="h-4 w-4 text-primary" /><span className="truncate flex-1">{f.name}</span><span className="text-xs text-muted-foreground">{f.desc}</span></Link></li>)}</ul> : <Empty />}
        </Panel>
        <Panel title={`试验（${tRes.length}）`}>
          {tRes.length ? <ul>{tRes.map((t) => <li key={t.code}><Link to="/user/trial/$code" params={{ code: t.code }} className={item}><FlaskConical className="h-4 w-4 text-primary" /><span className="flex-1">{t.name}</span><span className="text-xs text-muted-foreground">{t.site} · {t.design}</span></Link></li>)}</ul> : <Empty />}
        </Panel>
        <Panel title={`图片（${iRes.length} 张相关图片）`}>
          {iRes.length ? <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{iRes.map((im) => (
            <Link key={`${im.nodeId}-${im.id}`} to={isAdmin ? "/admin/images" : "/user/images"} search={{ node: im.nodeId, img: im.id }} className="group relative block aspect-square overflow-hidden rounded-lg cursor-pointer">
              <img src={srcOf(im.src)} alt={`图片 ${im.id}`} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              <span className="absolute inset-x-0 bottom-0 bg-overlay text-on-dark text-[10px] px-1.5 py-0.5 truncate">{im.nodeName} · {im.id}</span>
            </Link>))}</div> : <Empty />}
        </Panel>
      </div>
      <p className="sr-only">{base}</p>
    </div>
  );
}
