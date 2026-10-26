import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { BackHomeLink } from "@/components/site/BackHome";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "友情链接 — 作物表型管理平台" },
      { name: "description", content: "合作单位与相关科研机构导航。" },
      { property: "og:title", content: "友情链接 — 作物表型管理平台" },
      { property: "og:description", content: "合作单位与相关科研机构导航。" },
    ],
  }),
  component: Links,
});

const groups = [
  {
    t: "科研院校",
    links: [
      { name: "中国农业科学院作物科学研究所", url: "https://ics.caas.cn" },
      { name: "中国农业大学农学院", url: "https://cab.cau.edu.cn" },
      { name: "河南农业大学农学院", url: "https://nxy.henau.edu.cn" },
    ],
  },
  {
    t: "数据与标准",
    links: [
      { name: "BrAPI — 育种数据接口规范", url: "https://brapi.org" },
      { name: "Plant Phenomics 期刊", url: "https://spj.science.org/journal/plantphenomics" },
      { name: "国家农业科学数据中心", url: "https://www.agridata.cn" },
    ],
  },
  {
    t: "行业机构",
    links: [
      { name: "农业农村部", url: "https://www.moa.gov.cn" },
      { name: "全国农业技术推广服务中心", url: "https://www.natesc.org.cn" },
    ],
  },
];

function Links() {
  return (
    <InfoPage title="友情链接" intro="合作单位与相关科研机构导航" back={<BackHomeLink />}>
      {groups.map((g) => (
        <section key={g.t}>
          <h2 className="font-bold text-lg text-primary">{g.t}</h2>
          <ul className="mt-2 space-y-2">
            {g.links.map((l) => (
              <li key={l.name}>
                <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors cursor-pointer">
                  {l.name}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </InfoPage>
  );
}
