import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Workbench } from "@/components/workbench/Workbench";

export const Route = createFileRoute("/user")({
  head: () => ({
    meta: [
      { title: "用户工作台 — 作物表型管理平台" },
      { name: "description", content: "管理我的材料、试验、表型数据与图片，使用分析工具。" },
      { property: "og:title", content: "用户工作台 — 作物表型管理平台" },
      { property: "og:description", content: "普通用户工作台。" },
    ],
  }),
  component: () => <Workbench role="user"><Outlet /></Workbench>,
});
