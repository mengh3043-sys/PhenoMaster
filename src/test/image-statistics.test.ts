import { describe, expect, it } from "vitest";
import { STATISTICS_DEFAULT_RANGE, statisticsRecords, summarizeStatistics, getStatisticsVarieties, directoryStatisticsScope, directoryStatisticsRecords, multiDirectoryStatisticsScope } from "../store/imageStatistics";
import { mockImageData, mockVarieties, mockImagesByNode, mockImageTree, migrateDemoImages, visibleImages } from "../store/imageData";

describe("image statistics", () => {
  it("includes multiple crops and the reference Beijing node has 17 images", () => {
    expect([...new Set(mockVarieties.map((v) => v.crop))]).toEqual(["玉米", "水稻", "小麦", "大豆", "油菜"]);
    expect(mockImagesByNode["demo-maize-cubic-beijing"]).toHaveLength(17);
    expect(visibleImages(mockImagesByNode, mockImageTree)).toHaveLength(166);
  });
  it("preserves uploaded files when replacing the older demo and migrates only once", () => {
    const upload = { id: 123456, src: "data:image/jpeg;base64,test", label: "健康", name: "我的图片.jpg" };
    const result = migrateDemoImages({ i1: [{ id: 3000, src: "pool:0", label: "健康", name: "旧演示.jpg" }, upload] });
    expect(result["i1"]).toEqual([upload]);
    expect(result["demo-maize-cubic-beijing"]).toHaveLength(17);
    expect(migrateDemoImages(result)).toBe(result);
  });
  it("aggregates direct children and isolates the selected leaf", () => {
    const tree = [{ id: "root", name: "种苗图片", public: true, children: [
      { id: "test", name: "test11", public: true, children: [{ id: "team", name: "曾老师课题组", public: true }] },
      { id: "field", name: "实验田一", public: true }, { id: "private", name: "私有", public: false }
    ] }];
    const image = { id: 1, src: "pool:0", label: "健康", date: "2024-01-11" };
    const byNode = { test: [image], team: [{ ...image, id: 2 }], field: [{ ...image, id: 3 }], private: [{ ...image, id: 4 }] };
    const root = directoryStatisticsScope(byNode, tree, "root");
    expect(root.groups.map((g) => g.name)).toEqual(["test11", "实验田一"]);
    expect(root.groups.map((g) => g.images.length)).toEqual([2, 1]);
    expect(root.images).toHaveLength(3);
    expect(directoryStatisticsScope(byNode, tree, "team").images).toHaveLength(1);
    expect(directoryStatisticsRecords(root.groups, "2024-01-11", "2024-01-11").map((r) => r.count)).toEqual([2, 1]);
    expect(directoryStatisticsScope(byNode, tree, "all-images").groups.map((g) => g.name)).toEqual(["种苗图片"]);
  });
  it("merges multiple directories and removes parent-child overlap", () => {
    const combined = multiDirectoryStatisticsScope(mockImagesByNode, mockImageTree, ["demo-crop-玉米", "demo-maize-cubic-beijing", "demo-rice-jiangsu"]);
    expect(combined.images).toHaveLength(130);
    expect(new Set(combined.images.map((im) => im.id)).size).toBe(130);
    expect(multiDirectoryStatisticsScope(mockImagesByNode, mockImageTree, []).images).toHaveLength(0);
  });
  it("excludes empty parent and child series while retaining the 4+1+1 KPI total", () => {
    const tree = [{ id: "seedlings", name: "种苗图片", public: true, children: [
      { id: "test11", name: "test11", public: true },
      { id: "field", name: "实验田一", public: true },
      { id: "rice", name: "水稻虫害", public: true },
      { id: "empty", name: "空目录", public: true }
    ] }];
    const image = { id: 1, src: "pool:0", label: "健康", date: "2024-01-11" };
    const byNode = { seedlings: [], test11: [1, 2, 3, 4].map((id) => ({ ...image, id })), field: [{ ...image, id: 5 }], rice: [{ ...image, id: 6 }], empty: [] };
    const scope = directoryStatisticsScope(byNode, tree, "seedlings");
    expect(scope.groups.map((group) => group.name)).toEqual(["test11", "实验田一", "水稻虫害"]);
    expect(scope.groups.map((group) => group.images.length)).toEqual([4, 1, 1]);
    const records = directoryStatisticsRecords(scope.groups, image.date, image.date);
    expect([...new Set(records.map((record) => record.varietyName))]).toEqual(["test11", "实验田一", "水稻虫害"]);
    expect(summarizeStatistics(statisticsRecords(scope.images, image.date, image.date), image.date, image.date).total).toBe(6);
    expect(directoryStatisticsScope(byNode, tree, "empty").groups).toEqual([]);
  });
  it("spreads demo dates across January, February, March and April without losing records", () => {
    expect([...new Set(mockImageData.map((im) => im.date?.slice(0, 7)))].sort()).toEqual(["2024-01", "2024-02", "2024-03", "2024-04"]);
    expect(mockImageData.filter((im) => (im.date ?? "") < "2024-03-01").length).toBeGreaterThan(80);
  });
  it("uses the requested default dates", () => {
    expect(STATISTICS_DEFAULT_RANGE).toEqual({ from: "2024-01-11", to: "2024-04-10" });
  });
  it("keeps every daily series within the requested 0–8 axis", () => {
    const counts = statisticsRecords(mockImageData, STATISTICS_DEFAULT_RANGE.from, STATISTICS_DEFAULT_RANGE.to).map((r) => r.count);
    expect(Math.max(...counts)).toBeLessThanOrEqual(8);
    expect(Math.min(...counts)).toBe(0);
  });
  it("derives the reference-style varying counts from the shared list", () => {
    const records = statisticsRecords(mockImageData, "2024-01-11", "2024-04-10");
    const summary = summarizeStatistics(records, "2024-01-11", "2024-04-10");
    expect(summary.total).toBe(166);
    expect(summary.varieties).toBe(12);
    expect(getStatisticsVarieties(mockImageData).map((v) => records.filter((r) => r.varietyId === v.name).reduce((s, r) => s + r.count, 0))).toEqual([17, 12, 18, 18, 12, 14, 15, 12, 12, 20, 15, 1]);
  });
  it("recalculates after deletion, upload and relabeling", () => {
    const images = mockImageData.slice(1).map((im, i) => i === 0 ? { ...im, label: "病害" } : im);
    const removed = summarizeStatistics(statisticsRecords(images, "2024-01-11", "2024-04-10"), "2024-01-11", "2024-04-10");
    expect(removed.total).toBe(165);
    expect(removed.abnormal).toBe(12);
    const first = images[0];
    if (!first) throw new Error("Missing seed image");
    const added = summarizeStatistics(statisticsRecords([...images, { ...first, id: 123456 }], "2024-01-11", "2024-04-10"), "2024-01-11", "2024-04-10");
    expect(added.total).toBe(166);
  });
  it("excludes private and deleted folders from user statistics", () => {
    const tree = [{ id: "root", name: "根", public: true, children: [{ id: "private", name: "私有", public: false }] }];
    expect(visibleImages({ root: mockImageData, private: mockImageData, deleted: mockImageData }, tree)).toHaveLength(166);
  });
  it("computes the overview from only the inclusive selected dates", () => {
    const result = summarizeStatistics([
      { date: "2024-01-11", varietyId: "rice", varietyName: "水稻", count: 8, abnormal: 1 },
      { date: "2024-01-12", varietyId: "rice", varietyName: "水稻", count: 4, abnormal: 0 },
      { date: "2024-01-13", varietyId: "wheat", varietyName: "小麦", count: 6, abnormal: 1 },
    ], "2024-01-11", "2024-01-12");
    expect(result.total).toBe(12);
    expect(result.average).toBe(6);
    expect(result.varieties).toBe(1);
    expect(result.abnormal).toBe(1);
  });
});