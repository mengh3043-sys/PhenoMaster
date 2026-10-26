import { describe, expect, it } from "vitest";
import { comparisonConclusion, indicatorMaximum, normalizeIndicator } from "../components/workbench/traitComparison";

describe("trait comparison rules", () => {
  it("marks positive differences as above the mean", () => {
    expect(comparisonConclusion(1)).toBe("优于均值");
  });
  it("marks negative differences as below the mean", () => {
    expect(comparisonConclusion(-1)).toBe("低于均值");
  });
  it("marks a zero difference as equal", () => {
    expect(comparisonConclusion(0)).toBe("持平");
  });
  it("uses separate maxima for height, spike length and thousand-grain weight", () => {
    const maxima = [[80, 90], [8, 10], [40, 45]].map(indicatorMaximum);
    expect(maxima).toEqual([105, 15, 55]);
    expect(normalizeIndicator(90, maxima[0] ?? 0)).toBeCloseTo(85.7142857);
    expect(normalizeIndicator(10, maxima[1] ?? 0)).toBeCloseTo(66.6666667);
    expect(normalizeIndicator(45, maxima[2] ?? 0)).toBeCloseTo(81.8181818);
  });
});