import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/parallel";
export const PLACEHOLDER_URL = "https://example.com/placeholder";

export const findSourceLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ title: z.string().min(1).max(200), hint: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const parallelKey = process.env["PARALLEL_API_KEY"];
    if (!lovableKey || !parallelKey) return { url: PLACEHOLDER_URL, found: false, error: "连接器未配置" };
    const res = await fetch(`${GATEWAY_URL}/v1/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": parallelKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        objective: `找到这篇农业科研资讯/论文/报道的原文网页：「${data.title}」${data.hint ? `（来源线索：${data.hint}）` : ""}。优先期刊官网、农业农村部或科研机构网站。`,
        search_queries: [data.title.slice(0, 60)],
        mode: "fast",
        advanced_settings: { max_results: 3 },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Parallel search failed [${res.status}]: ${body}`);
      return { url: PLACEHOLDER_URL, found: false, error: `搜索失败 [${res.status}]` };
    }
    const json = (await res.json()) as { results?: { url?: string }[] };
    const url = json.results?.find((r) => r.url?.startsWith("http"))?.url;
    return url ? { url, found: true, error: null } : { url: PLACEHOLDER_URL, found: false, error: null };
  });
