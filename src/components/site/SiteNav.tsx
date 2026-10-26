import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeSearchQuery } from "@/lib/public-search";
import { Brand } from "./Brand";
import { BackHomeNavButton } from "./BackHome";
import { LoginMenu } from "./LoginMenu";
import { rememberSiteRoute } from "@/lib/site-history";

const HOT_WORDS = ["#drought", "#wheat", "#UAV", "#NDVI", "#2024"];

export function SiteNav() {
  const [q, setQ] = useState("");
  const [hotOpen, setHotOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    rememberSiteRoute(path);
  }, [path]);
  useEffect(() => {
    if (path === "/search") setQ(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [path]);
  useEffect(() => {
    if (!hotOpen) return;
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setHotOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHotOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [hotOpen]);
  const onNews = path === "/news" || path.startsWith("/news/");
  const go = (term: string) => {
    const query = normalizeSearchQuery(term);
    if (!query) return;
    setQ(query);
    setHotOpen(false);
    navigate({ to: "/search", search: { q: query } });
  };
  return (
    <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-ink-foreground/10">
      <div className="relative w-full px-6 md:px-10 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-8 gap-y-3">
        {/* 左侧：品牌 Logo + 平台名称，贴屏幕最左（留少量边距） */}
        <div className="flex items-center gap-4 shrink-0">
          <Brand dark />
          {onNews && <BackHomeNavButton />}
        </div>

        {/* 中间：搜索框，绝对居中于左右两区之间，宽屏下不超过 500px */}
        <div ref={searchRef} className="relative order-last md:order-none w-full md:w-full md:max-w-[500px] md:mx-auto min-w-0 xl:absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2">
          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-dark-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setHotOpen(true)}
              onClick={() => setHotOpen(true)}
              placeholder="支持搜索作物、性状、传感器、基因型、试验地点……"
              aria-label="搜索关键词"
              className="w-full rounded-full glass pl-9 pr-4 py-2 text-sm text-on-dark placeholder:text-on-dark-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
          <div
            className={`absolute left-0 right-0 top-full z-40 mt-2 flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background p-3 shadow-lg transition-all duration-200 origin-top ${
              hotOpen ? "opacity-100 scale-100 translate-y-0" : "pointer-events-none opacity-0 scale-95 -translate-y-1"
            }`}
          >
            {HOT_WORDS.map((word) => (
              <Button
                key={word}
                type="button"
                variant="ghost"
                tabIndex={hotOpen ? 0 : -1}
                onClick={() => {
                  go(word);
                }}
                className="h-auto cursor-pointer rounded-full bg-muted px-3 py-1 text-sm text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {word}
              </Button>
            ))}
          </div>
        </div>

        {/* 右侧：三个文字链接（间距 24px）+ 绿色登录按钮，贴屏幕最右 */}
        <div className="flex flex-nowrap items-center gap-6 shrink-0 whitespace-nowrap">
          <nav className="flex items-center gap-6 text-sm text-on-dark-muted">
            <Link to="/guide" className="hover:text-on-dark transition-colors cursor-pointer" activeProps={{ className: "text-on-dark" }}>使用说明</Link>
            <Link to="/faq" className="hover:text-on-dark transition-colors cursor-pointer" activeProps={{ className: "text-on-dark" }}>常见问题</Link>
            <Link to="/api" className="hover:text-on-dark transition-colors cursor-pointer" activeProps={{ className: "text-on-dark" }}>开发者 / API</Link>
          </nav>
          <LoginMenu>
            <button aria-label="登录" title="登录" className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
              <User className="h-4 w-4" />登录
            </button>
          </LoginMenu>
        </div>
      </div>
    </header>
  );
}
