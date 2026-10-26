import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "平台介绍 — 作物表型管理平台" },
      { name: "description", content: "作物表型管理平台的建设背景、核心功能与技术架构介绍。" },
      { property: "og:title", content: "平台介绍 — 作物表型管理平台" },
      { property: "og:description", content: "平台介绍。" },
    ],
  }),
  component: Intro,
});

const sections = [
  { t: "建设背景", d: "作物表型数据具有多源、异构、体量大的特点，分散在各类文件与设备中，难以统一管理。本平台面向作物科研团队，提供表型数据、图片与分析的一体化管理能力。" },
  { t: "核心功能", d: "树状结构组织表型数据与图片；CSV 文件上传、校验与审核；图片批量上传与远程自动采集；性状分析、多试验分析、数量统计与系谱分析；基于部门 + 角色 + 数据权限的三层访问控制。" },
  { t: "技术架构", d: "前端采用响应式设计，支持电脑、手机与平板；服务端支持 Linux 与 Windows Server 部署；对外提供 REST 风格接口，兼容 BrAPI 规范。" },
  { t: "适用对象", d: "作物遗传育种、栽培生理、植物保护等科研团队，以及需要管理田间试验数据的农业技术推广单位。" },
];

function Intro() {
  return (
    <InfoPage title="平台介绍" intro="面向作物科研团队的表型数据、图片与分析一体化管理平台">
      {sections.map((s) => (
        <section key={s.t}>
          <h2 className="font-bold text-lg text-primary">{s.t}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
        </section>
      ))}
    </InfoPage>
  );
}
