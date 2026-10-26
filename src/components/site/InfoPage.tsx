import type { ReactNode } from "react";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function InfoPage({ title, intro, children, back }: { title: string; intro: string; children: ReactNode; back?: ReactNode }) {
  return (
    <PhotoBackdrop>
      <SiteNav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 md:px-6 py-12">
        {back && <div className="mb-4">{back}</div>}
        <h1 className="text-3xl font-bold text-on-dark">{title}</h1>
        <p className="mt-2 text-on-dark-muted">{intro}</p>
        <div className="mt-8 bg-card rounded-3xl shadow-lift p-6 md:p-8 space-y-6">{children}</div>
      </main>
      <SiteFooter />
    </PhotoBackdrop>
  );
}
