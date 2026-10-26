import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Returns to the home page via the router — always lands on "/", never depends on browser history. */
export function useReturnHome() {
  const navigate = useNavigate();
  return () => {
    navigate({ to: "/" });
  };
}

/** Text link shown at the top-left of a page. */
export function BackHomeLink({ label = "返回首页", className }: { label?: string; className?: string }) {
  const returnHome = useReturnHome();
  return (
    <button
      onClick={returnHome}
      className={cn(
        "inline-flex items-center gap-1 text-primary text-sm cursor-pointer hover:underline underline-offset-4",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

/** Pill button shown next to the logo in the top navigation bar. */
export function BackHomeNavButton() {
  const returnHome = useReturnHome();
  return (
    <button
      onClick={returnHome}
      className="shrink-0 inline-flex items-center gap-1 rounded-full glass px-3 py-1 text-xs text-on-dark hover:bg-primary/30 hover:text-on-dark transition-colors cursor-pointer"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> 返回首页
    </button>
  );
}
