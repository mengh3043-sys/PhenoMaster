import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { filesStore, registerSpecies, speciesSeed } from "@/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/workbench/ui";
import { CrudTable } from "@/components/workbench/CrudTable";

export const Route = createFileRoute("/admin/metadata")({ component: Meta });

const sets = {
  物种: { cols: [{ key: "name", label: "物种" }, { key: "latin", label: "学名" }, { key: "count", label: "材料数" }], rows: speciesSeed },
  群体: { cols: [{ key: "name", label: "群体" }, { key: "type", label: "类型" }, { key: "size", label: "规模" }], rows: [{ name: "黄淮冬麦自然群体", type: "自然群体", size: 320 }, { name: "京724×京92 RIL", type: "重组自交系", size: 210 }] },
  性状: { cols: [{ key: "name", label: "性状" }, { key: "unit", label: "单位" }, { key: "method", label: "测量方法" }, { key: "stage", label: "生育期" }], rows: [{ name: "株高", unit: "cm", method: "直尺/激光雷达", stage: "成熟期" }, { name: "千粒重", unit: "g", method: "电子天平", stage: "收获后" }, { name: "NDVI", unit: "-", method: "多光谱 UAV", stage: "全生育期" }] },
  环境因子: { cols: [{ key: "name", label: "因子" }, { key: "unit", label: "单位" }, { key: "src", label: "来源" }], rows: [{ name: "日均温", unit: "℃", src: "气象站" }, { name: "土壤含水量", unit: "%", src: "土壤传感器" }, { name: "降水量", unit: "mm", src: "气象站" }] },
};

function Meta() {
  const [files] = filesStore.useStore();
  // 补录：已上传文件中出现、但物种列表还没有的作物（不重复计数）
  useEffect(() => { files.forEach((f) => registerSpecies(`${f.name} ${f.desc} ${f.crop}`, false)); }, [files]);
  return (
    <div>
      <PageHeader title="基本信息" desc="元数据管理：物种、群体、性状、环境因子" />
      <Tabs defaultValue="物种">
        <TabsList>{Object.keys(sets).map((k) => <TabsTrigger key={k} value={k}>{k}</TabsTrigger>)}</TabsList>
        {Object.entries(sets).map(([k, v]) => <TabsContent key={k} value={k} className="mt-4"><CrudTable storeKey={`meta:${k}`} cols={v.cols} rows={v.rows} importExport /></TabsContent>)}
      </Tabs>
    </div>
  );
}
