import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Smartphone, ShieldCheck, KeyRound, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoBackdrop } from "@/components/site/PhotoBackdrop";
import { Brand } from "@/components/site/Brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "找回密码 — 作物表型管理平台" },
      { name: "description", content: "通过手机号验证找回作物表型管理平台账号密码。" },
      { property: "og:title", content: "找回密码 — 作物表型管理平台" },
      { property: "og:description", content: "手机号验证找回密码。" },
    ],
  }),
  component: Forgot,
});

const steps = [{ t: "验证手机号", i: Smartphone }, { t: "输入验证码", i: ShieldCheck }, { t: "设置新密码", i: KeyRound }];

function Forgot() {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [cd, setCd] = useState(0);
  const navigate = useNavigate();
  useEffect(() => { if (cd <= 0) return undefined; const t = setTimeout(() => setCd(cd - 1), 1000); return () => clearTimeout(t); }, [cd]);
  const field = "w-full rounded-xl border border-input px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-ring bg-transparent";
  return (
    <PhotoBackdrop>
      <div className="p-4 md:p-6"><Brand dark /></div>
      <main className="flex-1 grid place-items-center px-4 pb-16">
        <div className="w-full max-w-md bg-card rounded-3xl shadow-lift p-8 md:p-10">
          <h1 className="text-2xl font-bold text-center">找回密码</h1>
          <ol className="mt-6 flex items-center justify-between">
            {steps.map((s, i) => (
              <li key={s.t} className="flex flex-col items-center gap-1.5 flex-1">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full text-sm", i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {i < step ? <Check className="h-4 w-4" /> : <s.i className="h-4 w-4" />}
                </span>
                <span className={cn("text-xs", i <= step ? "text-foreground" : "text-muted-foreground")}>{s.t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 space-y-4">
            {step === 0 && (<>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入绑定的手机号" className={field} />
              <Button className="w-full h-12 rounded-xl" onClick={() => { if (!/^1\d{10}$/.test(phone)) { toast.error("请输入正确的 11 位手机号"); return; } setStep(1); setCd(60); toast.success("验证码已发送"); }}>获取验证码</Button>
            </>)}
            {step === 1 && (<>
              <p className="text-sm text-muted-foreground">验证码已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</p>
              <div className="flex gap-2">
                <input placeholder="6 位验证码" className={field} maxLength={6} />
                <Button variant="outline" disabled={cd > 0} className="h-12 rounded-xl shrink-0" onClick={() => setCd(60)}>{cd > 0 ? `${cd}s` : "重新发送"}</Button>
              </div>
              <Button className="w-full h-12 rounded-xl" onClick={() => setStep(2)}>下一步</Button>
            </>)}
            {step === 2 && (<>
              <input type="password" placeholder="新密码（至少 8 位）" className={field} />
              <input type="password" placeholder="确认新密码" className={field} />
              <Button className="w-full h-12 rounded-xl" onClick={() => { toast.success("密码已重置，请重新登录"); navigate({ to: "/login/user" }); }}>完成</Button>
            </>)}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground"><Link to="/login/user" className="hover:text-primary">返回登录</Link></p>
        </div>
      </main>
    </PhotoBackdrop>
  );
}
