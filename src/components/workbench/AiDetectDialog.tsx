import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles, UploadCloud, Check, Cpu, Database, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { lastAiTargetStore, aiResultsStore, dataTreeStore, filesStore, profileStore, fileToDataUrl, imagesStore, logAction, type AiRecord, type Img } from "@/store";
import type { TreeNode } from "@/lib/mock";
import { addChild } from "./TreePanel";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "disease-v1", name: "作物病害识别模型 v1", desc: "识别锈病、白粉病等常见病害" },
  { id: "trait", name: "表型特征提取模型", desc: "估算株高、叶面积、覆盖度" },
  { id: "general", name: "通用视觉大模型", desc: "综合识别病害与表型特征" },
];
const DISEASES = ["健康", "条锈病", "白粉病", "叶枯病", "纹枯病", "倒伏"];
const STEPS = ["选择图片", "选择模型", "开始识别", "结果归档"];
/** 图片节点 → 默认表型数据节点（按作物 / 课题组对应，可在弹窗中修改） */
const IMG_TO_DATA: Record<string, string> = { i0: "d0", i1: "d1", i11: "d11", i12: "d12", i2: "d21", i3: "d31" };

const flat = (ns: TreeNode[], depth = 0): { id: string; name: string; depth: number }[] =>
  ns.flatMap((n) => [{ id: n.id, name: n.name, depth }, ...flat(n.children ?? [], depth + 1)]);

export function AiDetectDialog({ open, onClose, nodeId, nodeName, imgs, srcOf, role }: {
  open: boolean; onClose: () => void; nodeId: string; nodeName: string; imgs: Img[]; srcOf: (s: string) => string; role: "user" | "admin";
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [uploads, setUploads] = useState<Img[]>([]);
  const [model, setModel] = useState(MODELS[0]!.id);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AiRecord[]>([]);
  const [drag, setDrag] = useState(false);
  const [savedFile, setSavedFile] = useState<number | null>(null);
  const [dataTree] = dataTreeStore.useStore();
  const [target, setTarget] = useState("d0");
  const [fileName, setFileName] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0); setPicked([]); setUploads([]); setProgress(0); setResults([]); setSavedFile(null); setFileName("");
    const ids = new Set(flat(dataTreeStore.get()).map((n) => n.id));
    const want = IMG_TO_DATA[nodeId];
    setTarget(want && ids.has(want) ? want : dataTreeStore.get()[0]?.id ?? "d0");
  }, [open, nodeId]);

  const all = [...uploads, ...imgs];
  const chosen = all.filter((i) => picked.includes(i.id));

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) { toast.error("请选择图片文件"); return; }
    const base = Date.now();
    const added = await Promise.all(list.map(async (f, i) => ({ id: base + i, src: await fileToDataUrl(f), label: "" })));
    setUploads((u) => [...added, ...u]);
    setPicked((p) => [...p, ...added.map((a) => a.id)]);
    imagesStore.set((m) => ({ ...m, [nodeId]: [...added, ...(m[nodeId] ?? [])] }));
    toast.success(`已上传 ${added.length} 张图片到「${nodeName}」`);
  };

  const run = () => {
    setStep(2); setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) {
        clearInterval(t); setProgress(100);
        setResults(chosen.map((im, i) => {
          const r = Math.abs(Math.sin(im.id * 12.9898 + i * 78.233) * 43758.5453) % 1;
          return {
            imageId: im.id,
            disease: model === "trait" ? "—" : DISEASES[Math.floor(r * DISEASES.length)]!,
            confidence: Math.round((0.82 + r * 0.17) * 1000) / 10,
            height: Math.round((62 + r * 38) * 10) / 10,
            leafArea: Math.round((18 + r * 22) * 10) / 10,
            coverage: Math.round((45 + r * 50) * 10) / 10,
            health: r > 0.33 ? "良好" : "需关注",
          };
        }));
        setTimeout(() => setStep(3), 300);
      } else setProgress(p);
    }, 180);
  };

  const targetName = flat(dataTree).find((n) => n.id === target)?.name ?? "";
  const crop = /玉米/.test(targetName + nodeName) ? "玉米" : /水稻/.test(targetName + nodeName) ? "水稻" : "小麦";
  /** 输入框为空时，默认使用所选归档节点的名称 */
  const placeholder = targetName || "未命名数据";
  const finalName = () => fileName.trim() || placeholder;
  /** 完成/查看前再次把输入框里的名称写回已保存文件，确保自定义名称不会被默认名覆盖 */
  const syncName = () => {
    if (savedFile === null) return;
    const name = finalName();
    filesStore.set((fs) => fs.map((f) => (f.id === savedFile ? { ...f, name } : f)));
  };
  const save = () => {
    const m = MODELS.find((x) => x.id === model)!;
    const fileId = Date.now() % 100000000;
    const today = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(results);
    const owner = profileStore.get()[role].nick;
    // 第一步：在所选归档节点下查找与文件名同名的子节点，不存在则创建
    const name = finalName();
    const findIn = (ns: TreeNode[]): TreeNode | undefined => { for (const n of ns) { if (n.id === target) return n; const r = findIn(n.children ?? []); if (r) return r; } return undefined; };
    const existing = findIn(dataTreeStore.get())?.children?.find((c) => c.name === name);
    const parentNodeId = existing?.id ?? `n${Date.now()}`;
    if (!existing) dataTreeStore.set((t) => addChild(t, target, { id: parentNodeId, name, public: true }));
    // 第二步：文件挂到该同名子节点下
    filesStore.set((fs) => [{
      id: fileId, name, desc: `AI 识别结果（${m.name}，来源图片节点「${nodeName}」，${results.length} 条）`,
      crop, owner, size: `${(json.length / 1024).toFixed(1)} KB`, rows: results.length, public: false,
      status: "用户私有", date: today, nodeId: parentNodeId,
    }, ...fs]);
    aiResultsStore.set((b) => [{ id: fileId, fileId, dataNodeId: parentNodeId, imageNodeId: nodeId, model: m.name, time: new Date().toLocaleString(), records: results }, ...b]);
    logAction(`AI 识别 ${results.length} 张图片并保存至表型数据`);
    lastAiTargetStore.set(parentNodeId);
    setLastSaved(parentNodeId);
    setSavedFile(fileId);
    toast.success("保存成功", { description: `已归档到「${targetName} / ${name}」，为用户私有数据，无需审核` });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary/15 via-background to-background px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI 智能识别</DialogTitle>
            <DialogDescription>当前图片节点：{nodeName}</DialogDescription>
          </DialogHeader>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold border",
                  i < step ? "bg-primary text-primary-foreground border-primary" : i === step ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground")}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("text-xs", i <= step ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={cn("cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors", drag ? "border-primary bg-primary/10" : "border-border hover:border-primary/60")}
              >
                <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-medium">拖拽图片到此处，或点击上传新图片</p>
                <p className="text-xs text-muted-foreground">上传的图片同时保存到当前节点</p>
                <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && void addFiles(e.target.files)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">从当前节点选择（已选 {picked.length} 张）</span>
                <button className="text-xs text-primary" onClick={() => setPicked(picked.length === all.length ? [] : all.map((i) => i.id))}>{picked.length === all.length && all.length ? "取消全选" : "全选"}</button>
              </div>
              {all.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">该节点暂无图片，请先上传</p> : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {all.map((im) => {
                    const on = picked.includes(im.id);
                    return (
                      <button key={im.id} onClick={() => setPicked(on ? picked.filter((x) => x !== im.id) : [...picked, im.id])}
                        className={cn("relative aspect-square overflow-hidden rounded-lg border-2 transition-all", on ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-80 hover:opacity-100")}>
                        <img src={srcOf(im.src)} alt={`图片 ${im.id}`} className="h-full w-full object-cover" />
                        {on && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label>识别模型</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <Cpu className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm"><p className="font-medium">{MODELS.find((m) => m.id === model)?.name}</p><p className="text-muted-foreground">{MODELS.find((m) => m.id === model)?.desc}</p></div>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><ImageIcon className="h-4 w-4" />待识别图片 {chosen.length} 张</p>
            </div>
          )}

          {step === 2 && (
            <div className="py-10 text-center space-y-4">
              <Sparkles className="mx-auto h-10 w-10 text-primary animate-pulse" />
              <p className="text-sm font-medium">正在分析 {chosen.length} 张图片…</p>
              <Progress value={progress} className="mx-auto max-w-md" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>{["图片", "病害", "置信度", "株高(cm)", "叶面积(cm²)", "覆盖度(%)", "长势"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const im = all.find((i) => i.id === r.imageId);
                      return (
                        <tr key={r.imageId} className="border-t border-border">
                          <td className="px-3 py-2"><div className="flex items-center gap-2">{im && <img src={srcOf(im.src)} alt="" className="h-8 w-8 rounded object-cover" />}<span className="text-xs">{r.imageId}</span></div></td>
                          <td className="px-3 py-2">{r.disease}</td>
                          <td className="px-3 py-2 text-primary font-medium">{r.confidence}%</td>
                          <td className="px-3 py-2">{r.height}</td>
                          <td className="px-3 py-2">{r.leafArea}</td>
                          <td className="px-3 py-2">{r.coverage}</td>
                          <td className="px-3 py-2">{r.health}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5">
                <Label>归档到表型数据节点</Label>
                <Select value={target} onValueChange={setTarget} disabled={savedFile !== null}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{flat(dataTree).map((n) => <SelectItem key={n.id} value={n.id}>{"　".repeat(n.depth)}{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-file-name">自定义数据文件名</Label>
                <Input id="ai-file-name" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder={placeholder} maxLength={80} />
                <p className="text-xs text-muted-foreground">优先使用你填写的名称；不填写（或只填空格）时使用所选节点名称「{placeholder}」。保存为用户私有数据，无需审核</p>
              </div>
              <details className="rounded-lg bg-muted/40 p-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground">查看 JSON 数据</summary>
                <pre className="mt-2 max-h-40 overflow-auto">{JSON.stringify({ imageNodeId: nodeId, dataNodeId: target, records: results }, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          {step === 0 && <Button disabled={!picked.length} onClick={() => setStep(1)}>下一步</Button>}
          {step === 1 && <><Button variant="outline" onClick={() => setStep(0)}>上一步</Button><Button onClick={run}><Sparkles />开始识别</Button></>}
          {step === 3 && (savedFile === null
            ? <><Button variant="outline" onClick={() => setStep(1)}>重新识别</Button><Button onClick={save}><Database />保存至表型数据管理</Button></>
            : <><Button variant="outline" onClick={() => { syncName(); onClose(); }}>完成</Button><Button asChild><Link onClick={syncName} to={role === "admin" ? "/admin/data" : "/user/data"} search={{ node: lastSaved ?? target, file: savedFile }}>查看表型数据</Link></Button></>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
