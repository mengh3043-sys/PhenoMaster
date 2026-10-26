import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Search } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { BackHomeLink } from "@/components/site/BackHome";
import { Button } from "@/components/ui/button";
import { newsList } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/news/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "作物资讯 — 作物表型管理平台" },
      { name: "description", content: "按作物搜索小麦、玉米、水稻表型相关的新闻、报告、会议与论文。" },
      { property: "og:title", content: "作物资讯 — 作物表型管理平台" },
      { property: "og:description", content: "作物表型新闻、报告、会议、论文。" },
    ],
  }),
  component: NewsList,
});

const types = ["全部", "新闻", "报告", "会议", "论文"] as const;

function NewsList() {
  const { q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [kw, setKw] = useState(q);
  const [type, setType] = useState<(typeof types)[number]>("全部");
  const list = newsList.filter((n) => (!q || n.crop.includes(q) || n.title.includes(q)) && (type === "全部" || n.type === type));
  return (
    <InfoPage title="作物资讯" intro="输入作物名称（如小麦、玉米、水稻）查看相关表型资讯" back={<BackHomeLink />}>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: kw.trim() || undefined } }); }} className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="输入作物名称，如：小麦" className="w-full rounded-xl border border-input h-11 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
        <Button type="submit" className="h-11 rounded-xl">搜索</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {["小麦", "玉米", "水稻"].map((c) => <button key={c} onClick={() => { setKw(c); navigate({ search: { q: c } }); }} className={cn("rounded-full px-3 py-1 text-sm border", q === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{c}</button>)}
        <span className="mx-2 w-px bg-border" />
        {types.map((t) => <button key={t} onClick={() => setType(t)} className={cn("rounded-full px-3 py-1 text-sm", type === t ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:bg-muted")}>{t}</button>)}
      </div>
      <ul className="divide-y">
        {list.map((n) => (
          <li key={n.id}>
            <Link to="/news/$id" params={{ id: n.id }} className="flex items-start gap-3 py-4 group">
              <span className="text-xs rounded-md bg-primary-soft text-accent-foreground px-2 py-0.5 shrink-0 mt-0.5">{n.type}</span>
              <div><p className="font-medium group-hover:text-primary">{n.title}</p><p className="text-xs text-muted-foreground mt-1">{n.crop} · {n.src}</p></div>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="py-10 text-center text-muted-foreground text-sm">没有找到「{q}」相关资讯</li>}
      </ul>
    </InfoPage>
  );
}
