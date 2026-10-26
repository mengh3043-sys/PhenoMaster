import { useState } from "react";
import { toast } from "sonner";
import { Search, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "./NodeDialogs";
import { Panel, StatusBadge } from "./ui";
import { opLogStore, profileStore, type OpLog } from "@/store";
import { FullPagination } from "./FullPagination";
import { useListPagination } from "./useListPagination";

type R = "user" | "admin";
type Row = OpLog & { role: R; nick: string; phone: string };

/** 操作日志：汇总管理员与普通用户在系统中的全部操作（来自全局操作记录 store）。 */
export function SystemLogs() {
  const [logs, setLogs] = opLogStore.useStore();
  const [profiles] = profileStore.useStore();
  const [kw, setKw] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);

  const all: Row[] = (["admin", "user"] as R[])
    .flatMap((role) => (logs[role] ?? []).map((l) => ({ ...l, role, nick: profiles[role].nick, phone: profiles[role].phone })))
    .sort((a, b) => b.time.localeCompare(a.time));
  const list = all.filter((r) => !q || r.nick.includes(q) || r.phone.includes(q));
  const pager = useListPagination(list);

  const update = (role: R, fn: (ls: OpLog[]) => OpLog[]) => setLogs((m) => ({ ...m, [role]: fn(m[role] ?? []) }));

  return (
    <Panel>
      <form className="flex flex-wrap items-center gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); setQ(kw.trim()); pager.setPage(1); }}>
        <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="操作人名称 / 手机号" className="pl-9" /></div>
        <Button size="sm" type="submit">搜索</Button>
        <Button size="sm" type="button" variant="outline" onClick={() => { setKw(""); setQ(""); pager.setPage(1); }}><RotateCcw />重置</Button>
        <span className="sm:ml-auto text-xs text-muted-foreground">共 {list.length} 条</span>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground bg-muted/50"><tr>{["操作人", "角色", "手机号", "操作", "时间", "结果"].map((h) => <th key={h} className="text-left p-2.5 font-medium whitespace-nowrap">{h}</th>)}<th className="p-2.5 text-right font-medium">操作</th></tr></thead>
        <tbody>
          {pager.pageRows.map((r) => (
            <tr key={`${r.role}-${r.id}`} className="border-t hover:bg-muted/40">
              <td className="p-2.5 whitespace-nowrap">{r.nick}</td>
              <td className="p-2.5 whitespace-nowrap text-muted-foreground">{r.role === "admin" ? "管理员" : "普通用户"}</td>
              <td className="p-2.5 font-display">{r.phone}</td>
              <td className="p-2.5">{r.desc}</td>
              <td className="p-2.5 font-display whitespace-nowrap">{r.time}</td>
              <td className="p-2.5"><StatusBadge status={r.status} /></td>
              <td className="p-2.5 text-right whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => setEdit(r)}><Pencil />修改</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDel(r)}><Trash2 />删除</Button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">暂无日志</td></tr>}
        </tbody>
      </table></div>
      <FullPagination total={list.length} page={pager.page} pageSize={pager.pageSize} onPage={pager.setPage} onPageSize={pager.setPageSize} sizes={[10, 20, 50, 100]} />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>修改日志（演示）</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">
            <div className="space-y-1.5"><Label>操作描述</Label><Input value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>结果</Label>
              <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as OpLog["status"] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="成功">成功</SelectItem><SelectItem value="失败">失败</SelectItem></SelectContent></Select>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>取消</Button>
            <Button onClick={() => { if (!edit) return; if (!edit.desc.trim()) { toast.error("请填写操作描述"); return; } update(edit.role, (ls) => ls.map((l) => (l.id === edit.id ? { ...l, desc: edit.desc, status: edit.status } : l))); setEdit(null); toast.success("日志已更新"); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} title="确认删除该条日志？" desc={del ? `${del.nick} · ${del.desc} · ${del.time}` : undefined} onClose={() => setDel(null)}
        onConfirm={() => { if (del) update(del.role, (ls) => ls.filter((l) => l.id !== del.id)); setDel(null); toast.success("日志已删除"); }} />
    </Panel>
  );
}
