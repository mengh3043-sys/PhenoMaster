import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { findSourceLink, PLACEHOLDER_URL } from "@/lib/source-link.functions";

export function SourceLinkButton({ title, hint }: { title: string; hint?: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    // open tab synchronously to avoid popup blockers, then set its URL
    const win = window.open("about:blank", "_blank");
    setLoading(true);
    try {
      const r = await findSourceLink({ data: { title, hint } });
      if (!r.found) toast.info("原文链接待补充");
      if (win) win.location.href = r.url; else window.open(r.url, "_blank");
    } catch (e) {
      console.error(e);
      toast.error("原文链接待补充");
      if (win) win.location.href = PLACEHOLDER_URL; else window.open(PLACEHOLDER_URL, "_blank");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button onClick={onClick} disabled={loading} variant="outline" className="rounded-xl w-fit">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      {loading ? "正在搜索原文…" : "查看原文"}
    </Button>
  );
}
