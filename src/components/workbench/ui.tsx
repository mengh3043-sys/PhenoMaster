import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/lib/mock";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, extra, children, className }: { title?: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("bg-card rounded-2xl shadow-card border p-5", className)}>
      {title && (
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="font-semibold">{title}</h2>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, unit, delta, icon: Icon, tone = "primary", to, search, action, onClick }: { label: string; value: string | number; unit?: string; delta?: string; icon: LucideIcon; tone?: "primary" | "warning" | "info" | "destructive"; to?: NonNullable<LinkProps["to"]>; search?: Record<string, string>; action?: ReactNode; onClick?: () => void }) {
  const toneCls = { primary: "bg-primary-soft text-primary", warning: "bg-warning/15 text-warning", info: "bg-info/15 text-info", destructive: "bg-destructive/10 text-destructive" }[tone];
  const body = (
    <>
      <span className={cn("grid h-11 w-11 place-items-center rounded-xl", toneCls)}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold font-display">{value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
        {delta && <p className="text-xs text-muted-foreground mt-1">{delta}</p>}
        {action && !to && <div className="mt-1">{action}</div>}
      </div>
    </>
  );
  const cls = "group bg-card rounded-2xl shadow-card border p-5 flex items-start gap-4";
  return to ? (
    <Link to={to} search={search as never} className={cn(cls, "cursor-pointer hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/40 transition-all")}>{body}</Link>
  ) : onClick ? <Button variant="ghost" onClick={onClick} aria-label={label} aria-haspopup="dialog" className={cn(cls, "h-auto w-full justify-start whitespace-normal text-left font-normal cursor-pointer hover:bg-card hover:shadow-lift hover:border-primary/40 motion-safe:hover:-translate-y-0.5 transition-all motion-reduce:transition-none [&_svg]:size-5")}>{body}</Button> : <div className={cls}>{body}</div>;
}

export function TaskModule({ to, search, icon: Icon, title, desc, badge }: { to: NonNullable<LinkProps["to"]>; search?: Record<string, string>; icon: LucideIcon; title: string; desc: string; badge?: string }) {
  return (
    <Link to={to} search={search as never} className="group relative bg-card rounded-2xl border shadow-card p-5 hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
        {badge && <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{badge}</span>}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Link>
  );
}

export function StatusBadge({ status }: { status: ReviewStatus | string }) {
  const cls: Record<string, string> = {
    已审核: "bg-primary-soft text-primary", 已完成: "bg-primary-soft text-primary", 正常: "bg-primary-soft text-primary", 成功: "bg-primary-soft text-primary",
    待审核: "bg-warning/15 text-warning", 进行中: "bg-info/15 text-info", 草稿: "bg-muted text-muted-foreground", 用户私有: "bg-info/15 text-info",
    已驳回: "bg-destructive/10 text-destructive", 停用: "bg-destructive/10 text-destructive", 失败: "bg-destructive/10 text-destructive",
  };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs whitespace-nowrap", cls[status] ?? "bg-muted text-muted-foreground")}>{status}</span>;
}
