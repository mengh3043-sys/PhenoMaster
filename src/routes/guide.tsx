import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "使用说明 — 作物表型管理平台" },
      { name: "description", content: "作物表型管理平台功能简介、运行环境与各模块使用说明。" },
      { property: "og:title", content: "使用说明 — 作物表型管理平台" },
      { property: "og:description", content: "平台使用手册与操作指南。" },
    ],
  }),
  component: Guide,
});

const sections = [
  { t: "1. 平台简介", d: "通过用户输入、上传等方式将作物表型数据录入系统，以分层有序的树状结构存储，支持大文件压缩包上传、远程服务器自动导入、公开/私有权限控制和审计日志。" },
  { t: "2. 身份与入口", d: "首页选择【普通用户】或【管理员】进入对应登录页；登录后进入各自工作台，通过任务模块进入表型数据、表型图片、分析等功能。" },
  { t: "3. 表型数据", d: "左侧树状节点（表型数据为根）→ 选中节点 → 新增 CSV 文件 / 搜索（ID 精确、名称描述模糊）/ 预览 / 下载 / 修改属性 / 删除。上传向导：选择节点 → 下载模板 → 上传 → 校验 → 提交审核。" },
  { t: "4. 表型图片", d: "种苗图片为根节点。支持添加/修改/删除子节点、批量上传图片、设置节点详情（拍摄设备、时间、处理方式、关键字）、下载远程连接程序并通过目标机 IP + 目录（端口 9999）自动上传。" },
  { t: "5. 分析工具", d: "性状分析、表型与材料数量统计、性状管理、多试验性状分析（均值、极值、标准差、变异系数）、地区管理与材料系谱分析。" },
  { t: "6. 系统管理（管理员）", d: "用户、角色、菜单、部门、岗位、字典、参数与日志管理，基于“部门 + 角色 + 数据权限”三层控制。" },
  { t: "7. 运行环境", d: "客户端：Win7/Win8/Win10 及主流浏览器，支持手机与平板；服务器：Linux 或 Windows Server 2012 及以上。" },
];

function Guide() {
  return (
    <InfoPage title="使用说明" intro="依据《作物表型管理使用手册》整理">
      {sections.map((s) => (
        <section key={s.t}>
          <h2 className="font-bold text-lg text-primary">{s.t}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
        </section>
      ))}
    </InfoPage>
  );
}
