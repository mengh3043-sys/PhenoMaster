import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canRetryEndpoint, completeDemoRetry, monitorStore } from "@/store/monitor";
import { useMonitorRefresh } from "@/hooks/use-monitor-refresh";

beforeEach(() => { monitorStore.reset(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Monitor actions", () => {
  it("allows retries only for failed or timed-out endpoints", () => {
    expect(canRetryEndpoint({ path: "/remote/connect", status: "失败", response: "超时" })).toBe(true);
    expect(canRetryEndpoint({ path: "/remote/connect", status: "超时", response: "30s" })).toBe(true);
    expect(canRetryEndpoint({ path: "/picture/upload", status: "正常", response: "640ms" })).toBe(false);
    expect(completeDemoRetry("/picture/upload")).toBe(false);
  });
  it("updates the retried endpoint and resolves only its related errors", () => {
    expect(completeDemoRetry("/remote/connect")).toBe(true);
    expect(monitorStore.get().endpoints.find((item) => item.path === "/remote/connect")?.status).toBe("正常");
    expect(monitorStore.get().logs.filter((log) => !log.resolved)).toHaveLength(2);
    expect(monitorStore.get().logs.find((log) => log.id === "picture-timeout")?.resolved).toBe(false);
    expect(JSON.parse(localStorage.getItem("phenotype:monitor") ?? "{}").endpoints[3].status).toBe("正常");
  });
  it("refreshes every 30 seconds only while enabled and stops on unmount", () => {
    const refresh = vi.fn();
    const hook = renderHook(({ enabled }) => useMonitorRefresh(enabled, refresh), { initialProps: { enabled: false } });
    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(0);
    hook.rerender({ enabled: true });
    act(() => vi.advanceTimersByTime(29_999));
    expect(refresh).toHaveBeenCalledTimes(0);
    act(() => vi.advanceTimersByTime(1));
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(2);
    hook.rerender({ enabled: false });
    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(2);
    hook.rerender({ enabled: true });
    hook.unmount();
    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});