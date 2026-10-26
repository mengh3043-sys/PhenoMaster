import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/operation")({
  head: () => ({
    meta: [
      { title: "操作指南 — 作物表型管理平台" },
      { name: "description", content: "上传表型文件、管理图片节点、使用分析工具的分步操作指南。" },
      { property: "og:title", content: "操作指南 — 作物表型管理平台" },
      { property: "og:description", content: "平台分步操作指南。" },
    ],
  }),
  component: Operation,
});

const steps = [
  { t: "第一步：登录", d: "在首页选择【普通用户】或【管理员】身份，输入账号密码登录，进入对应工作台。" },
  { t: "第二步：上传表型文件", d: "进入「表型数据」，在左侧树中选中目标节点，点击【新增文件】，下载模板填写后上传，系统校验通过后提交审核。" },
  { t: "第三步：管理图片", d: "进入「表型图片」，在节点树下批量上传图片，可设置拍摄设备、时间、处理方式与关键字；也可配置目标机 IP + 目录实现自动上传。" },
  { t: "第四步：使用分析工具", d: "进入「分析工具」，选择材料与性状进行单试验分析、多试验分析、数量统计或系谱分析，图表支持导出图片与 CSV。" },
  { t: "第五步：查看审核结果", d: "提交的数据由管理员审核，结果通过右上角消息通知与首页待办提示反馈，一般 1 个工作日内完成。" },
];

function Operation() {
  return (
    <InfoPage title="操作指南" intro="按步骤完成从登录到分析的完整流程">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4 cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>
      {steps.map((s) => (
        <section key={s.t}>
          <h2 className="font-bold text-lg text-primary">{s.t}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
        </section>
      ))}
    </InfoPage>
  );
}
