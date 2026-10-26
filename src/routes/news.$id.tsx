import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { newsList } from "@/lib/mock";
import { SourceLinkButton } from "@/components/site/SourceLinkButton";
import { BackHomeLink } from "@/components/site/BackHome";

export const Route = createFileRoute("/news/$id")({
  loader: ({ params }) => {
    const item = newsList.find((n) => n.id === params.id);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.item.title} — 作物资讯` },
          { name: "description", content: `${loaderData.item.crop}表型${loaderData.item.type}：${loaderData.item.title}` },
          { property: "og:title", content: loaderData.item.title },
          { property: "og:description", content: `${loaderData.item.crop} · ${loaderData.item.type}` },
        ]
      : [{ title: "资讯不存在" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <InfoPage title="资讯不存在" intro="该资讯可能已下线" back={<BackHomeLink />}><Link to="/news" className="text-primary">返回资讯列表</Link></InfoPage>,
  component: Detail,
});

function Detail() {
  const { item } = Route.useLoaderData();
  return (
    <InfoPage title={item.title} intro={`${item.crop} · ${item.type} · ${item.src}`} back={<BackHomeLink />}>
      <p className="leading-relaxed text-muted-foreground">
        本条{item.type}围绕{item.crop}表型研究展开，涉及田间高通量采集、数据标准化与分析方法。平台已将相关数据集整理至对应的表型数据节点，登录后可在「表型数据」中按作物与年份检索，并在「分析工具」中进行性状分析和多试验比较。
      </p>
      <p className="leading-relaxed text-muted-foreground">
        如需获取原文或参会信息，请联系开发者或关注平台公告。
      </p>
      <SourceLinkButton title={item.title} hint={item.src} />
      <Link to="/news" search={{ q: item.crop }} className="inline-flex items-center gap-1 text-primary text-sm"><ArrowLeft className="h-4 w-4" />返回{item.crop}资讯</Link>
    </InfoPage>
  );
}
