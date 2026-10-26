import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Building2, Link2, LifeBuoy, Cpu } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LoginMenu } from "@/components/site/LoginMenu";
import { caseList } from "@/lib/mock";
import { cn } from "@/lib/utils";
import hero from "@/assets/hero-field.jpg";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";
import newsLab from "@/assets/news-lab.jpg";
import newsConf from "@/assets/news-conference.jpg";
import cardAbout from "@/assets/card-about-hzau.jpg";
import cardLinks from "@/assets/card-links.jpg";
import cardSupport from "@/assets/card-support.jpg";
import cardProducts from "@/assets/card-products.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "作物表型管理平台 — 首页" },
      { name: "description", content: "智能改变未来，数据掌控表型。面向农业科研的作物表型数据、图片与分析一体化管理平台。" },
      { property: "og:title", content: "作物表型管理平台" },
      { property: "og:description", content: "以数据驱动育种创新，用智能决策农业未来。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Slide = {
  img: string;
  badge: string;
  title: string;
  desc: string;
  action?: "enter";
  caseId?: string;
  newsId?: string;
};

const slides: Slide[] = [
  {
    img: hero,
    badge: "一站式平台",
    title: "作物表型管理平台",
    desc: "汇聚材料、试验、表型数据与图片，打通从田间采集到分析决策的每一个环节。",
    action: "enter" as const,
  },
  {
    img: newsLab,
    badge: "作物资讯 · 新闻",
    title: "黄淮麦区抗旱品种田间表型联合鉴定启动",
    desc: "多地点联合鉴定试验正式开展，表型数据将统一汇聚至平台。",
    newsId: "w2",
  },
  {
    img: newsConf,
    badge: "作物资讯 · 会议报告",
    title: "第五届全国小麦表型组学研讨会（郑州）",
    desc: "2026-11-08 召开，聚焦高通量表型采集与数据标准。",
    newsId: "w3",
  },
  {
    img: rice,
    badge: "应用案例",
    title: "扬州水稻试验田 · 褐飞虱抗性监测",
    desc: "UAV 巡田 + YOLO 识别，mAP50 达 94.9%，单张推理 0.8ms。",
    caseId: caseList[0]!.id,
  },
  {
    img: corn,
    badge: "应用案例",
    title: "新乡玉米密植试验 · 龙门式表型车",
    desc: "多相机同步采集株高、叶面积与 NDVI 时序数据。",
    caseId: caseList[1]!.id,
  },
  {
    img: wheat,
    badge: "应用案例",
    title: "郑州小麦温室 · 苗期高通量成像",
    desc: "RGB 自动上传至图片节点，与表型文件按材料联动。",
    caseId: caseList[2]!.id,
  },
];

const features = [
  {
    icon: Building2,
    title: "关于我们",
    desc: "了解平台的建设背景、核心功能与愿景，面向作物科研团队的一体化管理能力。",
    to: "/about" as const,
    cta: "了解平台",
    img: cardAbout,
  },
  {
    icon: Link2,
    title: "友情链接",
    desc: "合作单位与相关科研机构导航，汇聚育种、表型组学与农业数据资源。",
    to: "/links" as const,
    cta: "查看链接",
    img: cardLinks,
  },
  {
    icon: LifeBuoy,
    title: "服务支持",
    desc: "操作手册、常见问题解答与开发者支持，帮助您快速上手平台各项功能。",
    to: "/help" as const,
    cta: "获取帮助",
    img: cardSupport,
  },
  {
    icon: Cpu,
    title: "产品推荐",
    desc: "接入第三方硬件公司的采集设备，与数据平台联动，构建表型采集生态。",
    to: "/products" as const,
    cta: "查看产品",
    img: cardProducts,
  },
];

function Home() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      {/* 顶部轮播图 */}
      <section className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        {slides.map((s, i) => {
          const inner = (
            <>
              <img src={s.img} alt={s.title} loading={i === 0 ? "eager" : "lazy"} width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-overlay opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
              <div className={cn("relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 md:px-6 text-on-dark transition-opacity", i === idx ? "opacity-100 duration-500 delay-200" : "opacity-0 duration-150")}>
                <span className="inline-block w-fit rounded-full glass px-4 py-1.5 text-xs tracking-widest text-on-dark-muted">{s.badge}</span>
                <h2 className="mt-6 max-w-2xl text-2xl md:text-4xl font-bold leading-snug">{s.title}</h2>
                <p className="mt-4 max-w-xl text-sm md:text-base text-on-dark-muted leading-relaxed">{s.desc}</p>
                <div className="mt-8">
                  {s.action === "enter" ? (
                    <LoginMenu>
                      <button className="group flex items-center rounded-full bg-primary px-7 h-11 text-sm font-semibold text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:opacity-95 transition-all cursor-pointer">
                        进入平台
                      </button>
                    </LoginMenu>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-primary px-7 h-11 text-sm font-semibold text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:opacity-95 transition-all">
                      查看详情
                    </span>
                  )}
                </div>
              </div>
            </>
          );
          const cls = cn("absolute inset-0 transition-opacity duration-700", i === idx ? "opacity-100 z-10" : "opacity-0 pointer-events-none");
          if (s.caseId) {
            return <Link key={s.title} to="/cases/$id" params={{ id: s.caseId }} aria-hidden={i !== idx} tabIndex={i === idx ? 0 : -1} className={cls}>{inner}</Link>;
          }
          if (s.newsId) {
            return <Link key={s.title} to="/news/$id" params={{ id: s.newsId }} aria-hidden={i !== idx} tabIndex={i === idx ? 0 : -1} className={cls}>{inner}</Link>;
          }
          return <div key={s.title} aria-hidden={i !== idx} className={cls}>{inner}</div>;
        })}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
          <button aria-label="上一张" onClick={() => setIdx((idx + slides.length - 1) % slides.length)} className="glass rounded-full p-2.5 text-on-dark hover:bg-primary/40 transition-colors cursor-pointer"><ChevronLeft className="h-5 w-5" /></button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
          <button aria-label="下一张" onClick={() => setIdx((idx + 1) % slides.length)} className="glass rounded-full p-2.5 text-on-dark hover:bg-primary/40 transition-colors cursor-pointer"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} aria-label={`第 ${i + 1} 张`} onClick={() => setIdx(i)} className={cn("h-1.5 rounded-full transition-all cursor-pointer", i === idx ? "w-6 bg-primary" : "w-1.5 glass")} />
          ))}
        </div>
      </section>

      {/* 平台核心标语 */}
      <section className="py-16 md:py-24 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-wide text-foreground">智能改变未来，数据掌控表型</h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground">以数据驱动育种创新，用智能决策农业未来。</p>
      </section>

      {/* 四大核心板块 */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6 pb-16 md:pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-primary/60 cursor-pointer min-h-[240px]"
            >
              <img src={f.img} alt="" loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-overlay opacity-70 transition-opacity group-hover:opacity-60" />
              <div className="relative flex h-full flex-col">
                <span className="grid h-12 w-12 place-items-center rounded-xl glass text-on-dark transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-on-dark">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-on-dark-muted">{f.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-on-dark">
                  {f.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
