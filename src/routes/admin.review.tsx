import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Copy, Archive, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, StatusBadge } from "@/components/workbench/ui";
import { filesStore } from "@/store";

export const Route = createFileRoute("/admin/review")({ component: Review });

function Review() {
  const [rows, setRows] = filesStore.useStore();
  const act = (id: number, status: "已审核" | "已驳回") => { setRows(rows.map((r) => (r.id === id ? { ...r, status } : r))); toast.success(status === "已审核" ? "已通过" : "已驳回并通知上传人"); };
  return (
    <div>
      <PageHeader title="数据审核" desc="审核用户上传数据，并进行清洗、去重、合并与归档" />
      <Tabs defaultValue="pheno">
        <TabsList className="flex-wrap h-auto"><TabsTrigger value="pheno">表型数据</TabsTrigger><TabsTrigger value="img">图片</TabsTrigger><TabsTrigger value="clean">清洗 / 归档</TabsTrigger></TabsList>
        <TabsContent value="pheno" className="mt-4">
          <Panel>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>{["ID", "文件", "上传人", "提交时间", "状态", "操作"].map((h) => <th key={h} className="text-left p-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2.5 font-mono text-xs">{r.id}</td><td className="p-2.5"><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.desc}</p></td>
                  <td className="p-2.5">{r.owner}</td><td className="p-2.5">{r.date}</td><td className="p-2.5"><StatusBadge status={r.status} /></td>
                  <td className="p-2.5 whitespace-nowrap">
                    <Button size="sm" variant="ghost" className="text-primary" onClick={() => act(r.id, "已审核")}><Check />通过</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act(r.id, "已驳回")}><X />驳回</Button>
                  </td>
                </tr>))}</tbody>
            </table></div>
          </Panel>
        </TabsContent>
        <TabsContent value="img" className="mt-4 grid gap-4 md:grid-cols-3">
          {[["水稻虫害", 120, "李明"], ["实验田一", 64, "王芳"], ["test11", 32, "曾老师"]].map(([n, c, u]) => (
            <Panel key={String(n)}><p className="font-semibold">{n}</p><p className="text-sm text-muted-foreground mt-1">{u} 提交 · {c} 张</p>
              <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => toast.success("已通过")}><Check />通过</Button><Button size="sm" variant="outline" onClick={() => toast.success("已驳回")}><X />驳回</Button></div></Panel>
          ))}
        </TabsContent>
        <TabsContent value="clean" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[{ i: Copy, t: "去重", d: "检测到 14 条重复记录" }, { i: Wand2, t: "修正", d: "3 处单位不一致（cm / mm）" }, { i: Copy, t: "合并", d: "2 个同试验文件可合并为新版本" }, { i: Archive, t: "归档", d: "2023 年及以前 216 个文件" }].map((x) => (
            <Panel key={x.t}><x.i className="h-6 w-6 text-primary" /><p className="font-semibold mt-3">{x.t}</p><p className="text-sm text-muted-foreground mt-1">{x.d}</p><Button size="sm" className="mt-4" onClick={() => toast.success(`${x.t}任务已执行`)}>执行</Button></Panel>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
