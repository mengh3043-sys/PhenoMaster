import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type DetailInfo = { title: string; desc?: string; fields: [string, React.ReactNode][]; image?: string };

/** 通用详情弹窗：右上角 ×、底部【关闭】。传 null 即关闭。 */
export function DetailDialog({ info, onClose }: { info: DetailInfo | null; onClose: () => void }) {
  return (
    <Dialog open={!!info} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{info?.title}</DialogTitle>
          {info?.desc && <DialogDescription>{info.desc}</DialogDescription>}
        </DialogHeader>
        {info?.image && <img src={info.image} alt={info.title} className="w-full max-h-64 object-cover rounded-xl" />}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {info?.fields.map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium break-all">{v ?? "—"}</dd></div>
          ))}
        </dl>
        <DialogFooter><Button variant="outline" onClick={onClose}>关闭</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
