import { createPersistedStore } from "./persist";

export const MONITOR_REFRESH_MS = 30_000;
export type EndpointStatus = "正常" | "失败" | "超时";
export type MonitorEndpoint = { path: string; status: EndpointStatus; response: string };
export type MonitorLog = { id: string; endpoint: string; time: string; message: string; resolved: boolean };

export const demoPerformanceTrend = [
  { period: "24天前", availability: 99.85, response: 205 },
  { period: "20天前", availability: 99.91, response: 196 },
  { period: "16天前", availability: 99.87, response: 214 },
  { period: "12天前", availability: 99.95, response: 188 },
  { period: "8天前", availability: 99.90, response: 193 },
  { period: "4天前", availability: 99.94, response: 180 },
  { period: "今日", availability: 99.92, response: 182 },
];

export const monitorStore = createPersistedStore("monitor", {
  autoRefresh: false,
  lastUpdated: 0,
  endpoints: [
    { path: "/phenotypeFile/upload", status: "正常", response: "210ms" },
    { path: "/picture/upload", status: "正常", response: "640ms" },
    { path: "/analysis/trait", status: "正常", response: "1.2s" },
    { path: "/remote/connect", status: "失败", response: "超时" },
  ] as MonitorEndpoint[],
  logs: [
    { id: "remote-timeout", endpoint: "/remote/connect", time: "今日 09:42", message: "连接远程设备超过 30 秒，设备未响应。请检查设备网络与在线状态。", resolved: false },
    { id: "picture-timeout", endpoint: "/picture/upload", time: "今日 08:36", message: "图片上传请求超时，后续请求已恢复；请核对本次图片是否完整上传。", resolved: false },
    { id: "analysis-error", endpoint: "/analysis/trait", time: "今日 08:12", message: "分析任务缺少必要性状字段，任务未完成。请核对输入文件。", resolved: false },
  ] as MonitorLog[],
});

export function canRetryEndpoint(endpoint: MonitorEndpoint) {
  return endpoint.status === "失败" || endpoint.status === "超时";
}

/** Demo adapter: no production device or monitoring service is connected. */
export function completeDemoRetry(path: string) {
  const endpoint = monitorStore.get().endpoints.find((item) => item.path === path);
  if (!endpoint || !canRetryEndpoint(endpoint)) return false;
  monitorStore.set((state) => ({
    ...state,
    lastUpdated: Date.now(),
    endpoints: state.endpoints.map((item) => item.path === path ? { ...item, status: "正常", response: "320ms" } : item),
    logs: state.logs.map((log) => log.endpoint === path ? { ...log, resolved: true } : log),
  }));
  return true;
}

export function refreshMonitorSnapshot() {
  monitorStore.set((state) => ({ ...state, lastUpdated: Date.now() }));
}