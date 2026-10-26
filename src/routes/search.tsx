import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { filesStore, imagesStore, imageTreeStore } from "@/store";
import { visibleImages } from "@/store/imageData";
import { caseList, newsList } from "@/lib/mock";
import { isPublicSearchFile, matchesPublicSearch, normalizeSearchQuery } from "@/lib/public-search";
import wheat from "@/assets/case-wheat.jpg";
import corn from "@/assets/case-corn.jpg";
import rice from "@/assets/case-rice.jpg";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [
    { title: "公开搜索 · 作物表型管理平台" },
    { name: "description", content: "搜索作物资讯、应用案例和已公开审核的表型数据，基础结果无需登录。" },
    { property: "og:title", content: "公开搜索 · 作物表型管理平台" },
    { property: "og:description", content: "查找作物资讯、应用案例与公开表型数据。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PublicSearch,
});

function PublicSearch() {
  const { q = "" } = Route.useSearch();
  const query = normalizeSearchQuery(q);
  const [files] = filesStore.useStore();
  const [images] = imagesStore.useStore();
  const [tree] = imageTreeStore.useStore();
  const hit = (...values: unknown[]) => matchesPublicSearch(query, ...values);
  const news = newsList.filter(item => hit(item.title, item.crop, item.src, item.type));
  const cases = caseList.filter(item => hit(item.title, item.desc, item.body, item.period, item.site));
  const data = files.filter(item => isPublicSearchFile(item) && hit(item.name, item.desc, item.crop, item.date));
  const photos = visibleImages(images, tree).filter(item => hit(item.name, item.label, item.variety, item.site, item.project, item.date));
  const total = news.length + cases.length + data.length + photos.length;
  const empty = <p className="py-4 text-sm text-muted-foreground">无匹配结果</p>;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold">{query ? `搜索「${query}」` : "公开搜索"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{query ? `共找到 ${total} 条基础结果` : "请输入搜索关键词"}</p>
        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          <section>
            <h2 className="border-b border-border pb-3 text-lg font-semibold">作物资讯（{news.length}）</h2>
            {news.length ? <ul className="divide-y divide-border">{news.map(item => <li key={item.id}><Link to="/news/$id" params={{ id: item.id }} className="block py-4 hover:text-primary"><span className="text-xs text-muted-foreground">{item.crop} · {item.type}</span><p className="mt-1 font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.src}</p></Link></li>)}</ul> : empty}
          </section>
          <section>
            <h2 className="border-b border-border pb-3 text-lg font-semibold">应用案例（{cases.length}）</h2>
            {cases.length ? <ul className="divide-y divide-border">{cases.map(item => <li key={item.id}><Link to="/cases/$id" params={{ id: item.id }} className="flex gap-4 py-4 hover:text-primary"><img src={item.id.startsWith("wheat") ? wheat : item.id.startsWith("maize") ? corn : rice} alt="" className="h-20 w-24 shrink-0 rounded-md object-cover" /><div className="min-w-0"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.desc}</p></div></Link></li>)}</ul> : empty}
          </section>
          <section>
            <h2 className="border-b border-border pb-3 text-lg font-semibold">公开表型数据（{data.length}）</h2>
            {data.length ? <ul className="divide-y divide-border">{data.map(item => <li key={item.id} className="py-4"><p className="break-all font-medium">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.crop} · {item.desc}</p><p className="mt-1 text-xs text-muted-foreground">{item.rows} 行 · {item.size} · {item.date}</p></li>)}</ul> : empty}
          </section>
          <section>
            <h2 className="border-b border-border pb-3 text-lg font-semibold">公开图片（{photos.length}）</h2>
            {photos.length ? <ul className="max-h-96 divide-y divide-border overflow-y-auto">{photos.map(item => <li key={`${item.nodeId}-${item.id}`} className="py-4"><p className="break-all font-medium">{item.name ?? `图片 ${item.id}`}</p><p className="mt-1 text-sm text-muted-foreground">{item.variety} · {item.label} · {item.date ?? "日期未记录"}</p></li>)}</ul> : empty}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}