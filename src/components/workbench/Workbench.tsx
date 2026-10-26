import { Link, useNavigate, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home, Database, Images, LineChart, FolderTree, UserCircle, Bell, Search, Menu, Settings,
  ClipboardCheck, BookMarked, Activity, LogOut, Repeat, ChevronDown, FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/site/Brand";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { activeTabStore, noticeStore, profileStore, sessionStore, tabsStore, type WbTab } from "@/store";

import { X } from "lucide-react";
const genId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);
const SUB: Record<string, string> = { trait: "性状分析", stat: "数量统计", multi: "多试验分析", region: "地区管理", material: "材料与系谱", search: "全局搜索" };
function describe(href: string) {
  const [rawPath, qs = ""] = href.split("?");
  const path = (rawPath ?? "/").replace(/\/$/, "") || "/";
  const query: Record<string, string> = {};
  new URLSearchParams(qs).forEach((v, k) => { query[k] = v.replace(/^"|"$/g, ""); });
  const subTitle = /\/analysis$/.test(path) && query["tab"] ? SUB[query["tab"]] : undefined;
  return { path, query, title: tabTitle(path), ...(subTitle ? { subTitle } : {}) };
}
/** 左侧菜单点击：同路径已打开则激活既有 Tab，否则新建一个 Tab 实例并设为激活。 */
function openNewTab(role: string, href: string) {
  const { path } = describe(href);
  const existing = (tabsStore.get()[role] ?? []).find((t) => t.path === path);
  if (existing) {
    activeTabStore.set((m) => ({ ...m, [role]: existing.tabId }));
    return;
  }
  const tabId = genId();
  tabsStore.set((m) => ({ ...m, [role]: [...(m[role] ?? []), { tabId, href, ...describe(href) }] }));
  activeTabStore.set((m) => ({ ...m, [role]: tabId }));
}

export type Role = "user" | "admin";

type Item =
  | { label: string; icon: typeof Home; to: NonNullable<LinkProps["to"]>; exact?: boolean }
  | { label: string; icon: typeof Home; base: string; children: { label: string; tab: string }[] }
  | { label: string; icon: typeof Home; base: string; children: { label: string; to: NonNullable<LinkProps["to"]> }[] };

const userMenu: Item[] = [
  { label: "首页", icon: Home, to: "/user", exact: true },
  { label: "我的材料 / 我的试验", icon: FlaskConical, to: "/user/trials" },
  {
    label: "表型数据管理", icon: Database, base: "/user/data",
    children: [
      { label: "表型数据", to: "/user/data" },
      { label: "表型数据可视化", to: "/user/data/statistics" },
    ],
  },
  {
    label: "表型图片管理", icon: Images, base: "/user/images",
    children: [
      { label: "表型图片", to: "/user/images" },
      { label: "表型图片可视化", to: "/user/images/statistics" },
    ],
  },
  { label: "分析工具", icon: LineChart, to: "/user/analysis" },
  { label: "个人中心", icon: UserCircle, to: "/user/profile" },
];

export const systemTabs = [
  { label: "用户管理", tab: "users" }, { label: "角色管理", tab: "roles" }, { label: "菜单管理", tab: "menus" },
  { label: "部门管理", tab: "depts" }, { label: "岗位管理", tab: "posts" }, { label: "字典管理", tab: "dicts" },
  { label: "参数设置", tab: "params" }, { label: "操作日志", tab: "logs" },
];

const adminMenu: Item[] = [
  { label: "首页", icon: Home, to: "/admin", exact: true },
  { label: "数据审核", icon: ClipboardCheck, to: "/admin/review" },
  { label: "表型数据管理", icon: Database, base: "/admin/data", children: [
    { label: "表型数据", to: "/admin/data" },
    { label: "表型数据可视化", to: "/admin/data/statistics" },
  ] },
  { label: "表型图片管理", icon: Images, base: "/admin/images", children: [
    { label: "表型图片", to: "/admin/images" },
    { label: "表型图片可视化", to: "/admin/images/statistics" },
  ] },
  { label: "表型分析", icon: LineChart, to: "/admin/analysis" },
  { label: "基本信息", icon: BookMarked, to: "/admin/metadata" },
  { label: "系统管理", icon: Settings, base: "/admin/system", children: systemTabs },
  { label: "运维监控", icon: Activity, to: "/admin/monitor" },
];

const labels: Record<string, string> = {
  user: "用户工作台", admin: "管理员工作台", trials: "我的材料 / 我的试验", materials: "材料详情", data: "表型数据", images: "表型图片",
  analysis: "分析工具", profile: "个人中心", review: "数据审核", metadata: "基本信息", system: "系统管理", monitor: "运维监控",
  statistics: "表型图片可视化",
};

function tabTitle(path: string) {
  const seg = path.split("/").filter(Boolean);
  if (seg.length <= 1) return "首页";
  if (seg[1] === "data" && seg[2] === "statistics") return "表型数据可视化";
  if (seg[2] && labels[seg[2]]) return labels[seg[2]]!;
  if (seg[1] === "materials" || seg[1] === "trial") return `${seg[1] === "trial" ? "试验" : "材料"} ${decodeURIComponent(seg[2] ?? "")}`;
  if (seg[1] === "search") return "搜索结果";
  return labels[seg[1]!] ?? seg[1]!;
}

function TabBar({ role }: { role: Role }) {
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const [all, setAll] = tabsStore.useStore();
  const [actives, setActives] = activeTabStore.useStore();
  const tabs = all[role] ?? [];
  const activeId = actives[role];
  // 路由变化（页面内子菜单 / 页面内跳转）只更新当前激活的 Tab 实例，按 tabId 定位，不影响其他 Tab
  useEffect(() => {
    const act = activeTabStore.get()[role];
    const cur = tabsStore.get()[role] ?? [];
    if (!cur.some((t) => t.tabId === act)) { openNewTab(role, href); return; }
    setAll((m) => ({ ...m, [role]: (m[role] ?? []).map((t) => (t.tabId === act && t.href !== href ? { tabId: t.tabId, href, ...describe(href) } : t)) }));
  }, [href, role, setAll]);
  const open = (t: WbTab) => { setActives((m) => ({ ...m, [role]: t.tabId })); navigate({ href: t.href }); };
  const close = (id: string) => {
    const idx = tabs.findIndex((t) => t.tabId === id);
    const next = tabs.filter((t) => t.tabId !== id);
    setAll((m) => ({ ...m, [role]: next }));
    if (id === activeId) {
      const to = next[Math.min(idx, next.length - 1)];
      if (to) open(to); else { setActives((m) => ({ ...m, [role]: "" })); navigate({ href: `/${role}` }); }
    }
  };
  if (!tabs.length) return null;
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto border-b pb-2" role="tablist" aria-label="已打开的页面">
      {tabs.map((t) => {
        const on = t.tabId === activeId;
        const title = t.subTitle ? `${t.title}-${t.subTitle}` : t.title;
        return (
          <div key={t.tabId} role="tab" aria-selected={on} className={cn("group flex shrink-0 items-center gap-1 rounded-lg border pl-3 pr-1 h-8 text-sm cursor-pointer transition-colors", on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground/75 hover:bg-muted")} onClick={() => !on && open(t)}>
            <span className="whitespace-nowrap">{title}</span>
            <button aria-label={`关闭 ${title}`} onClick={(e) => { e.stopPropagation(); close(t.tabId); }} className={cn("grid h-5 w-5 place-items-center rounded", on ? "hover:bg-primary-foreground/20" : "hover:bg-foreground/10")}><X className="h-3.5 w-3.5" /></button>
          </div>
        );
      })}
    </div>
  );
}

function NavGroup({ it, role, pathname, search, onNavigate }: { it: Extract<Item, { base: string }>; role: Role; pathname: string; search: { tab?: string }; onNavigate?: (() => void) | undefined }) {
  const active = pathname.startsWith(it.base);
  const [open, setOpen] = useState(active);
  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors";
  const childCls = (on: boolean) => cn("block rounded-lg px-3 py-1.5 text-sm", on ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted");
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={cn(base, "w-full", active ? "text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-muted")}>
        <it.icon className="h-4 w-4" />{it.label}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-7 mt-1 space-y-0.5 border-l pl-2">
          {it.children.map((c) => {
            if ("to" in c) {
              const on = pathname === c.to;
              return (
                <Link key={c.label} to={c.to} onClick={() => { openNewTab(role, c.to as string); onNavigate?.(); }} className={childCls(on)}>
                  {c.label}
                </Link>
              );
            }
            const on = active && (search.tab ?? "users") === c.tab;
            return (
              <Link key={c.tab} to="/admin/system" search={{ tab: c.tab }} onClick={() => { openNewTab(role, `/admin/system?tab=${c.tab}`); onNavigate?.(); }} className={childCls(on)}>
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SideNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { pathname, search } = useRouterState({ select: (s) => ({ pathname: s.location.pathname, search: s.location.search as { tab?: string } }) });
  const menu = role === "admin" ? adminMenu : userMenu;
  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors";
  return (
    <nav className="space-y-1 p-3">
      {menu.map((it) => {
        if ("children" in it) {
          return <NavGroup key={it.label} it={it} role={role} pathname={pathname} search={search} onNavigate={onNavigate} />;
        }
        const active = it.exact ? pathname === it.to || pathname === it.to + "/" : pathname === it.to || pathname.startsWith(it.to + "/");
        return (
          <Link key={it.to} to={it.to} onClick={() => { openNewTab(role, it.to); onNavigate?.(); }}
            activeOptions={{ exact: true, includeSearch: false }} activeProps={{ className: "" }} inactiveProps={{ className: "" }}
            aria-current={active ? "page" : undefined}
            className={cn(base, "outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "bg-transparent text-foreground/75 hover:bg-foreground/5 hover:text-foreground")}>
            <it.icon className="h-4 w-4" />{it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Workbench({ role, children }: { role: Role; children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = pathname.split("/").filter(Boolean);
  const [profiles] = profileStore.useStore();
  const [notices, setNotices] = noticeStore.useStore();
  const myNotices = notices[role] ?? [];
  const unread = myNotices.filter((n) => !n.read).length;
  const [session] = sessionStore.useStore();
  const name = profiles[role].nick;

  // 权限限制：普通用户直接访问管理员页面时，跳回用户工作台
  useEffect(() => {
    if (role === "admin" && session?.role === "user") {
      toast.error("普通用户无权访问管理员工作台");
      navigate({ to: "/user" });
    }
  }, [role, session, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur border-b flex items-center gap-3 px-4 md:px-6">
        <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted" onClick={() => setMobile(true)} aria-label="打开菜单"><Menu className="h-5 w-5" /></button>
        <Brand />
        <span className="hidden sm:inline text-xs rounded-full bg-primary-soft text-accent-foreground px-2.5 py-1">{labels[role]}</span>
        <form className="hidden md:flex ml-auto relative w-80" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); if (!q) { toast.error("请输入搜索关键词"); return; } navigate({ to: role === "admin" ? "/admin/search" : "/user/search", search: { q } }); }}>
          <button type="submit" aria-label="搜索" className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"><Search className="h-4 w-4 text-muted-foreground" /></button>
          <input name="q" placeholder="全局搜索 材料 / 性状 / 文件 ID…" className="w-full rounded-full bg-muted pl-9 pr-4 h-9 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </form>
        <div className="ml-auto md:ml-2 flex items-center gap-1">
          {role === "admin" && (
            <Link to="/admin/system" search={{ tab: "users" }} className="hidden sm:flex items-center gap-1.5 rounded-full px-3 h-9 text-sm hover:bg-muted"><Settings className="h-4 w-4" />系统管理</Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-muted" aria-label="消息通知">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center">{unread > 99 ? "99+" : unread}</span>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">消息通知
                {unread > 0 && <button className="text-xs text-primary font-normal cursor-pointer" onClick={(e) => { e.preventDefault(); setNotices((all) => ({ ...all, [role]: (all[role] ?? []).map((n) => ({ ...n, read: true })) })); }}>全部已读</button>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {myNotices.length === 0 && <div className="px-2 py-6 text-center text-sm text-muted-foreground">暂无通知</div>}
              {myNotices.map((n) => (
                <DropdownMenuItem key={n.id} className="cursor-pointer flex-col items-start gap-0.5 whitespace-normal" onClick={() => { setNotices((all) => ({ ...all, [role]: (all[role] ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)) })); navigate({ to: n.to as "/user" }); }}>
                  <span className={cn("text-sm", !n.read && "font-semibold")}>{!n.read && <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-1.5" />}{n.desc}</span>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
              <span className="hidden sm:inline text-sm">{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: role === "admin" ? "/admin/profile" : "/user/profile" })}><UserCircle className="h-4 w-4" />个人中心</DropdownMenuItem>
              {role === "admin" && (
                <DropdownMenuItem onClick={() => navigate({ to: "/user" })}><Repeat className="h-4 w-4" />切换到用户工作台</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { sessionStore.set(null); toast.success("已退出登录"); navigate({ to: "/" }); }}><LogOut className="h-4 w-4" />退出</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-60 shrink-0 border-r bg-sidebar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <SideNav role={role} />
        </aside>
        <Sheet open={mobile} onOpenChange={setMobile}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="p-4 border-b"><FolderTree className="inline h-4 w-4 mr-2" />{labels[role]}</SheetTitle>
            <SideNav role={role} onNavigate={() => setMobile(false)} />
          </SheetContent>
        </Sheet>
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <TabBar role={role} />
          <div className="mb-4 text-xs text-muted-foreground flex flex-wrap gap-1.5">
            {crumbs.map((c, i) => (
              <span key={c} className="flex gap-1.5">
                {i > 0 && <span>/</span>}
                <span className={i === crumbs.length - 1 ? "text-foreground" : ""}>{crumbs[1] === "data" && c === "statistics" ? "表型数据可视化" : c === "data" && i < crumbs.length - 1 ? "表型数据管理" : labels[c] ?? c}</span>
              </span>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
