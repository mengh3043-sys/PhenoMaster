import { useEffect } from "react";
import { MONITOR_REFRESH_MS } from "@/store/monitor";

export function useMonitorRefresh(enabled: boolean, refresh: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(refresh, MONITOR_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);
}