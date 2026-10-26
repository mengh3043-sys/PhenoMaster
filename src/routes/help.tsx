import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, MessageCircleQuestion, ClipboardList, Code2 } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { BackHomeLink } from "@/components/site/BackHome";
import { CONTACT_EMAIL } from "@/lib/mock";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "服务支持 — 作物表型管理平台" },
      { name: "description", content: "操作手册、常见问题解答与开发者支持。" },
      { property: "og:title", content: "服务支持 — 作物表型管理平台" },
      { property: "og:description", content: "操作手册、常见问题解答与开发者支持。" },
    ],
  }),
  component: Help,
});

const entries = [
  { icon: BookOpen, t: "使用手册", d: "平台功能与操作流程的完整说明。", to: "/guide" as const },
  { icon: ClipboardList, t: "操作指南", d: "从登录到分析的分步操作指引。", to: "/operation" as const },
  { icon: MessageCircleQuestion, t: "常见问题", d: "账号、上传、权限等高频问题解答。", to: "/faq" as const },
  { icon: Code2, t: "开发者 / API", d: "REST 接口、BrAPI 兼容与硬件设备接入文档。", to: "/api" as const },
];

function Help() {
  return (
    <InfoPage title="服务支持" intro="帮助您快速上手平台各项功能" back={<BackHomeLink />}>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((e) => (
          <Link key={e.t} to={e.to} className="group flex items-start gap-3 rounded-2xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/50 cursor-pointer">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <e.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                {e.t}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{e.d}</span>
            </span>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="font-bold text-lg text-primary">仍需帮助？</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          如以上资料未能解决您的问题，请发送邮件至{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline underline-offset-4">{CONTACT_EMAIL}</a>
          ，开发者会在 1 个工作日内回复。
        </p>
      </section>
    </InfoPage>
  );
}
