import { describe, expect, it } from "vitest";
import { countImages, fileSamples, matchesRegion } from "@/components/workbench/analysisScope";
import { dataTree, phenotypeFiles } from "@/lib/mock";

describe("analysis object filtering", () => {
  it("filters measurements to the selected file crop, year and location", () => {
    const file = phenotypeFiles.find(f => f.id === 10231);
    if (!file) throw new Error("Missing test fixture");
    const rows = fileSamples({ ...file, nodeId: "d11" }, dataTree);
    expect(rows.length).toBe(9);
    expect([...new Set(rows.map(r => r.year))]).toEqual(["2024"]);
    expect([...new Set(rows.map(r => r.site))]).toEqual(["郑州"]);
    expect(rows.some(r => r.material === "JM-22")).toBe(false);
  });
  it("returns no measurements when the selected crop has none", () => {
    const file = phenotypeFiles.find(f => f.id === 10235);
    if (!file) throw new Error("Missing test fixture");
    expect(fileSamples({ ...file, nodeId: "d31" }, dataTree)).toEqual([]);
  });
  it("counts images from only the selected records", () => {
    expect(countImages([{ id: 1, src: "", label: "健康" }, { id: 2, src: "", label: "健康" }, { id: 3, src: "", label: "倒伏" }], im => im.label)).toEqual([{ name: "健康", value: 2 }, { name: "倒伏", value: 1 }]);
  });
  it("keeps Zhengzhou and Xinxiang records separate and accepts Beijing and Jiangsu region aliases", () => {
    expect(matchesRegion("新乡-2025", "河南 · 郑州")).toBe(false);
    expect(matchesRegion("河南-2024", "河南 · 郑州")).toBe(true);
    expect(matchesRegion("郑州-2024", "河南 · 新乡")).toBe(false);
    expect(matchesRegion("北京", "北京 · 海淀")).toBe(true);
    expect(matchesRegion("江苏", "江苏 · 扬州")).toBe(true);
  });
});