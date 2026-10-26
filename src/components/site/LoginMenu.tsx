import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roles = [
  { to: "/login/admin" as const, icon: ShieldCheck, title: "管理员", sub: "数据审核 · 元数据 · 系统管理" },
  { to: "/login/user" as const, icon: UserRound, title: "普通用户", sub: "上传表型 · 图片标注 · 分析工具" },
];

/** 登录入口下拉菜单：触发器由调用方提供，菜单内含管理员 / 普通用户两个入口，登录逻辑不变 */
export function LoginMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground">请选择你的身份登录</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((r) => (
          <DropdownMenuItem key={r.title} asChild className="cursor-pointer p-0">
            <Link to={r.to} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <r.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{r.sub}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
