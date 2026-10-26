import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/site/LoginCard";

export const Route = createFileRoute("/login/user")({
  head: () => ({
    meta: [
      { title: "用户登录 — 作物表型管理平台" },
      { name: "description", content: "普通用户登录作物表型管理平台，管理我的材料、试验与表型数据。" },
      { property: "og:title", content: "用户登录 — 作物表型管理平台" },
      { property: "og:description", content: "普通用户登录入口。" },
    ],
  }),
  component: () => <LoginCard role="user" />,
});
