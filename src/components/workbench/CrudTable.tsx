import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, ArrowUpDown, Plus, Search, Upload, Download, Pencil, Trash2, RotateCcw, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "./NodeDialogs";
import { Panel, StatusBadge } from "./ui";
import { getListStore } from "@/store";
import { FullPagination } from "./FullPagination";
import { useListPagination } from "./useListPagination";

export type Col = { key: string; label: string; badge?: boolean };
type Row = Record<string, string | number>;

/** Sort a flat tree (rows carry `level`) by `key`, keeping each child block under its parent. */
function treeSort(rows: Row[], key: string, dir: "asc" | "desc"): Row[] {
  type N = { r: Row; kids: N[] };
  const root: N[] = []; const stack: { lvl: number; n: N }[] = [];
  for (const r of rows) {
    const lvl = Number(r["level"] ?? 0); const n: N = { r, kids: [] };
    while (stack.length && stack[stack.length - 1]!.lvl >= lvl) stack.pop();
    (stack.length ? stack[stack.length - 1]!.n.kids : root).push(n);
    stack.push({ lvl, n });
  }
  const sgn = dir === "asc" ? 1 : -1;
  const walk = (ns: N[]): Row[] => [...ns].sort((a, b) => sgn * (Number(a.r[key] ?? 0) - Number(b.r[key] ?? 0))).flatMap((n) => [n.r, ...walk(n.kids)]);
  return walk(root);
}

/**
 * Generic list with add / edit / delete / extra actions, all backed by local state.
 * `childAction` (e.g. "新增子部门") opens the add form pre-filled as a child of the row.
 * `confirmActions` (e.g. "重置密码") open a confirm dialog.
 */
export function CrudTable({ storeKey, cols, rows, extraActions = [], confirmActions = [], childAction = "", importExport = false, indentKey = "", sortKey = "", pagination = false }: {
  storeKey: string; cols: Col[]; rows: Row[]; extraActions?: string[]; confirmActions?: string[]; childAction?: string; importExport?: boolean; indentKey?: string; sortKey?: string; pagination?: boolean;
}) {
  const [q, setQ] = useState("");
  const [data, setData] = getListStore<Row[]>(storeKey, rows).useStore();
  const [form, setForm] = useState<null | { mode: "add" | "edit" | "child"; index: number; values: Row }>(null);
  const [del, setDel] = useState<number | null>(null);
  const [dir, setDir] = useState<"asc" | "desc" | null>(null);
  /** Persist rows; when a sort column is configured, keep them ordered by it. */
  const commit = (next: Row[], d = dir ?? "asc") => setData(sortKey ? treeSort(next, sortKey, d) : next);
  const [confirm, setConfirm] = useState<null | { action: string; index: number }>(null);

  const list = data.map((r, i) => ({ r, i })).filter(({ r }) => !q || Object.values(r).some((v) => String(v).includes(q)));
  const pager = useListPagination(list);
  const blank = (): Row => Object.fromEntries(cols.map((c) => [c.key, c.badge ? "正常" : ""]));
  const title = (r: Row) => String(r[cols[0]?.key ?? ""] ?? "");

  const save = () => {
    if (!form) return;
    const first = cols[0]?.key ?? "";
    if (!String(form.values[first] ?? "").trim()) { toast.error(`请填写${cols[0]?.label ?? ""}`); return; }
    if (form.mode === "edit") {
      commit(data.map((r, i) => (i === form.index ? form.values : r)));
      toast.success("修改成功");
    } else if (form.mode === "child") {
      const parent = data[form.index]!;
      const next = [...data];
      next.splice(form.index + 1, 0, { ...form.values, level: Number(parent["level"] ?? 0) + 1 });
      commit(next);
      toast.success(`已在「${title(parent)}」下新增`);
    } else {
      commit([...data, { ...form.values, level: 0 }]);
      toast.success("新增成功");
    }
    setForm(null);
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); pager.setPage(1); }} placeholder="模糊搜索（名称、手机号等）" className="pl-9" /></div>
        <Button variant="outline" size="sm" onClick={() => { setQ(""); pager.setPage(1); }}><RotateCcw />重置</Button>
        <div className="sm:ml-auto flex gap-2">
          <Button size="sm" onClick={() => setForm({ mode: "add", index: -1, values: blank() })}><Plus />新增</Button>
          {importExport && <>
            <Button size="sm" variant="outline" asChild><label className="cursor-pointer"><Upload />导入<input type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && toast.success(`已导入 ${e.target.files[0].name}`)} /></label></Button>
            <Button size="sm" variant="outline" onClick={() => toast.success(`已导出 ${data.length} 条记录`)}><Download />导出</Button>
          </>}
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground bg-muted/50"><tr>{cols.map((c) => <th key={c.key} className="text-left p-2.5 font-medium whitespace-nowrap">{c.key === sortKey ? (
          <button className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground" title="点击切换升序/降序" onClick={() => { const d = dir === "asc" ? "desc" : "asc"; setDir(d); commit(data, d); toast.success(d === "asc" ? "已按排序值升序" : "已按排序值降序"); }}>
            {c.label}{dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : dir === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
          </button>) : c.label}</th>)}<th className="p-2.5 text-right font-medium">操作</th></tr></thead>
        <tbody>{(pagination ? pager.pageRows : list).map(({ r, i }) => (
          <tr key={i} className="border-t hover:bg-muted/40">
            {cols.map((c) => (
              <td key={c.key} className="p-2.5 whitespace-nowrap" style={c.key === indentKey ? { paddingLeft: 10 + Number(r["level"] ?? 0) * 22 } : undefined}>
                {c.key === indentKey && Number(r["level"] ?? 0) > 0 && <span className="text-muted-foreground mr-1">└</span>}
                {c.badge ? (
                  <button onClick={() => { setData(data.map((x, j) => (j === i ? { ...x, [c.key]: x[c.key] === "正常" ? "停用" : "正常" } : x))); }} title="点击切换状态"><StatusBadge status={String(r[c.key])} /></button>
                ) : r[c.key]}
              </td>
            ))}
            <td className="p-2.5 text-right whitespace-nowrap">
              <Button size="sm" variant="ghost" onClick={() => setForm({ mode: "edit", index: i, values: { ...r } })}><Pencil />修改</Button>
              {childAction && <Button size="sm" variant="ghost" onClick={() => setForm({ mode: "child", index: i, values: blank() })}><Plus />{childAction}</Button>}
              {confirmActions.map((a) => <Button key={a} size="sm" variant="ghost" onClick={() => setConfirm({ action: a, index: i })}><KeyRound />{a}</Button>)}
              {extraActions.map((a) => <Button key={a} size="sm" variant="ghost" onClick={() => toast.success(`「${title(r)}」${a}：已保存`)}>{a}</Button>)}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDel(i)}><Trash2 />删除</Button>
            </td>
          </tr>))}
          {list.length === 0 && <tr><td colSpan={cols.length + 1} className="p-8 text-center text-muted-foreground">暂无数据</td></tr>}
        </tbody>
      </table></div>
      {pagination && <FullPagination total={list.length} page={pager.page} pageSize={pager.pageSize} onPage={pager.setPage} onPageSize={pager.setPageSize} sizes={[10, 20, 50, 100]} />}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form?.mode === "edit" ? "修改" : form?.mode === "child" ? `${childAction}（上级：${title(data[form.index] ?? {})}）` : "新增"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            {form && cols.filter((c) => !c.badge).map((c) => (
              <div key={c.key} className="space-y-1.5">
                <Label>{c.label}</Label>
                <Input value={String(form.values[c.key] ?? "")} onChange={(e) => setForm({ ...form, values: { ...form.values, [c.key]: e.target.value } })} />
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>取消</Button><Button onClick={save}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={del !== null} title={`确认删除「${del !== null ? title(data[del] ?? {}) : ""}」？`} desc="此操作不可恢复。" onClose={() => setDel(null)}
        onConfirm={() => { setData(data.filter((_, i) => i !== del)); setDel(null); toast.success("已删除"); }} />
      <ConfirmDialog open={!!confirm} title={`确认对「${confirm ? title(data[confirm.index] ?? {}) : ""}」执行${confirm?.action ?? ""}？`} desc={confirm?.action === "重置密码" ? "密码将重置为 123456，用户下次登录需修改。" : undefined} confirmText="确认"
        onClose={() => setConfirm(null)} onConfirm={() => { toast.success(`${confirm?.action ?? ""}成功`); setConfirm(null); }} />
    </Panel>
  );
}
