import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <Sprout className="h-5 w-5" />
      </span>
      <span className={cn("font-bold tracking-wide whitespace-nowrap", dark ? "text-on-dark" : "text-foreground")}>
        作物表型管理平台
      </span>
    </Link>
  );
}
