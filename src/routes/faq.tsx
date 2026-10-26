import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CONTACT_EMAIL } from "@/lib/mock";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "常见问题 — 作物表型管理平台" },
      { name: "description", content: "关于账号、数据上传、图片自动上传和权限的常见问题解答。" },
      { property: "og:title", content: "常见问题 — 作物表型管理平台" },
      { property: "og:description", content: "平台常见问题解答。" },
    ],
  }),
  component: Faq,
});

const qa = [
  ["如何获得管理员账号？", `管理员账号需联系开发者开通，邮箱 ${CONTACT_EMAIL}。`],
  ["普通用户能看到哪些数据？", "普通用户只能看到公开数据，以及自己或本课题组权限范围内的材料与试验。"],
  ["上传的表型文件支持什么格式？", "目前支持 CSV 格式；建议先下载模板，上传后系统会对必填字段、单位、取值范围和重复记录进行校验并提示错误行。"],
  ["图片上传后显示不全怎么办？", "图片上传需要时间，若上传后显示不全，刷新页面即可。"],
  ["图片自动上传如何配置？", "下载远程连接程序并在目标机运行，开放端口 9999，在“图片自动上传”中填写目标机公网 IP 及图片目录绝对路径（如 c:/corn）。"],
  ["数据提交后多久审核？", "管理员一般在 1 个工作日内完成审核，结果会在消息通知与待办任务中反馈。"],
];

function Faq() {
  return (
    <InfoPage title="常见问题" intro="找不到答案？请联系开发者">
      <Accordion type="single" collapsible>
        {qa.map(([q, a]) => (
          <AccordionItem key={q} value={q ?? ""}>
            <AccordionTrigger className="text-left">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </InfoPage>
  );
}
