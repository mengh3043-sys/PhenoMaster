import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/site/LoginCard";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "管理员登录 — 作物表型管理平台" },
      { name: "description", content: "管理员登录作物表型管理平台，进行数据审核与系统管理。" },
      { property: "og:title", content: "管理员登录 — 作物表型管理平台" },
      { property: "og:description", content: "管理员登录入口。" },
    ],
  }),
  component: () => <LoginCard role="admin" />,
});
