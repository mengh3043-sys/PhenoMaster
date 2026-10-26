import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function pageItems(cur: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const s = Math.max(2, cur - 2), e = Math.min(pages - 1, cur + 2);
  if (s > 2) out.push("…");
  for (let i = s; i <= e; i++) out.push(i);
  if (e < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export function FullPagination({ total, page, pageSize, onPage, onPageSize, unit = "条", sizes = [20, 50, 100] }: {
  total: number; page: number; pageSize: number; onPage: (p: number) => void; onPageSize: (n: number) => void; unit?: string; sizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(page, pages);
  const [jump, setJump] = useState(String(cur));
  useEffect(() => setJump(String(cur)), [cur]);
  const go = () => {
    const n = parseInt(jump, 10);
    if (isNaN(n)) { setJump(String(cur)); return; }
    const t = Math.min(pages, Math.max(1, n));
    onPage(t); setJump(String(t));
  };
  return (
    <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">共 {total} {unit} | 第 {cur} / {pages} 页</span>
      <Select value={String(pageSize)} onValueChange={(v) => { onPageSize(Number(v)); onPage(1); }}>
        <SelectTrigger className="h-8 w-28" aria-label="每页条数"><SelectValue /></SelectTrigger>
        <SelectContent>{sizes.map((n) => <SelectItem key={n} value={String(n)}>{n}{unit}/页</SelectItem>)}</SelectContent>
      </Select>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={cur <= 1} onClick={() => onPage(cur - 1)} aria-label="上一页"><ChevronLeft /></Button>
        {pageItems(cur, pages).map((p, i) => p === "…" ? (
          <span key={`e${i}`} className="w-8 text-center text-muted-foreground">…</span>
        ) : (
          <Button key={p} size="sm" variant={p === cur ? "default" : "outline"} className={cn("h-8 min-w-8 px-2", p === cur && "pointer-events-none")} onClick={() => onPage(p)} aria-current={p === cur ? "page" : undefined}>{p}</Button>
        ))}
        <Button size="icon" variant="outline" className="h-8 w-8" disabled={cur >= pages} onClick={() => onPage(cur + 1)} aria-label="下一页"><ChevronRight /></Button>
        <span className="ml-3 text-muted-foreground">前往</span>
        <Input value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") go(); }} onBlur={go} onFocus={(e) => e.target.select()} className="h-8 w-14 text-center" inputMode="numeric" aria-label="跳转页码" />
        <span className="text-muted-foreground">页</span>
      </div>
    </div>
  );
}
