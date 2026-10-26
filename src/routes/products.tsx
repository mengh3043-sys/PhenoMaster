import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Tractor, Thermometer, Camera } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";
import { BackHomeLink } from "@/components/site/BackHome";
import { CONTACT_EMAIL } from "@/lib/mock";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "产品推荐 — 作物表型管理平台" },
      { name: "description", content: "与平台联动的第三方表型采集硬件产品展示与合作。" },
      { property: "og:title", content: "产品推荐 — 作物表型管理平台" },
      { property: "og:description", content: "与平台联动的第三方表型采集硬件产品展示与合作。" },
    ],
  }),
  component: Products,
});

const products = [
  { icon: Plane, t: "无人机多光谱采集系统", d: "搭载多光谱相机的巡田无人机，NDVI 等植被指数数据可直接上报平台，与试验地块自动关联。" },
  { icon: Tractor, t: "龙门式田间表型车", d: "多相机同步采集株高、叶面积等性状，高通量覆盖小区试验，数据经设备接口直传平台。" },
  { icon: Thermometer, t: "田间环境传感器网络", d: "土壤温湿度、气象要素连续监测，通过设备 Token 心跳上报，支持异常告警。" },
  { icon: Camera, t: "高通量成像工作站", d: "温室苗期 RGB / 荧光成像，图片自动上传至平台图片节点，与表型文件按材料联动。" },
];

function Products() {
  return (
    <InfoPage title="产品推荐" intro="与平台联动的第三方表型采集硬件（演示内容）" back={<BackHomeLink />}>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.t} className="rounded-2xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold text-foreground">{p.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="font-bold text-lg text-primary">硬件厂商合作</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          平台已开放硬件设备接入接口（设备注册、心跳、数据上报、图片直传），第三方采集设备可通过设备编号 + 密钥接入并直接上报数据。接入规范详见{" "}
          <Link to="/api" className="inline-flex items-center gap-0.5 text-primary hover:underline underline-offset-4">
            开发者 / API 文档          </Link>
          。商务合作请联系 <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline underline-offset-4">{CONTACT_EMAIL}</a>。
        </p>
      </section>
    </InfoPage>
  );
}
