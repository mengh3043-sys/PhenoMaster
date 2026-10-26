import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { analysisSelectionStore, resolveAnalysisSelection, selectAnalysisObject, selectAnalysisObjects } from "@/store/analysisSelection";

beforeEach(() => analysisSelectionStore.reset());
afterEach(cleanup);

describe("Analysis selection memory", () => {
  it("keeps the same file after the analysis screen unmounts and mounts again", () => {
    const first = renderHook(() => analysisSelectionStore.useStore());
    act(() => selectAnalysisObject("admin", "f10231"));
    first.unmount();
    const returned = renderHook(() => analysisSelectionStore.useStore());
    expect(returned.result.current[0].admin.objectId).toBe("f10231");
    expect(JSON.parse(localStorage.getItem("phenotype:analysisSelection") ?? "{}").admin.objectId).toBe("f10231");
  });
  it("shares one selection between single-object tabs and initializes multi-analysis from it", () => {
    selectAnalysisObject("admin", "f10231");
    const state = analysisSelectionStore.get().admin;
    expect(resolveAnalysisSelection(state, ["f10230", "f10231"])).toEqual({ objectId: "f10231", multiIds: ["f10231"] });
    selectAnalysisObjects("admin", ["f10231", "f10235"]);
    expect(analysisSelectionStore.get().admin).toEqual({ objectId: "f10231", multiIds: ["f10231", "f10235"] });
    selectAnalysisObject("admin", "id11");
    expect(resolveAnalysisSelection(analysisSelectionStore.get().admin, ["f10231", "id11"])).toEqual({ objectId: "id11", multiIds: ["id11"] });
  });
  it("never substitutes a different file when a saved file is missing and keeps roles independent", () => {
    selectAnalysisObject("admin", "f10231");
    selectAnalysisObject("user", "f10235");
    expect(resolveAnalysisSelection(analysisSelectionStore.get().admin, ["f10235"])).toEqual({ objectId: undefined, multiIds: [] });
    expect(analysisSelectionStore.get().user.objectId).toBe("f10235");
  });
});