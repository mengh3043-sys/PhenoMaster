import { useMemo, useState } from "react";
import { ChevronRight, FileSpreadsheet, Folder, Images, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ObjectOption = { id: string; kind: "file" | "image"; name: string; group?: string | undefined };
type Kind = ObjectOption["kind"];

/** Compact picker: data-source switch, accordion of folders (only the active one open), selected-items tags. */
export function AnalysisObjectSelector({ options, value, onChange, multiple, selected = [], onSelected }: {
  options: ObjectOption[]; value?: string | undefined; onChange?: (value: string) => void; multiple?: boolean; selected?: string[]; onSelected?: (ids: string[]) => void;
}) {
  const checked = multiple ? selected : value ? [value] : [];
  const first = options.find(o => o.id === (multiple ? selected[selected.length - 1] : value));
  const [kind, setKind] = useState<Kind>(first?.kind ?? "file");
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(first ? first.group || "未分组" : null);
  const groups = useMemo(() => {
    const kw = q.trim().toLowerCase(), map = new Map<string, ObjectOption[]>();
    options.filter(o => o.kind === kind && (!kw || `${o.group ?? ""} ${o.name}`.toLowerCase().includes(kw))).forEach(o => {
      const g = o.group || "未分组"; map.set(g, [...(map.get(g) ?? []), o]);
    });
    return [...map.entries()];
  }, [options, kind, q]);
  const setIds = (ids: string[], on: boolean) => {
    if (!multiple) { if (on && ids[0]) onChange?.(ids[0]); return; }
    onSelected?.(on ? [...new Set([...selected, ...ids])] : selected.filter(id => !ids.includes(id)));
  };
  const state = (ids: string[]) => { const n = ids.filter(id => checked.includes(id)).length; return n === 0 ? false : n === ids.length ? true : "indeterminate" as const; };
  const chosen = checked.map(id => options.find(o => o.id === id)).filter((o): o is ObjectOption => !!o);
  const searching = !!q.trim();

  return <div className="grid min-w-0 gap-3 rounded-lg border bg-card p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium">选择分析对象</span>
        <div className="ml-auto inline-flex rounded-md border p-0.5 text-xs" role="tablist">
          {(["file", "image"] as const).map(k => <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setOpenGroup(null); }} className={cn("rounded px-2.5 py-1", kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{k === "file" ? "🌱 表型数据" : "🖼️ 表型图片"}</button>)}
        </div>
      </div>
      <div className="relative mb-2"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索文件或目录" className="h-8 pl-8 text-xs" aria-label="搜索分析对象" /></div>
      <ul className="max-h-56 overflow-y-auto text-xs">
        {groups.map(([g, list]) => {
          const open = searching || openGroup === g, ids = list.map(o => o.id), n = ids.filter(id => checked.includes(id)).length;
          return <li key={g} className="border-b last:border-0">
            <div className="flex min-w-0 items-center gap-1.5 py-1.5">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 text-left" onClick={() => setOpenGroup(open && !searching ? null : g)}>
                <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-90")} />
                <Folder className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate" title={g}>{g.split(" / ").slice(-2).join(" / ")}</span>
                <span className="shrink-0 text-muted-foreground">{n ? `${n}/` : ""}{list.length}</span>
              </button>
              {multiple && <Checkbox checked={state(ids)} onCheckedChange={c => setIds(ids, !!c)} aria-label={`全选${g}`} />}
            </div>
            {open && <ul className="mb-1 ml-4 border-l pl-1">{list.map(o => <li key={o.id}>
              <label className={cn("flex min-w-0 cursor-pointer items-center gap-1.5 rounded px-1 py-1 hover:bg-muted", checked.includes(o.id) && "bg-primary-soft")}>
                <Checkbox checked={checked.includes(o.id)} onCheckedChange={c => { setIds([o.id], !!c); setOpenGroup(g); }} aria-label={`选择${o.name}`} />
                {kind === "file" ? <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-chart-3" /> : <Images className="h-3.5 w-3.5 shrink-0 text-chart-1" />}
                <span className="truncate" title={o.name}>{o.name}</span>
              </label>
            </li>)}</ul>}
          </li>;
        })}
        {!groups.length && <li className="py-2 text-muted-foreground">无匹配项</li>}
      </ul>
    </div>
    <div className="min-w-0 rounded-md bg-muted/40 p-2">
      <div className="mb-2 flex items-center text-xs"><span className="font-medium">已选对象（{chosen.length}）</span>
        {multiple && !!chosen.length && <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={() => onSelected?.([])}>清空</Button>}</div>
      <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
        {chosen.map(o => <span key={o.id} className="inline-flex max-w-full items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs">
          {o.kind === "file" ? <FileSpreadsheet className="h-3 w-3 shrink-0 text-chart-3" /> : <Images className="h-3 w-3 shrink-0 text-chart-1" />}
          <span className="truncate" title={o.name}>{o.name}</span>
          {multiple && <button type="button" aria-label={`取消选择${o.name}`} onClick={() => setIds([o.id], false)} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-3 w-3" /></button>}
        </span>)}
        {!chosen.length && <span className="text-xs text-muted-foreground">在左侧勾选文件后显示在这里</span>}
      </div>
    </div>
  </div>;
}
