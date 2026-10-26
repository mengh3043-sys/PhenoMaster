import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Workbench } from "@/components/workbench/Workbench";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理员工作台 — 作物表型管理平台" },
      { name: "description", content: "数据概览、审核、元数据与系统管理。" },
      { property: "og:title", content: "管理员工作台 — 作物表型管理平台" },
      { property: "og:description", content: "管理员工作台。" },
    ],
  }),
  component: () => <Workbench role="admin"><Outlet /></Workbench>,
});
