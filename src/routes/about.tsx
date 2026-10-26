import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { BackHomeLink } from "@/components/site/BackHome";
import campus from "@/assets/hzau-gate.jpg";

const HZAU_URL = "https://www.hzau.edu.cn";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "关于我们 — 作物表型管理平台" },
      { name: "description", content: "作物表型管理平台的愿景、团队与建设背景介绍。" },
      { property: "og:title", content: "关于我们 — 作物表型管理平台" },
      { property: "og:description", content: "了解作物表型管理平台的愿景与团队。" },
    ],
  }),
  component: About,
});

const sections = [
  { t: "我们的愿景", d: "以数据驱动育种创新，用智能决策农业未来。我们希望成为作物科研团队最值得信赖的表型数据基础设施，让每一份田间数据都能沉淀为育种决策的依据。" },
  { t: "我们在做什么", d: "平台面向作物遗传育种、栽培生理、植物保护等科研团队，提供材料与试验管理、表型数据上传校验与审核、图片批量采集与自动上传、性状分析与系谱分析等一体化能力。" },
  { t: "我们的优势", d: "树状结构组织多源异构数据；支持无人机、传感器与第三方采集设备接入；对外提供 REST 风格接口并兼容 BrAPI 规范；基于部门 + 角色 + 数据权限的三层访问控制保障数据安全。" },
  { t: "联系我们", d: "如果您希望了解平台部署、合作接入或定制开发，欢迎通过页脚邮箱与开发者取得联系。" },
];

function About() {
  return (
    <InfoPage title="关于我们" intro="智能改变未来，数据掌控表型" back={<BackHomeLink />}>
      {sections.map((s) => (
        <section key={s.t}>
          <h2 className="font-bold text-lg text-primary">{s.t}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
        </section>
      ))}
      <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img src={campus} alt="华中农业大学校门" width={500} height={401} loading="lazy" className="h-28 w-full shrink-0 rounded-xl object-cover sm:w-44" />
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-primary">华中农业大学</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">学校官方网站将在新窗口中打开。</p>
            <a href={HZAU_URL} target="_blank" rel="noreferrer" className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer">
              访问华中农业大学官网
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </InfoPage>
  );
}
