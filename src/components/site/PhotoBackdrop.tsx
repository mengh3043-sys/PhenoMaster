import type { ReactNode } from "react";
import hero from "@/assets/hero-field.jpg";

export function PhotoBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <img src={hero} alt="科研人员在试验田使用电脑和无人机采集表型" width={1920} height={1088} className="fixed inset-0 -z-20 h-full w-full object-cover" />
      <div className="fixed inset-0 -z-10 bg-overlay" />
      {children}
    </div>
  );
}
