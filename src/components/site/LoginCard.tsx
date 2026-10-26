import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { Brand } from "./Brand";
import { CONTACT_EMAIL } from "@/lib/mock";
import { sessionStore, logAction } from "@/store";

export function LoginCard({ role }: { role: "user" | "admin" }) {
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [pwd, setPwd] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !pwd) { toast.error("请输入账号和密码"); return; }
    sessionStore.set({ role }); logAction("登录系统", "成功", role);
    toast.success("登录成功");
    navigate({ to: isAdmin ? "/admin" : "/user" });
  };
  return (
    <PhotoBackdrop>
      <div className="p-4 md:p-6 flex items-center justify-between">
        <Brand dark />
        <Link to="/" className="text-sm text-on-dark-muted hover:text-on-dark flex items-center gap-1"><ArrowLeft className="h-4 w-4" />返回首页</Link>
      </div>
      <main className="flex-1 grid place-items-center px-4 pb-16">
        <div className="w-full max-w-md">
          <form onSubmit={submit} className="bg-card rounded-3xl shadow-lift p-8 md:p-10">
            <h1 className="text-2xl font-bold text-center text-foreground">{isAdmin ? "管理员登录" : "作物表型管理平台"}</h1>
            <p className="text-center text-sm text-muted-foreground mt-1.5">{isAdmin ? "作物表型管理平台 · 管理员工作台" : "普通用户登录"}</p>
            <div className="mt-8 space-y-4">
              <label className="flex items-center gap-3 rounded-xl border border-input px-4 h-12 focus-within:ring-2 focus-within:ring-ring">
                <User className="h-4 w-4 text-muted-foreground" />
                <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="请输入账号" className="flex-1 bg-transparent outline-none text-sm" />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-input px-4 h-12 focus-within:ring-2 focus-within:ring-ring">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="请输入密码" className="flex-1 bg-transparent outline-none text-sm" />
              </label>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer"><Checkbox />记住密码</label>
                <Link to="/forgot-password" className="hover:text-primary">忘记密码</Link>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base">登录</Button>
            </div>
            <div className="mt-6 text-right text-xs text-muted-foreground">
              {isAdmin ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">没有账号？联系开发者</a>
              ) : (
                <>想成为管理员？<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">联系开发者</a></>
              )}
            </div>
          </form>
          {isAdmin && <p className="mt-4 text-center text-xs text-on-dark-muted">管理员账号需联系开发者开通</p>}
        </div>
      </main>
    </PhotoBackdrop>
  );
}
