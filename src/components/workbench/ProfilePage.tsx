import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatusBadge } from "./ui";
import type { Role } from "./Workbench";
import { useEffect, useState } from "react";
import { profileStore, opLogStore, logAction } from "@/store";

export function ProfilePage({ role }: { role: Role }) {
  const isAdmin = role === "admin";
  const [all, setAll] = profileStore.useStore();
  const saved = all[role];
  const [logs] = opLogStore.useStore();
  const myLogs = [...(logs[role] ?? [])].sort((a, b) => b.time.localeCompare(a.time));
  const [p, setP] = useState(saved);
  useEffect(() => setP(saved), [saved]);
  const [pwd, setPwd] = useState({ old: "", next: "", confirm: "" });
  const field = (k: keyof typeof p, label: string) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} /></div>
  );
  return (
    <div>
      <PageHeader title="个人中心" desc="修改个人资料与密码，查看权限、消息与操作记录" />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground text-3xl font-bold">{(saved.nick || "?").charAt(0).toUpperCase()}</span>
          <p className="mt-3 font-semibold">{saved.nick}</p>
          <p className="text-sm text-muted-foreground">{isAdmin ? "超级管理员" : "课题负责人"} · {saved.group}</p>
          <dl className="mt-5 text-sm text-left space-y-2">
            <div className="flex justify-between"><dt className="text-muted-foreground">手机</dt><dd>{saved.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">邮箱</dt><dd>{saved.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">注册</dt><dd>2024-05-12</dd></div>
          </dl>
        </Panel>
        <Panel>
          <Tabs defaultValue="info">
            <TabsList className="flex-wrap h-auto"><TabsTrigger value="info">基本资料</TabsTrigger><TabsTrigger value="pwd">修改密码</TabsTrigger><TabsTrigger value="perm">我的权限</TabsTrigger><TabsTrigger value="log">操作记录</TabsTrigger></TabsList>
            <TabsContent value="info" className="mt-5 grid sm:grid-cols-2 gap-4 max-w-2xl">
              {field("nick", "昵称")}{field("phone", "手机号")}{field("email", "邮箱")}{field("group", "课题组")}
              <div><Button onClick={() => { const labels = { nick: "昵称", phone: "手机号", email: "邮箱", group: "课题组" } as const;
                const changed = (Object.keys(labels) as (keyof typeof labels)[]).filter((k) => p[k] !== saved[k]).map((k) => labels[k]);
                if (!changed.length) { toast.info("资料没有变化"); return; }
                if (!p.nick.trim()) { logAction("修改个人资料：昵称为空", "失败", role); toast.error("昵称不能为空"); return; }
                setAll({ ...all, [role]: p }); logAction(`修改个人资料：${changed.join("、")}`, "成功", role); toast.success("资料已保存"); }}>保存</Button></div>
            </TabsContent>
            <TabsContent value="pwd" className="mt-5 space-y-4 max-w-sm">
              <div className="space-y-1.5"><Label>旧密码</Label><Input type="password" value={pwd.old} onChange={(e) => setPwd({ ...pwd, old: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>新密码</Label><Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>确认新密码</Label><Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
              <Button onClick={() => {
                if (!pwd.old || pwd.next.length < 6) { toast.error("请填写旧密码，新密码至少 6 位"); return; }
                if (pwd.next !== pwd.confirm) { toast.error("两次输入的新密码不一致"); return; }
                setPwd({ old: "", next: "", confirm: "" }); toast.success("密码已修改");
              }}>修改密码</Button>
            </TabsContent>
            <TabsContent value="perm" className="mt-5 flex flex-wrap gap-2">
              {(isAdmin ? ["全部数据", "数据审核", "系统管理", "元数据管理", "运维监控"] : ["公开数据查看", "本课题组材料/试验", "表型数据上传", "图片上传与标注", "分析工具"]).map((p) => <span key={p} className="rounded-full bg-primary-soft text-accent-foreground px-3 py-1 text-sm">{p}</span>)}
            </TabsContent>
            <TabsContent value="log" className="mt-5">
              <ul className="divide-y text-sm">
                {myLogs.map((l) => (
                  <li key={l.id} className="py-2.5 flex items-center gap-3"><span className="flex-1">{l.desc}</span><span className="text-xs text-muted-foreground font-display">{l.time}</span><StatusBadge status={l.status} /></li>
                ))}
                {myLogs.length === 0 && <li className="py-6 text-center text-muted-foreground">暂无操作记录</li>}
              </ul>
            </TabsContent>
          </Tabs>
        </Panel>
      </div>
    </div>
  );
}
