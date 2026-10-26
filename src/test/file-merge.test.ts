import { describe, expect, it } from "vitest";
import { createMergedFile } from "../store/fileMerge";
import type { FileRow } from "../store";

const sources: FileRow[] = [1, 2].map((id) => ({ id, name: `trait_${id}.csv`, desc: "株高", crop: "小麦", owner: "曾老师", size: "2.0 MB", rows: 18, public: true, status: "已审核", date: "2024-01-11", nodeId: "d11" }));
const options = { id: 3, date: "2026-10-23", nodeId: "d1", owner: "曾老师" };
describe("mock file merge", () => {
  it("requires at least two distinct selected files", () => {
    expect(() => createMergedFile(sources.slice(0, 1), "material", options)).toThrow();
    expect(() => createMergedFile([sources[0], sources[0]] as FileRow[], "material", options)).toThrow();
  });
  it("uses the requested dated CSV filename", () => {
    expect(createMergedFile(sources, "material", options).name).toBe("Merged_20261023_trait_1.csv");
  });
  it("retains the selected strategy", () => {
    expect(createMergedFile(sources, "plot", options).merge?.strategy).toBe("plot");
    expect(createMergedFile(sources, "material", options).merge?.strategy).toBe("material");
  });
  it("preserves source snapshots after a source is renamed or removed", () => {
    const input = sources.map((file) => ({ ...file }));
    const output = createMergedFile(input, "material", options);
    const first = input[0];
    if (!first) throw new Error("Missing test source");
    first.name = "renamed.csv";
    input.pop();
    expect(output.merge?.sources.map((file) => file.name)).toEqual(["trait_1.csv", "trait_2.csv"]);
    expect(output.merge?.sources.map((file) => file.id)).toEqual([1, 2]);
  });
});