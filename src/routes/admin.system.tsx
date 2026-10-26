import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader } from "@/components/workbench/ui";
import { CrudTable, type Col } from "@/components/workbench/CrudTable";
import { systemTabs } from "@/components/workbench/Workbench";
import { users } from "@/lib/mock";
import { SystemLogs } from "@/components/workbench/SystemLogs";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [
    { title: "系统管理 | 作物表型管理平台" },
    { name: "description", content: "统一管理平台用户、角色、部门、菜单、岗位、字典与操作日志。" },
    { property: "og:title", content: "系统管理 | 作物表型管理平台" },
    { property: "og:description", content: "作物表型平台系统配置与操作记录管理。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: z.object({ tab: z.string().optional() }),
  component: System,
});

type Conf = { desc: string; cols: Col[]; rows: Record<string, string | number>[]; extra?: string[]; confirm?: string[]; child?: string; io?: boolean; indent?: string; sort?: boolean };
const confs: Record<string, Conf> = {
  users: { desc: "按用户名、手机号模糊搜索；修改、删除、重置密码、分配角色；导入导出", io: true, extra: ["分配角色"], confirm: ["重置密码"],
    cols: [{ key: "id", label: "编号" }, { key: "name", label: "用户名" }, { key: "nick", label: "昵称" }, { key: "dept", label: "部门" }, { key: "role", label: "角色" }, { key: "phone", label: "手机号" }, { key: "status", label: "状态", badge: true }, { key: "created", label: "创建时间" }],
    rows: users.map((u) => ({ ...u, status: u.status ? "正常" : "停用" })) },
  roles: { desc: "增删改角色，设置数据权限，分配角色给用户", extra: ["数据权限", "分配用户"],
    cols: [{ key: "name", label: "角色名称" }, { key: "key", label: "权限字符" }, { key: "scope", label: "数据权限" }, { key: "sort", label: "排序" }, { key: "status", label: "状态", badge: true }],
    rows: [{ name: "超级管理员", key: "admin", scope: "全部数据", sort: 1, status: "正常" }, { name: "课题负责人", key: "pi", scope: "本部门及以下", sort: 2, status: "正常" }, { name: "数据审核员", key: "auditor", scope: "全部数据（只读+审核）", sort: 3, status: "正常" }, { name: "普通用户", key: "common", scope: "仅本人数据", sort: 4, status: "正常" }] },
  menus: { desc: "管理菜单排序、名称、权限字符、组件路径与状态", child: "新增子菜单", indent: "name",
    cols: [{ key: "name", label: "菜单名称" }, { key: "sort", label: "排序" }, { key: "perm", label: "权限字符" }, { key: "path", label: "组件路径" }, { key: "status", label: "状态", badge: true }],
    rows: [{ level: 0, name: "表型数据", sort: 1, perm: "pheno:data", path: "pheno/data/index", status: "正常" }, { level: 1, name: "数据管理", sort: 1, perm: "pheno:data:list", path: "pheno/data/list", status: "正常" }, { level: 0, name: "表型图片", sort: 2, perm: "pheno:image", path: "pheno/image/index", status: "正常" }, { level: 0, name: "系统管理", sort: 9, perm: "system", path: "Layout", status: "正常" }, { level: 1, name: "用户管理", sort: 1, perm: "system:user:list", path: "system/user/index", status: "正常" }] },
  depts: { desc: "树状展示部门，可修改信息、创建子部门", child: "新增子部门", indent: "name",
    cols: [{ key: "name", label: "部门名称" }, { key: "leader", label: "负责人" }, { key: "sort", label: "排序" }, { key: "status", label: "状态", badge: true }],
    sort: true, rows: [{ level: 0, name: "作物表型研究中心", leader: "admin", sort: 0, status: "正常" }, { level: 1, name: "小麦育种课题组", leader: "曾老师", sort: 1, status: "正常" }, { level: 1, name: "玉米课题组", leader: "王芳", sort: 2, status: "正常" }, { level: 1, name: "水稻课题组", leader: "张强", sort: 3, status: "正常" }, { level: 1, name: "平台研发组", leader: "admin", sort: 4, status: "正常" }] },
  posts: { desc: "管理用户岗位信息",
    cols: [{ key: "code", label: "岗位编码" }, { key: "name", label: "岗位名称" }, { key: "sort", label: "排序" }, { key: "status", label: "状态", badge: true }],
    rows: [{ code: "pi", name: "课题负责人", sort: 1, status: "正常" }, { code: "researcher", name: "科研人员", sort: 2, status: "正常" }, { code: "student", name: "研究生", sort: 3, status: "正常" }, { code: "tech", name: "田间技术员", sort: 4, status: "正常" }] },
  dicts: { desc: "定义系统固定信息（如 sys_user_sex、crop_type），点击字典类型查看标签与键值", extra: ["字典数据"],
    cols: [{ key: "name", label: "字典名称" }, { key: "type", label: "字典类型" }, { key: "items", label: "数据项" }, { key: "status", label: "状态", badge: true }],
    rows: [{ name: "用户性别", type: "sys_user_sex", items: "男 / 女 / 未知", status: "正常" }, { name: "作物类型", type: "crop_type", items: "小麦 / 玉米 / 水稻 / 大豆", status: "正常" }, { name: "生育期", type: "growth_stage", items: "苗期 / 拔节 / 抽穗 / 成熟", status: "正常" }, { name: "审核状态", type: "review_status", items: "草稿 / 待审核 / 已审核 / 已驳回", status: "正常" }] },
  params: { desc: "系统参数配置",
    cols: [{ key: "name", label: "参数名称" }, { key: "key", label: "键名" }, { key: "value", label: "键值" }],
    rows: [{ name: "上传文件大小上限", key: "upload.maxSize", value: "2 GB" }, { name: "远程连接端口", key: "remote.port", value: "9999" }, { name: "回收站保留天数", key: "trash.days", value: "30" }] },
  logs: { desc: "操作日志与登录日志，支持按用户、时间、数据对象追溯",
    cols: [{ key: "user", label: "操作人" }, { key: "act", label: "操作" }, { key: "obj", label: "对象" }, { key: "ip", label: "IP" }, { key: "time", label: "时间" }, { key: "status", label: "结果", badge: true }],
    rows: [{ user: "曾老师", act: "上传", obj: "wheat_xx_2025_drought.csv", ip: "10.2.1.18", time: "2026-10-02 14:21", status: "成功" }, { user: "admin", act: "审核通过", obj: "maize_inbred_2024.csv", ip: "10.2.1.2", time: "2026-10-01 10:03", status: "成功" }, { user: "wangfang", act: "登录", obj: "系统", ip: "10.2.3.7", time: "2026-09-30 08:12", status: "失败" }] },
};

function System() {
  const { tab = "users" } = Route.useSearch();
  const conf = confs[tab] ?? confs["users"];
  if (!conf) return null;
  const label = systemTabs.find((t) => t.tab === tab)?.label ?? "用户管理";
  return (
    <div>
      <PageHeader title={label} desc={conf.desc} />
      {tab === "logs" ? <SystemLogs /> : <CrudTable key={tab} pagination storeKey={`system:${tab}`} cols={conf.cols} rows={conf.rows} extraActions={conf.extra ?? []} confirmActions={conf.confirm ?? []} childAction={conf.child ?? ""} importExport={!!conf.io} indentKey={conf.indent ?? ""} sortKey={conf.sort ? "sort" : ""} />}
    </div>
  );
}
