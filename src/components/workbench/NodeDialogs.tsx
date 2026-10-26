import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function NodeFormDialog({ open, title, initial, onClose, onSave }: {
  open: boolean; title: string; initial: { name: string; public: boolean }; onClose: () => void; onSave: (v: { name: string; public: boolean }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [pub, setPub] = useState(initial.public);
  useEffect(() => { if (open) { setName(initial.name); setPub(initial.public); } }, [open, initial.name, initial.public]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>节点名称</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：2026 郑州小麦区试" autoFocus /></div>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm">是否公开<Switch checked={pub} onCheckedChange={setPub} /></label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), public: pub })}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ open, title, desc, confirmText = "删除", onClose, onConfirm }: {
  open: boolean; title: string; desc?: string | undefined; confirmText?: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {desc && <AlertDialogDescription>{desc}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
