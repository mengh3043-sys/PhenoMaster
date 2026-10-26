import { describe, expect, it } from "vitest";
import { isPublicSearchFile, matchesPublicSearch, normalizeSearchQuery } from "@/lib/public-search";

describe("Public search", () => {
  it("uses drought without the hashtag as shortcut input", () => {
    expect(normalizeSearchQuery("#drought")).toBe("drought");
  });
  it("matches the drought shortcut against existing Chinese basic results", () => {
    expect(matchesPublicSearch("drought", "黄淮麦区抗旱品种田间表型联合鉴定启动")).toBe(true);
    expect(matchesPublicSearch("drought", "水稻苗期表型采集")).toBe(false);
  });
  it("does not expose private data", () => {
    expect(isPublicSearchFile({ public: false, status: "已审核" })).toBe(false);
    expect(isPublicSearchFile({ public: true, status: "已审核" })).toBe(true);
  });
  it("does not expose unreviewed data", () => {
    expect(isPublicSearchFile({ public: true, status: "待审核" })).toBe(false);
    expect(isPublicSearchFile({ public: true, status: "已驳回" })).toBe(false);
  });
});