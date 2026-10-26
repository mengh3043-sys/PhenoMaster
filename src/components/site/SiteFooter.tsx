import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";
import { CONTACT_EMAIL } from "@/lib/mock";

export function SiteFooter() {
  const cols = [
    { title: "关于平台", links: [{ l: "平台介绍", to: "/intro" }, { l: "使用手册", to: "/guide" }] },
    { title: "帮助中心", links: [{ l: "常见问题", to: "/faq" }, { l: "操作指南", to: "/operation" }] },
  ] as const;
  return (
    <footer className="bg-ink text-on-dark-muted mt-auto">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="space-y-3">
          <Brand dark />
          <p className="text-sm leading-relaxed max-w-xs">面向作物科研团队的表型数据、图片与分析一体化管理平台。</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-on-dark font-semibold mb-3">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((x) => (
                <li key={x.l}><Link to={x.to} className="hover:text-on-dark transition-colors cursor-pointer">{x.l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="text-on-dark font-semibold mb-3">服务支持</h4>
          <ul className="space-y-2 text-sm">
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-on-dark transition-colors">联系开发者</a></li>
            <li>邮箱：<a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-on-dark">{CONTACT_EMAIL}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10 py-4 text-center text-xs">作物表型管理平台 © 2026</div>
    </footer>
  );
}
