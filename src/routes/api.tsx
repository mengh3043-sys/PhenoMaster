import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "开发者 / API — 作物表型管理平台" },
      { name: "description", content: "作物表型管理平台接口约定、统一响应结构、主要接口列表与硬件设备数据接入说明。" },
      { property: "og:title", content: "开发者 / API — 作物表型管理平台" },
      { property: "og:description", content: "平台开发者文档，含硬件设备数据接入。" },
    ],
  }),
  component: Api,
});

const endpoints = [
  ["GET", "/sidebarTree/list", "获取树状节点"],
  ["POST", "/sidebarTree", "新增子节点"],
  ["GET", "/phenotypeFile/list", "分页查询表型文件"],
  ["POST", "/phenotypeFile/upload", "上传 CSV 表型文件"],
  ["GET", "/phenotypeFile/preview/{id}", "预览文件内容"],
  ["POST", "/picture/upload", "批量上传节点图片"],
  ["POST", "/analysis/trait", "性状分析任务"],
];

const deviceEndpoints = [
  ["POST", "/device/register", "设备注册，绑定到指定节点/团队"],
  ["POST", "/device/token", "凭设备编号 + 密钥换取设备 Token（长期有效，可吊销）"],
  ["POST", "/device/heartbeat", "设备心跳上报（在线状态、电量、信号）"],
  ["POST", "/device/data/upload", "单条或批量上报传感器/采集数据"],
  ["POST", "/device/image/upload", "设备端图片直传，自动挂载到对应图片节点"],
  ["GET", "/device/data/query", "按设备、时间段查询上报数据"],
  ["GET", "/device/status", "查询设备在线状态与最近一次上报时间"],
];

function Api() {
  return (
    <InfoPage title="开发者 / API" intro="所有请求需携带 Authorization: Bearer <token>">
      <section>
        <h2 className="font-bold text-lg">统一响应结构</h2>
        <pre className="mt-3 rounded-xl bg-ink text-ink-foreground p-4 text-xs overflow-x-auto">{`// 普通响应
{ "code": 200, "msg": "操作成功", "data": { ... } }
// 分页响应
{ "code": 200, "msg": "查询成功", "total": 1234, "rows": [ ... ] }`}</pre>
      </section>
      <section>
        <h2 className="font-bold text-lg">主要接口</h2>
        <div className="mt-3 divide-y rounded-xl border">
          {endpoints.map(([m, p, d]) => (
            <div key={p} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-14 text-xs font-bold text-primary">{m}</span>
              <code className="font-mono">{p}</code>
              <span className="ml-auto text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-bold text-lg">硬件设备接入</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          面向配套硬件（田间传感器、表型采集仪器、无人机、监测站等）的数据接入。设备出厂时绑定到平台团队/节点，凭设备编号 + 密钥换取设备 Token 后即可持续上报数据；支持 HTTPS 上报与 MQTT 订阅两种方式，弱网环境可本地缓存、网络恢复后自动补传。上报数据自动按设备绑定的节点归档，进入表型数据与图片树。
        </p>
        <div className="mt-3 divide-y rounded-xl border">
          {deviceEndpoints.map(([m, p, d]) => (
            <div key={p} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-14 text-xs font-bold text-primary">{m}</span>
              <code className="font-mono">{p}</code>
              <span className="ml-auto text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
        <pre className="mt-3 rounded-xl bg-ink text-ink-foreground p-4 text-xs overflow-x-auto">{`// 设备数据上报示例（HTTPS）
POST /device/data/upload
Authorization: Bearer <device_token>
{
  "device_sn": "TPM-D-2026-0001",
  "recorded_at": "2026-10-16T09:30:00+08:00",
  "metrics": { "canopy_height_cm": 78.5, "ndvi": 0.72, "soil_moisture": 31.2 },
  "images": ["IMG_0001.jpg"]              // 可选，自动挂到对应图片节点
}
// 响应
{ "code": 200, "msg": "上报成功", "data": { "accepted": 1, "batch_id": "..." } }`}</pre>
      </section>
      <section>
        <h2 className="font-bold text-lg">BrAPI 兼容</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          平台接口兼容 Breeding API（BrAPI）v2 规范，试验、材料、性状与观测值可通过标准 BrAPI 端点访问，便于与外部育种信息系统互通。
        </p>
      </section>
      <section>
        <h2 className="font-bold text-lg">Python SDK</h2>
        <pre className="mt-3 rounded-xl bg-ink text-ink-foreground p-4 text-xs overflow-x-auto">{`pip install crop-phenotype
from crop_phenotype import Client
client = Client(token="<token>")
files = client.phenotype_files.list(node_id=12)`}</pre>
      </section>
      <section>
        <h2 className="font-bold text-lg">R package</h2>
        <pre className="mt-3 rounded-xl bg-ink text-ink-foreground p-4 text-xs overflow-x-auto">{`install.packages("cropPhenotype")
library(cropPhenotype)
con <- cp_connect(token = "<token>")
df <- cp_files(con, node_id = 12)`}</pre>
      </section>
    </InfoPage>
  );
}
