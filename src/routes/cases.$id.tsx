import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { caseList } from "@/lib/mock";
import { SourceLinkButton } from "@/components/site/SourceLinkButton";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";

const imgs: Record<string, string> = { "rice-bph": rice, "maize-gantry": corn, "wheat-greenhouse": wheat };

export const Route = createFileRoute("/cases/$id")({
  loader: ({ params }) => {
    const c = caseList.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { c };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.c.title} — 应用案例` },
          { name: "description", content: loaderData.c.desc },
          { property: "og:title", content: loaderData.c.title },
          { property: "og:description", content: loaderData.c.desc },
        ]
      : [{ title: "案例不存在" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <InfoPage title="案例不存在" intro=""><Link to="/" className="text-primary">返回首页</Link></InfoPage>,
  component: CaseDetail,
});

function CaseDetail() {
  const { c } = Route.useLoaderData();
  return (
    <InfoPage title={c.title} intro={c.desc}>
      <img src={imgs[c.id]} alt={c.title} width={1280} height={768} className="w-full rounded-2xl" />
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{c.site}</span>
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{c.period}</span>
      </div>
      <p className="leading-relaxed">{c.body}</p>
      <div>
        <h2 className="font-bold mb-3">数据成果</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {c.metrics.map(([k, v]) => <div key={k} className="rounded-xl bg-primary-soft p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-bold font-display text-primary mt-1">{v}</p></div>)}
        </div>
      </div>
      <SourceLinkButton title={c.title} hint={c.site} />
      <Link to="/" className="inline-flex items-center gap-1 text-primary text-sm"><ArrowLeft className="h-4 w-4" />返回首页</Link>
    </InfoPage>
  );
}
