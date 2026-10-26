import { act, renderHook, render, fireEvent, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useListPagination } from "@/components/workbench/useListPagination";
import { FullPagination } from "@/components/workbench/FullPagination";

afterEach(cleanup);

describe("System list pagination", () => {
  const rows = Array.from({ length: 25 }, (_, i) => i + 1);
  it("defaults to ten records and selects the next ten without losing their identity", () => {
    const { result } = renderHook(() => useListPagination(rows));
    expect(result.current.pageSize).toBe(10);
    expect(result.current.pageRows).toEqual(rows.slice(0, 10));
    act(() => result.current.setPage(2));
    expect(result.current.pageRows).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
  it("resets on size changes and clamps after filtering or deletion", () => {
    const { result, rerender } = renderHook(({ data }) => useListPagination(data), { initialProps: { data: rows } });
    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(20));
    expect(result.current.page).toBe(1);
    expect(result.current.pageRows).toHaveLength(20);
    act(() => result.current.setPage(2));
    rerender({ data: [1, 2] });
    expect(result.current.page).toBe(1);
    expect(result.current.pageRows).toEqual([1, 2]);
  });
  it("allows clearing the current page input and jumping with Enter or blur", () => {
    const onPage = vi.fn();
    render(<FullPagination total={35} page={2} pageSize={10} onPage={onPage} onPageSize={vi.fn()} sizes={[10, 20, 50, 100]} />);
    const input = screen.getByLabelText("跳转页码") as HTMLInputElement;
    expect(input.value).toBe("2");
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    fireEvent.blur(input);
    expect(input.value).toBe("2");
    expect(onPage).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onPage).toHaveBeenLastCalledWith(3);
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);
    expect(onPage).toHaveBeenLastCalledWith(4);
  });
});