import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderPlus, FolderPen, FolderX, Trash2, ImagePlus, Info, Download, CloudUpload, Tag, Sparkles, Eye, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TreePanel, addChild, updateNode, removeNode, findNode } from "./TreePanel";
import { NodeFormDialog, ConfirmDialog } from "./NodeDialogs";
import { AiDetectDialog } from "./AiDetectDialog";
import { DetailDialog, type DetailInfo } from "./DetailDialog";
import { PageHeader } from "./ui";
import { FullPagination } from "./FullPagination";
import type { Role } from "./Workbench";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { imageTreeStore, imagesStore, nodeMetaStore, lastNodeStore, profileStore, fileToDataUrl, logAction, type Img, type NodeMeta as Meta } from "@/store";
import { cn } from "@/lib/utils";
import { imageDate, DEMO_DEFAULT_NODE, visibleImages } from "@/store/imageData";
import { Search } from "lucide-react";
import type { TreeNode } from "@/lib/mock";
import rice from "@/assets/case-rice.jpg";
import corn from "@/assets/case-corn.jpg";
import wheat from "@/assets/case-wheat.jpg";
import hero from "@/assets/hero-field.jpg";
import maizePlant from "@/assets/maize-phenotyping.jpg";
import soybeanPlant from "@/assets/demo-soybean.svg";
import rapeseedPlant from "@/assets/demo-rapeseed.svg";

const pool = [wheat, corn, rice, hero, maizePlant, soybeanPlant, rapeseedPlant];
const srcOf = (s: string) => (s.startsWith("pool:") ? pool[Number(s.slice(5))] ?? wheat : s);
type Dlg = null | "addNode" | "editNode" | "delNode" | "detail" | "auto" | "add" | "remote" | "ai";

const flaggedLabels = ["模糊", "过曝"];

/** 图片元信息：上传时写入真实值，示例图按 ID 生成演示值。 */
export function imgInfo(im: Img) {
  const n = im.id;
  return {
    name: im.name ?? `IMG_${n}.jpg`,
    date: imageDate(im),
    uploader: im.uploader ?? ["曾老师", "张同学", "李同学"][n % 3]!,
    batch: im.batch ?? `B2024-${String((n % 5) + 1).padStart(2, "0")}`,
    size: im.size ?? `${(2 + (n % 7) * 0.6).toFixed(1)} MB`,
    res: im.res ?? ["4000×3000", "5472×3648", "1920×1080"][n % 3]!,
  };
}
const downloadImg = (src: string, name: string) => { const a = document.createElement("a"); a.href = src; a.download = name; a.click(); toast.success(`开始下载 ${name}`); };
const imgRes = (src: string) => new Promise<string>((res) => { const i = new Image(); i.onload = () => res(`${i.naturalWidth}×${i.naturalHeight}`); i.onerror = () => res(""); i.src = src; });
const mbOf = (im: Img) => im.fileSize ?? (parseFloat(im.size ?? "") * (/KB/.test(im.size ?? "") ? 1 / 1024 : /GB/.test(im.size ?? "") ? 1024 : 1) || 2 + (im.id % 7) * 0.6);
const fmtTotal = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`);
function pathMap(tree: TreeNode[]) {
  const out: Record<string, string[]> = {};
  const walk = (ns: TreeNode[], pre: string[]) => ns.forEach((n) => { const p = n.id === "demo-images" ? [] : [...pre, n.name]; out[n.id] = p.length ? p : [n.name]; if (n.children) walk(n.children, p); });
  walk(tree, []); return out;
}
const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function ImageManager({ role, node: focusNode, issue, img: focusImg }: { role: Role; node?: string | undefined; issue?: string | undefined; img?: number | undefined }) {
  const isAdmin = role === "admin";
  const [tree, setTree] = imageTreeStore.useStore();
  const [nodeId, setNodeId] = useState(focusNode ?? DEMO_DEFAULT_NODE);
  const [filterIssue, setFilterIssue] = useState(!!issue);
  const [byNode, setByNode] = imagesStore.useStore();
  const [meta, setMeta] = nodeMetaStore.useStore();
  const [sel, setSel] = useState<number[]>([]);
  const [big, setBig] = useState<Img | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [detail, setDetail] = useState<DetailInfo | null>(null);
  const [delImgs, setDelImgs] = useState<number[] | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [draft, setDraft] = useState<Meta>({ device: "", time: "", method: "", keywords: "" });

  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);
  const [kwInput, setKwInput] = useState("");
  const [kw, setKw] = useState("");
  const [profiles] = profileStore.useStore();
  const [, setLastNode] = lastNodeStore.useStore();
  const lastKey = `${role}:images`;
  useEffect(() => { const v = lastNodeStore.get()[lastKey]; if (v && v !== "i1" && !focusNode) setNodeId(v); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setLastNode((m) => (m[lastKey] === nodeId ? m : { ...m, [lastKey]: nodeId })); setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [nodeId]);
  const node = findNode(tree, nodeId) ?? tree[0]!;
  const own = byNode[node.id] ?? [];
  const imgs: Img[] = useMemo(() => visibleImages(byNode, [node], isAdmin), [byNode, node, isAdmin]);
  const openDetail = (im: Img) => {
    const f = imgInfo(im); const m = meta[node.id];
    const opt: [string, string | undefined][] = [["采集设备", m?.device], ["采集时间", m?.time], ["采集方法", m?.method], ["关键词", m?.keywords]];
    setDetail({ title: f.name, desc: `图片ID ${im.id} · 所属节点 ${node.name}`, image: srcOf(im.src), fields: [
      ["文件名", f.name], ["拍摄日期 / 上传时间", f.date], ["上传人", f.uploader], ["批次", f.batch], ["图片大小", f.size], ["分辨率", f.res],
      ["标注", im.label || "未标注"], ["来源", im.src.startsWith("pool:") ? "平台示例" : "本地上传"],
      ["品种", im.variety ?? node.name], ...(im.site ? [["试验点", im.site] as [string, string]] : []),
      ...opt.filter((x): x is [string, string] => !!x[1]?.trim()),
    ] });
  };
  useEffect(() => {
    if (!issue || !focusNode) return;
    setByNode((m) => {
      const cur = m[focusNode] ?? [];
      const bad = cur.filter((i) => flaggedLabels.includes(i.label)).length;
      if (bad >= 12) return m;
      const base = 9000 + cur.length;
      const add = Array.from({ length: 12 - bad }, (_, i) => ({ id: base + i, src: `pool:${(i + 2) % 4}`, label: flaggedLabels[i % 2]! }));
      return { ...m, [focusNode]: [...cur, ...add] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const im = focusImg ? imgs.find((i) => i.id === focusImg) : undefined;
    if (im) openDetail(im);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusImg, imgs.length]);
  const paths = useMemo(() => pathMap(tree), [tree]);
  const q = kw.trim().toLowerCase();
  const all = useMemo(() => (q ? visibleImages(byNode, tree, isAdmin) : []), [q, byNode, tree, isAdmin]);
  const results = useMemo(() => all.filter((im) => { const f = imgInfo(im); return [f.name, String(im.id), f.uploader, ...(paths[im.nodeId] ?? [])].some((v) => v.toLowerCase().includes(q)); }), [all, q, paths]);
  const nodeHits = useMemo(() => {
    if (!q) return [];
    const res: { node: TreeNode; count: number; kids: string[] }[] = [];
    const walk = (ns: TreeNode[]) => ns.forEach((n) => { if ((isAdmin || n.public) && n.children?.length) { if (n.name.toLowerCase().includes(q)) { const ids = new Set(collect(n)); res.push({ node: n, count: results.filter((r) => ids.has(r.nodeId)).length, kids: n.children.map((c) => c.name) }); } walk(n.children); } });
    const collect = (n: TreeNode): string[] => [n.id, ...(n.children ?? []).flatMap(collect)];
    walk(tree); return res;
  }, [q, tree, results, isAdmin]);
  const badges = useMemo(() => {
    const b: Record<string, number> = {};
    const count = (n: TreeNode): number => { const c = results.filter((r) => r.nodeId === n.id).length + (n.children ?? []).reduce((s, k) => s + count(k), 0); if (c) b[n.id] = c; return c; };
    if (q) tree.forEach(count);
    return b;
  }, [results, tree, q]);
  const totalMb = results.reduce((s, im) => s + mbOf(im), 0);
  const nodeOf = (im: Img) => ("nodeId" in im ? (im as Img & { nodeId: string }).nodeId : node.id);
  const nodeIds = new Set(imgs.map((i) => nodeOf(i)).concat(node.id));
  const shown: Img[] = q ? results : filterIssue && node.id === focusNode ? imgs.filter((i) => flaggedLabels.includes(i.label)) : imgs;
  const doSearch = () => { setKw(kwInput); setPage(1); setSel([]); };
  const resetSearch = () => { setKwInput(""); setKw(""); setPage(1); setSel([]); };
  const pages = Math.max(1, Math.ceil(shown.length / per));
  const cur = Math.min(page, pages);
  const paged = useMemo(() => shown.slice((cur - 1) * per, cur * per), [shown, cur, per]);
  const setImgs = (next: Img[]) => setByNode((m) => ({ ...m, [node.id]: next }));
  const close = (msg?: string) => { setDlg(null); if (msg) toast.success(msg); };

  return (
    <div>
      <PageHeader title="表型图片" desc={isAdmin ? "管理全部图片节点，控制节点公开状态" : "仅展示公开节点；可上传、查看与标注图片"} />
      <div className="flex flex-col lg:flex-row gap-5">
        <TreePanel tree={tree} selected={node.id} onSelect={(n) => { setNodeId(n.id); setSel([]); }} hidePrivate={!isAdmin} badges={badges} />
        <div className="flex-1 min-w-0 bg-card rounded-2xl border shadow-card">
          <div className="p-4 border-b space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="font-semibold">{node.name}</p>
                <p className="text-xs text-muted-foreground">共 {imgs.length} 张图片{meta[node.id] ? ` · ${meta[node.id]!.device}` : ""}</p>
              </div>
              <label className="ml-auto flex items-center gap-2 text-sm rounded-full border px-3 h-9 cursor-pointer">
                当前节点状态：<b className={node.public ? "text-primary" : "text-muted-foreground"}>{node.public ? "公开" : "不公开"}</b>
                <Switch checked={node.public} onCheckedChange={(v) => { setTree(updateNode(tree, node.id, { public: v })); toast.success(v ? "节点已公开" : "节点已设为不公开"); }} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setDlg("addNode")}><FolderPlus />添加子节点</Button>
              <Button size="sm" variant="outline" onClick={() => setDlg("editNode")}><FolderPen />修改节点</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => (node.id === "i0" ? toast.error("根节点不能删除") : setDlg("delNode"))}><FolderX />删除节点</Button>
              <Button size="sm" onClick={() => { setPending([]); setDlg("add"); }}><ImagePlus />添加图片</Button>
              <Button size="sm" variant="outline" onClick={() => { setDraft(meta[node.id] ?? { device: "", time: "", method: "", keywords: "" }); setDlg("detail"); }}><Info />节点详情信息</Button>
              <Button size="sm" variant="outline" onClick={() => setDlg("remote")}><Download />下载远程连接文件</Button>
              <Button size="sm" variant="outline" onClick={() => setDlg("auto")}><CloudUpload />图片自动上传</Button>
              <Button size="sm" onClick={() => setDlg("ai")}><Sparkles />AI 智能识别</Button>
            </div>
          </div>

          <div className="px-4 py-3 border-b bg-muted/30">
            <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); doSearch(); }}>
              <div className="relative min-w-0 flex-1 basis-64 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={kwInput} onChange={(e) => setKwInput(e.target.value)} placeholder="搜索图片名称/ID/上传者" className="h-9 pl-9 bg-card" aria-label="搜索图片" />
              </div>
              <Button type="submit" size="sm" className="h-9 shrink-0"><Search />搜索</Button>
              <Button type="button" size="sm" variant="outline" className="h-9 shrink-0" onClick={resetSearch}>重置</Button>
              <span className="text-xs text-muted-foreground">在全部{isAdmin ? "" : "公开"}目录中搜索</span>
            </form>
            {q && <div className="mt-2 space-y-1 text-sm">
              <p>找到 <b className="text-primary">{results.length}</b> 张匹配的图片，总大小约 <b>{fmtTotal(totalMb)}</b>（共找到 {results.length} 张符合条件的图片，分布在 {new Set(results.map((r) => r.nodeId)).size} 个目录）</p>
              {nodeHits.map((h) => <p key={h.node.id} className="text-xs text-muted-foreground">匹配目录「{(paths[h.node.id] ?? [h.node.name]).join(" > ")}」：{h.count} 张图片，包含子文档 {h.kids.join("、")}</p>)}
            </div>}
          </div>

          {sel.length > 0 && (
            <div className="px-4 py-2.5 bg-primary-soft flex flex-wrap items-center gap-2 text-sm">
              已选 {sel.length} 张
              <Button size="sm" variant="outline" onClick={() => { setByNode((m) => Object.fromEntries(Object.entries(m).map(([k, l]) => [k, (q || nodeIds.has(k)) ? l.map((i) => (sel.includes(i.id) ? { ...i, label: "健康" } : i)) : l]))); toast.success("已批量标注为「健康」"); }}><Tag />批量标注</Button>
              <Button size="sm" variant="destructive" onClick={() => setDelImgs(sel)}><Trash2 />批量删除</Button>
              <Button size="sm" variant="ghost" onClick={() => setSel([])}>取消</Button>
            </div>
          )}

          {!q && filterIssue && node.id === focusNode && (
            <div className="px-4 py-2.5 bg-destructive/5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-destructive">异常筛选：显示 {shown.length} 张模糊/过曝图片</span>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setFilterIssue(false)}>显示全部</Button>
            </div>
          )}
          <div className="px-4 pt-3 flex items-center justify-end">
            <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="视图切换">
              <button aria-label="网格视图" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={cn("flex items-center gap-1 rounded-md px-2.5 h-7 text-xs cursor-pointer", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><LayoutGrid className="h-3.5 w-3.5" />网格</button>
              <button aria-label="列表视图" aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded-md px-2.5 h-7 text-xs cursor-pointer", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><List className="h-3.5 w-3.5" />列表</button>
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">{q ? "暂无匹配的图片" : "该节点暂无图片，点击「添加图片」上传"}</p>
          ) : view === "grid" ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {paged.map((im) => {
                const on = sel.includes(im.id); const f = imgInfo(im);
                return (
                  <div key={im.id} className={cn("rounded-xl border-2 bg-card overflow-hidden", on ? "border-primary" : "border-border")}>
                    <div className="group relative aspect-square overflow-hidden">
                      <img src={srcOf(im.src)} alt={f.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        <button onClick={() => setBig(im)} className="flex items-center gap-1 rounded-md bg-card px-2.5 py-1 text-xs cursor-pointer hover:bg-muted"><Eye className="h-3.5 w-3.5" />预览大图</button>
                        <button onClick={() => downloadImg(srcOf(im.src), f.name)} className="flex items-center gap-1 rounded-md bg-card px-2.5 py-1 text-xs cursor-pointer hover:bg-muted"><Download className="h-3.5 w-3.5" />下载</button>
                        <button onClick={() => setDelImgs([im.id])} className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs text-destructive-foreground cursor-pointer"><Trash2 className="h-3.5 w-3.5" />删除</button>
                      </div>
                      <div className="absolute top-2 left-2"><Checkbox checked={on} onCheckedChange={() => setSel(on ? sel.filter((x) => x !== im.id) : [...sel, im.id])} className="bg-card" /></div>
                      {im.label && <span className="absolute top-2 right-2 text-[10px] rounded-full bg-primary text-primary-foreground px-1.5 py-0.5">{im.label}</span>}
                    </div>
                    <button onClick={() => openDetail(im)} className="block w-full text-left p-2 space-y-0.5 cursor-pointer hover:bg-muted/40">
                      <p className="text-xs font-medium truncate" title={f.name}>{f.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate" title={im.variety ?? node.name}>{im.variety ?? node.name}</p>
                      {q ? <>
                        <p className="text-[11px] text-muted-foreground truncate" title={`该图片属于：[${(paths[nodeOf(im)] ?? []).join(" -> ")}] 节点`}>所属节点：{(paths[nodeOf(im)] ?? []).join(" > ")}</p>
                        <p className="text-[11px] text-muted-foreground truncate">大小：{mbOf(im).toFixed(1)} MB | 上传者：{f.uploader}</p>
                      </> : <>
                        <p className="text-[11px] text-muted-foreground">拍摄 {f.date}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{f.uploader} · {f.batch}</p>
                      </>}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr className="text-left"><th className="p-2 w-8"></th><th className="p-2">图片</th><th className="p-2">文件名</th><th className="p-2">品种 / 试验点</th><th className="p-2">拍摄日期</th><th className="p-2">上传人 / 批次</th><th className="p-2">大小</th><th className="p-2">分辨率</th><th className="p-2">标注</th><th className="p-2 text-right">操作</th></tr></thead>
                <tbody>
                  {paged.map((im) => {
                    const on = sel.includes(im.id); const f = imgInfo(im);
                    return (
                      <tr key={im.id} className="border-t hover:bg-muted/40">
                        <td className="p-2"><Checkbox checked={on} onCheckedChange={() => setSel(on ? sel.filter((x) => x !== im.id) : [...sel, im.id])} /></td>
                        <td className="p-2"><img src={srcOf(im.src)} alt={f.name} loading="lazy" className="h-10 w-10 rounded-md object-cover cursor-pointer" onClick={() => setBig(im)} /></td>
                        <td className="p-2 min-w-48 font-medium">{f.name}</td><td className="p-2 min-w-48">{im.variety ?? node.name}{q && <p className="text-xs text-muted-foreground">所属节点：{(paths[nodeOf(im)] ?? []).join(" > ")}</p>}{im.site && <p className="text-xs text-muted-foreground">{im.site}</p>}</td><td className="p-2">{f.date}</td><td className="p-2">{f.uploader} · {f.batch}</td><td className="p-2">{f.size}</td><td className="p-2">{f.res}</td><td className="p-2">{im.label || "—"}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(im)}>详情</Button>
                          <Button size="sm" variant="ghost" onClick={() => setBig(im)}>预览</Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadImg(srcOf(im.src), f.name)}>下载</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelImgs([im.id])}>删除</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {shown.length > 0 && (
            <FullPagination total={shown.length} page={cur} pageSize={per} onPage={setPage} onPageSize={setPer} unit="张" />
          )}
        </div>
      </div>

      <DetailDialog info={detail} onClose={() => setDetail(null)} />
      <Dialog open={!!big} onOpenChange={() => setBig(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">高清大图</DialogTitle>
          {big && <img src={srcOf(big.src)} alt="高清大图" className="w-full max-h-[75vh] object-contain rounded-lg" />}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-sm">
            <span className="text-muted-foreground">ID {big?.id} · 节点 {node.name}</span>
            <div className="flex flex-wrap gap-2">
              {["健康", "倒伏", "病害", "叶色异常"].map((t) => (
                <Button key={t} size="sm" variant={big?.label === t ? "default" : "outline"} onClick={() => { if (!big) return; setByNode((m) => Object.fromEntries(Object.entries(m).map(([k, l]) => [k, l.map((i) => (i.id === big.id ? { ...i, label: t } : i))]))); setBig({ ...big, label: t }); toast.success(`已标注：${t}`); }}>{t}</Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delImgs} title={`确认删除 ${delImgs?.length ?? 0} 张图片？`} desc="删除后无法在当前节点中查看。" onClose={() => setDelImgs(null)}
        onConfirm={() => { setByNode((m) => Object.fromEntries(Object.entries(m).map(([k, l]) => [k, (q || nodeIds.has(k)) ? l.filter((i) => !delImgs?.includes(i.id)) : l]))); setSel([]); setDelImgs(null); logAction(`删除图片 ${delImgs?.join(", ")}`); toast.success("已删除"); }} />

      <NodeFormDialog open={dlg === "addNode"} title={`在「${node.name}」下添加子节点`} initial={{ name: "", public: true }} onClose={() => close()}
        onSave={(v) => { const id = `n${Date.now()}`; setTree(addChild(tree, node.id, { id, ...v })); setNodeId(id); logAction(`新增节点「${v.name}」`); close(`已添加节点「${v.name}」`); }} />
      <NodeFormDialog open={dlg === "editNode"} title="修改节点" initial={{ name: node.name, public: node.public }} onClose={() => close()}
        onSave={(v) => { setTree(updateNode(tree, node.id, v)); logAction(`修改节点「${v.name}」`); close("节点已修改"); }} />
      <ConfirmDialog open={dlg === "delNode"} title={`确认删除节点「${node.name}」？`} desc="节点及其子节点中的图片将一并删除。" onClose={() => close()}
        onConfirm={() => { setTree(removeNode(tree, node.id)); logAction(`删除节点「${node.name}」`); setNodeId("i0"); close("节点已删除"); }} />

      <AiDetectDialog open={dlg === "ai"} onClose={() => close()} nodeId={node.id} nodeName={node.name} imgs={imgs} srcOf={srcOf} role={isAdmin ? "admin" : "user"} />

      <Dialog open={dlg === "add"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加图片</DialogTitle><DialogDescription>批量选择本地图片上传到「{node.name}」。</DialogDescription></DialogHeader>
          <label className="block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-soft/40">
            <ImagePlus className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm">{pending.length ? `已选择 ${pending.length} 张图片` : "点击选择图片（可多选）"}</p>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setPending(Array.from(e.target.files ?? []))} />
          </label>
          {pending.length > 0 && (
            <div className="grid grid-cols-5 gap-2">{pending.slice(0, 10).map((f) => <img key={f.name} src={URL.createObjectURL(f)} alt={f.name} className="aspect-square rounded-lg object-cover" />)}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => close()}>取消</Button>
            <Button disabled={!pending.length} onClick={async () => {
              const base = Date.now() % 1000000;
              const srcs = await Promise.all(pending.map((f) => fileToDataUrl(f)));
              const ress = await Promise.all(srcs.map(imgRes));
              const today = new Date().toISOString().slice(0, 10);
              const batch = `B${today.replace(/-/g, "")}-${String(base % 100).padStart(2, "0")}`;
              setImgs([...srcs.map((src, i) => ({ id: base + i, src, label: "", name: pending[i]?.name ?? `IMG_${base + i}.jpg`, date: today, variety: node.name, project: node.name, uploader: profiles[role].nick, batch, size: fmtSize(pending[i]?.size ?? 0), ...(ress[i] ? { res: ress[i] } : {}) })), ...own]);
              logAction(`上传图片 ${srcs.map((_, i) => base + i).join(", ")}`); close(`已上传 ${pending.length} 张图片`);
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "detail"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>节点详情信息</DialogTitle><DialogDescription>{node.name}</DialogDescription></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>拍摄设备</Label><Input value={draft.device} onChange={(e) => setDraft({ ...draft, device: e.target.value })} placeholder="DJI M300 + P1" /></div>
            <div className="space-y-1.5"><Label>拍摄时间</Label><Input type="datetime-local" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>处理方式</Label><Input value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value })} placeholder="正射拼接 / 去畸变" /></div>
            <div className="space-y-1.5"><Label>关键字</Label><Input value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="苗期, RGB, 小麦" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => close()}>取消</Button><Button onClick={() => { setMeta({ ...meta, [node.id]: draft }); close("节点详情已保存"); }}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "remote"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>下载远程连接程序</DialogTitle><DialogDescription>用于图片自动上传。在田间目标机运行该程序并开放端口 9999。服务器带宽较慢时请耐心等待。</DialogDescription></DialogHeader>
          <DialogFooter><Button onClick={() => close("开始下载 remote-connector.zip")}><Download />下载</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "auto"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>图片自动上传</DialogTitle><DialogDescription>目标机需可通过公网 IP 访问，并已运行远程连接程序（端口 9999）。</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>目标机 IP</Label><Input placeholder="例如 120.24.18.6" /></div>
            <div className="space-y-1.5"><Label>图片目录绝对路径</Label><Input placeholder="c:/corn" /></div>
          </div>
          <DialogFooter><Button onClick={() => close("连接成功，开始自动上传")}><CloudUpload />开始连接</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
