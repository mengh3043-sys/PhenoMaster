import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Search, Trash2, Download, Eye, Pencil, MoreHorizontal, FolderPlus, History, Upload, LineChart, FolderPen, FolderX, Merge, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TreePanel, addChild, updateNode, removeNode, collectIds, findNode } from "./TreePanel";
import { NodeFormDialog, ConfirmDialog } from "./NodeDialogs";
import { DetailDialog, type DetailInfo } from "./DetailDialog";
import { Info, GitCompare, ChevronLeft, ChevronRight, Sparkles, Inbox } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { migrateNames, fileMeta, isAiFile, mockVersions, traitCols, traitRows, diffRows, type Version } from "./dataKit";
import type { TreeNode } from "@/lib/mock";


function pathOf(tree: TreeNode[], id: string, acc: string[] = []): string[] | null {
  for (const n of tree) { const p = [...acc, n.name]; if (n.id === id) return p; const r = n.children && pathOf(n.children, id, p); if (r) return r; }
  return null;
}
import { PageHeader, StatusBadge } from "./ui";
import { FullPagination } from "./FullPagination";
import type { Role } from "./Workbench";
import { previewRows, type ReviewStatus } from "@/lib/mock";
import { dataTreeStore, filesStore, profileStore, logAction, registerSpecies, type FileRow, lastAiTargetStore, lastNodeStore } from "@/store";
import { cn } from "@/lib/utils";
import { createMergedFile, mergeStrategyLabel, type MergeStrategy } from "@/store/fileMerge";

const emptyForm = { name: "", desc: "", date: "", public: false, csv: "" };

export type DataFocus = { node?: string | undefined; file?: number | undefined; action?: string | undefined };
const missingSeed = [{ row: 12, field: "单株产量" }, { row: 37, field: "分蘖数" }, { row: 58, field: "单株产量" }, { row: 104, field: "株高" }, { row: 233, field: "分蘖数" }];

export function DataManager({ role, focus = {} }: { role: Role; focus?: DataFocus }) {
  const isAdmin = role === "admin";
  const [tree, setTree] = dataTreeStore.useStore();
  const [files, setFiles] = filesStore.useStore();
  const focusFile = focus.file ? files.find((f) => f.id === focus.file) : undefined;
  const [nodeId, setNodeId] = useState(focus.node ?? focusFile?.nodeId ?? "d0");
  const [aiTarget, setAiTarget] = lastAiTargetStore.useStore();
  const [, setLastNode] = lastNodeStore.useStore();
  const lastKey = `${role}:data`;
  useEffect(() => { const v = lastNodeStore.get()[lastKey]; if (v && !focus.node && !focusFile && !lastAiTargetStore.get()) setNodeId(v); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setLastNode((m) => (m[lastKey] === nodeId ? m : { ...m, [lastKey]: nodeId })); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [nodeId]);
  useEffect(() => {
    if (!aiTarget) return;
    if (!focus.node && !focusFile) setNodeId(aiTarget);
    setAiTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTarget]);
  const [missing, setMissing] = useState<null | { file: FileRow; rows: typeof missingSeed }>(null);
  const [rejected, setRejected] = useState<FileRow | null>(null);
  const [editHint, setEditHint] = useState("");
  const [detail, setDetail] = useState<DetailInfo | null>(null);
  const [profiles] = profileStore.useStore();
  const me = profiles[role].nick;
  const [q, setQ] = useState("");
  const [kw, setKw] = useState("");
  const [sel, setSel] = useState<number[]>([]);
  const [mergeSources, setMergeSources] = useState<FileRow[] | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>("material");
  const [merging, setMerging] = useState(false);
  const [preview, setPreview] = useState<FileRow | null>(null);
  const [confirmFiles, setConfirmFiles] = useState<number[] | null>(null);
  const [nodeDlg, setNodeDlg] = useState<null | "add" | "edit">(null);
  const [delNode, setDelNode] = useState(false);
  const [fileDlg, setFileDlg] = useState<null | { mode: "add" } | { mode: "edit"; id: number }>(null);
  const [form, setForm] = useState(emptyForm);
  const [fYear, setFYear] = useState("all");
  const [fRegion, setFRegion] = useState("all");
  const [fPub, setFPub] = useState("all");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);
  const [versions, setVersions] = useState<FileRow | null>(null);
  const [compare, setCompare] = useState<null | { file: FileRow; a: Version; b: Version }>(null);
  const [traitView, setTraitView] = useState<FileRow | null>(null);
  useEffect(() => { const m = migrateNames(tree); if (m.changed) setTree(m.tree); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const node = findNode(tree, nodeId) ?? tree[0]!;
  const scope = useMemo(() => new Set(collectIds(node)), [node]);
  const metaOf = (f: FileRow) => fileMeta(f, pathOf(tree, f.nodeId) ?? []);
  const populationOf = (f: FileRow) => {
    const folder = [...(pathOf(tree, f.nodeId) ?? [])].reverse().find((name) => /群体|自交系|杂交系/.test(name));
    if (folder) return folder.replace(/^\S+?-\d{4}\s*/, "").trim();
    const description = f.desc.replace(/^AI 识别结果 · /, "");
    return description.includes(" · ") ? description.split(" · ")[0]?.trim() || "未标注" : "未标注";
  };
  const base = files.filter((f) => (isAdmin || f.public || f.owner === me || f.id === focus.file) && scope.has(f.nodeId));
  const years = [...new Set(base.map((f) => metaOf(f).year))].sort().reverse();
  const regions = [...new Set(base.map((f) => metaOf(f).region))].sort();
  const list = base.filter((f) => { const m = metaOf(f); return (!q || String(f.id) === q || f.name.includes(q) || f.desc.includes(q)) && (fYear === "all" || m.year === fYear) && (fRegion === "all" || m.region === fRegion) && (fPub === "all" || (fPub === "pub") === f.public); });
  const selectedFiles = list.filter((f) => sel.includes(f.id));
  const pages = Math.max(1, Math.ceil(list.length / per));
  const cur = Math.min(page, pages);
  const pageList = list.slice((cur - 1) * per, cur * per);
  const exportCsv = (rows: FileRow[]) => {
    const head = ["文件ID", "文件名", "描述", "年份", "地区", "是否公开", "审核状态", "文件时间"];
    const body = rows.map((f) => { const m = metaOf(f); return [f.id, f.name, f.desc, m.year, m.region, f.public ? "公开" : "私有", f.status, f.date]; });
    const csv = "\ufeff" + [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `${node.name}_表型数据.csv`; a.click();
    toast.success(`已导出 ${rows.length} 条数据`);
  };
  useEffect(() => {
    if (focus.node) setNodeId(focus.node); else if (focusFile) setNodeId(focusFile.nodeId);
    if (focus.action === "upload") openAddFile();
    else if (focusFile && focus.action === "edit") { openEditFile(focusFile); setEditHint("该文件缺少单位字段，请在描述中补充各性状单位（如 株高(cm)、千粒重(g)）"); }
    else if (focusFile && focus.action === "missing") setMissing({ file: focusFile, rows: missingSeed });
    else if (focusFile && focus.action === "rejected") setRejected(focusFile);
    else if (focusFile && focus.action === "detail") setDetail({ title: `文件详情：${focusFile.name}`, desc: focusFile.desc, fields: [["文件ID", focusFile.id], ["文件名", focusFile.name], ["所属节点", findNode(tree, focusFile.nodeId)?.name ?? "—"], ["上传者", focusFile.owner], ["大小", focusFile.size], ["行数", focusFile.rows], ["是否公开", focusFile.public ? "公开" : "私有"], ["审核状态", focusFile.status], ["文件时间", focusFile.date]] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.node, focus.file, focus.action, !!focusFile]);
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  useEffect(() => {
    if (!merging || !mergeSources) return;
    const timer = setTimeout(() => {
      const currentFiles = filesStore.get();
      const currentOwner = profileStore.get()[role].nick;
      const accessible = mergeSources.every((source) => currentFiles.some((file) => file.id === source.id && (isAdmin || file.public || file.owner === currentOwner || file.id === focus.file)));
      if (!accessible) {
        toast.error("来源文件已变更或不可访问，请重新选择");
        setMerging(false);
        setMergeSources(null);
        return;
      }
      const output = createMergedFile(mergeSources, mergeStrategy, {
        id: Math.max(10000, ...currentFiles.map((file) => file.id)) + 1,
        nodeId: node.id,
        owner: currentOwner,
        date: new Date().toISOString().slice(0, 10),
      });
      setFiles((current) => [output, ...current]);
      setQ(""); setKw(""); setFYear("all"); setFRegion("all"); setFPub("all"); setPage(1); setSel([]);
      setMerging(false); setMergeSources(null);
      toast.success("合并成功！");
      logAction(`合并表型文件「${output.name}」，来源 ${mergeSources.length} 个文件`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [merging, mergeSources, mergeStrategy, node.id, role, isAdmin, focus.file, setFiles]);

  const openAddFile = () => { setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) }); setFileDlg({ mode: "add" }); };
  const openEditFile = (f: FileRow) => { setForm({ name: f.name, desc: f.desc, date: f.date, public: f.public, csv: "" }); setFileDlg({ mode: "edit", id: f.id }); };
  const saveFile = () => {
    if (!form.name.trim()) { toast.error("请填写文件名"); return; }
    if (fileDlg?.mode === "add") {
      if (!form.csv) { toast.error("请选择要上传的 CSV 文件"); return; }
      const id = Math.max(...files.map((f) => f.id), 10000) + 1;
      const status: ReviewStatus = "待审核";
      setFiles([{ id, name: form.name, desc: form.desc || "—", crop: "", owner: me, size: "0.4 MB", rows: 240, public: form.public, status, date: form.date, nodeId: node.id }, ...files]);
      toast.success("文件已新增，状态：待审核"); logAction(`上传表型文件「${form.name}」`); const sp = registerSpecies(`${form.name} ${form.desc} ${node.name}`); if (sp) toast.info(`已同步物种「${sp}」到基本信息`);
    } else if (fileDlg) {
      setFiles(files.map((f) => (f.id === fileDlg.id ? { ...f, name: form.name, desc: form.desc, date: form.date, public: form.public } : f)));
      toast.success("文件属性已更新");
    }
    setFileDlg(null); setEditHint("");
  };

  return (
    <div>
      <PageHeader title="表型数据" desc={isAdmin ? "管理全部表型文件：增删改查、公开控制、历史版本" : "展示公开数据与你的私有数据；手动新增文件需管理员审核后对外可见，AI 识别结果为用户私有数据，无需审核即可查看、预览和下载"} />
      <div className="flex flex-col lg:flex-row gap-5">
        <TreePanel tree={tree} selected={node.id} onSelect={(n) => { setNodeId(n.id); setSel([]); }} hidePrivate={!isAdmin} />
        <div className="flex-1 min-w-0 bg-card rounded-2xl border shadow-card">
          <div className="p-4 border-b space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="font-semibold">{node.name}</p>
                <p className="text-xs text-muted-foreground">当前节点 · {node.public ? "公开" : "私有"} · {list.length} 个文件</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={(e) => { e.preventDefault(); setQ(kw.trim()); setPage(1); }} className="flex items-center gap-2">
                <div className="relative w-full sm:w-[350px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="在当前节点搜索（文件 ID / 名称 / 描述）" className="pl-9 rounded-md" />
                </div>
                <Button type="submit" size="sm" className="h-9">搜索</Button>
                <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => { setKw(""); setQ(""); setFYear("all"); setFRegion("all"); setFPub("all"); setPage(1); }}>重置</Button>
              </form>
              <Select value={fYear} onValueChange={(v) => { setFYear(v); setPage(1); }}><SelectTrigger className="h-9 w-28"><SelectValue placeholder="年份" /></SelectTrigger><SelectContent><SelectItem value="all">全部年份</SelectItem>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
              <Select value={fRegion} onValueChange={(v) => { setFRegion(v); setPage(1); }}><SelectTrigger className="h-9 w-28"><SelectValue placeholder="地区" /></SelectTrigger><SelectContent><SelectItem value="all">全部地区</SelectItem>{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              <Select value={fPub} onValueChange={(v) => { setFPub(v); setPage(1); }}><SelectTrigger className="h-9 w-28"><SelectValue placeholder="公开状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="pub">公开</SelectItem><SelectItem value="pri">私有</SelectItem></SelectContent></Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setNodeDlg("add")}><FolderPlus />添加子节点</Button>
              <Button size="sm" variant="outline" onClick={() => setNodeDlg("edit")}><FolderPen />修改节点</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => (node.id === "d0" ? toast.error("根节点不能删除") : setDelNode(true))}><FolderX />删除节点</Button>
              <Button size="sm" onClick={openAddFile}><Upload />新增文件</Button>
              <Button size="sm" variant="outline" onClick={() => exportCsv(list)}><Download />导出数据</Button>
              {isAdmin && <Button asChild size="sm" variant="outline"><Link to="/admin/review">数据审核</Link></Button>}
            </div>
          </div>

          {sel.length > 0 && (
            <div className="px-4 py-2.5 bg-primary-soft flex flex-wrap items-center gap-2 text-sm">
              <span>已选 {sel.length} 项</span>
              <Button size="sm" disabled={selectedFiles.length < 2 || merging} onClick={() => { setMergeStrategy("material"); setMergeSources(selectedFiles.map((file) => ({ ...file }))); }}><Merge />合并所选文件</Button>
              <Button size="sm" variant="outline" onClick={() => exportCsv(files.filter((f) => sel.includes(f.id)))}><Download />批量导出</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmFiles(sel)}><Trash2 />批量删除</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/50">
                <tr>
                  <th className="p-3 w-10"><Checkbox aria-label="选择全部文件" checked={sel.length === list.length && list.length > 0} onCheckedChange={(v) => setSel(v ? list.map((f) => f.id) : [])} /></th>
                  <th className="p-3 text-left font-medium whitespace-nowrap w-14">序号</th>
                  <th className="p-3 text-left font-medium">文件名</th>
                  <th className="p-3 text-left font-medium whitespace-nowrap">物种名称</th>
                  <th className="p-3 text-left font-medium whitespace-nowrap">群体名称</th>
                  <th className="p-3 text-left font-medium whitespace-nowrap">年份</th>
                  <th className="p-3 text-left font-medium whitespace-nowrap">地区</th>
                  <th className="p-3 text-left font-medium whitespace-nowrap">状态</th>
                  <th className="p-3 text-right font-medium sticky right-0 bg-muted">操作</th>
                </tr>
              </thead>
              <tbody>
                {pageList.map((f, index) => (
                  <tr key={f.id} className="group border-t bg-card hover:bg-muted/40">
                    <td className="p-3"><Checkbox aria-label={`选择 ${f.name}`} checked={sel.includes(f.id)} onCheckedChange={() => toggle(f.id)} /></td>
                    <td className="p-3 text-muted-foreground tabular-nums whitespace-nowrap">{(cur - 1) * per + index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 min-w-[14rem] max-w-[20rem] text-xs text-muted-foreground"><span className="truncate" title={f.name}>{f.name}</span>{f.merge ? <span className="shrink-0 whitespace-nowrap rounded border border-primary/25 bg-primary-soft px-1 py-0.5 text-[9px] leading-none text-primary">合并生成</span> : isAiFile(f) ? <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-0.5 rounded border border-primary/25 bg-primary-soft px-1 py-0.5 text-[9px] leading-none text-primary"><Sparkles className="h-2.5 w-2.5" />AI生成</span> : <span className="shrink-0 whitespace-nowrap rounded border px-1 py-0.5 text-[9px] leading-none">手动上传</span>}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{f.crop || "未标注"}</td>
                    <td className="p-3"><span className="block max-w-44 truncate" title={populationOf(f)}>{populationOf(f)}</span></td>
                    <td className="p-3 tabular-nums whitespace-nowrap">{metaOf(f).year}</td>
                    <td className="p-3 whitespace-nowrap">{metaOf(f).region}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Switch aria-label={`${f.name}的公开状态`} checked={f.public} disabled={!isAdmin} onCheckedChange={(v) => { setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, public: v } : x))); toast.success(v ? "已设为公开" : "已设为私有"); }} />
                        <span className="text-xs text-muted-foreground">{f.public ? "公开" : "私有"}</span>
                        <StatusBadge status={f.status} />
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap sticky right-0 bg-card group-hover:bg-muted">
                      <Button size="sm" variant="ghost" className="px-2 text-primary" onClick={() => setTraitView(f)}><Info />详情</Button>
                      <Button size="sm" variant="ghost" className="px-2 text-primary" onClick={() => toast.success("开始下载 " + f.name)}><Download />下载</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="更多"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setVersions(f)}><History className="h-4 w-4" />历史版本</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPreview(f)}><Eye className="h-4 w-4" />预览</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDetail({ title: `文件属性：${f.name}`, desc: f.desc, fields: [["文件ID", f.id], ["文件名", f.name], ["所属节点", findNode(tree, f.nodeId)?.name ?? "—"], ["上传者", f.owner], ["大小", f.size], ["行数", f.rows], ["是否公开", f.public ? "公开" : "私有"], ["审核状态", f.status], ["文件时间", f.date]] })}><Info className="h-4 w-4" />文件属性</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditFile(f)}><Pencil className="h-4 w-4" />修改</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { const v = mockVersions(f); setCompare({ file: f, a: v[1]!, b: v[0]! }); }}><GitCompare className="h-4 w-4" />版本对比</DropdownMenuItem>
                          <DropdownMenuItem asChild><Link to={isAdmin ? "/admin/analysis" : "/user/analysis"} search={{ tab: "trait" }}><LineChart className="h-4 w-4" />性状分析</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmFiles([f.id])}><Trash2 className="h-4 w-4" />删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={9} className="p-12 text-center text-muted-foreground"><Inbox className="mx-auto h-10 w-10 opacity-40" /><p className="mt-2">暂无数据</p>{(q || fYear !== "all" || fRegion !== "all" || fPub !== "all") && <p className="text-xs mt-1">请调整搜索关键词或筛选条件</p>}</td></tr>}
              </tbody>
            </table>
          </div>
          <FullPagination total={list.length} page={cur} pageSize={per} onPage={setPage} onPageSize={setPer} />
        </div>
      </div>

      <Dialog open={!!mergeSources} onOpenChange={(open) => { if (!open && !merging) setMergeSources(null); }}>
        <DialogContent className="max-w-lg" onEscapeKeyDown={(event) => { if (merging) event.preventDefault(); }} onInteractOutside={(event) => { if (merging) event.preventDefault(); }}>
          <DialogHeader><DialogTitle>合并表型文件</DialogTitle><DialogDescription>系统将根据材料编号/名称自动横向合并数据</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merge-strategy">合并策略</Label>
              <Select value={mergeStrategy} disabled={merging} onValueChange={(value) => { if (value === "material" || value === "plot") setMergeStrategy(value); }}>
                <SelectTrigger id="merge-strategy" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="material">按材料名称合并</SelectItem><SelectItem value="plot">按小区编号合并</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">来源文件（{mergeSources?.length ?? 0} 个）</p>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm text-muted-foreground">{mergeSources?.map((file) => <li key={file.id} className="break-all">{file.name}</li>)}</ul>
            </div>
            <p className="text-xs text-muted-foreground">本次为模拟合并，原文件保持不变；新文件保存在当前目录，默认为私有、待审核。</p>
            {merging && <p role="status" className="flex items-center gap-2 text-sm text-primary"><LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />正在合并...</p>}
          </div>
          <DialogFooter><Button variant="outline" disabled={merging} onClick={() => setMergeSources(null)}>取消</Button><Button disabled={merging || (mergeSources?.length ?? 0) < 2} onClick={() => setMerging(true)}>{merging ? "正在合并..." : "确认合并"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!versions} onOpenChange={(o) => !o && setVersions(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>历史版本</SheetTitle><SheetDescription>{versions?.name}</SheetDescription></SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[80vh] space-y-4">
          {versions?.merge && <div>
            <h3 className="text-sm font-semibold">合并来源（{versions.merge.sources.length} 个文件）</h3>
            <p className="mt-1 text-xs text-muted-foreground">{mergeStrategyLabel(versions.merge.strategy)}</p>
            <ul className="mt-3 space-y-3">{versions.merge.sources.map((source) => <li key={source.id} className="rounded-lg border p-3">
              <p className="break-all text-sm font-medium">{source.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">文件 ID：{source.id} · {source.date} · {source.owner} · {source.rows} 行</p>
              <p className="mt-1 break-words text-xs text-muted-foreground">所属目录：{pathOf(tree, source.nodeId)?.join(" > ") ?? source.nodeId}</p>
            </li>)}</ul>
          </div>}
          <ul className="space-y-3">
            {versions && (versions.merge ? [{ v: "v1", date: versions.date, author: versions.owner, note: `由 ${versions.merge.sources.length} 个文件合并生成`, rows: versions.rows }] : mockVersions(versions)).map((v, i, all) => (
              <li key={v.v} className="rounded-xl border p-3">
                <div className="flex items-center gap-2"><span className="font-display font-semibold">{v.v}</span>{i === 0 && <span className="rounded-md bg-primary-soft px-1.5 text-xs text-primary">当前</span>}<span className="ml-auto text-xs text-muted-foreground">{v.date} · {v.author}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{v.note} · {v.rows} 行</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setPreview(versions)}><Eye />预览</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success(`开始下载 ${versions.name}（${v.v}）`)}><Download />下载</Button>
                  {all[i + 1] && <Button size="sm" variant="outline" onClick={() => setCompare({ file: versions, a: all[i + 1]!, b: v })}><GitCompare />与 {all[i + 1]!.v} 对比</Button>}
                </div>
              </li>
            ))}
          </ul>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!compare} onOpenChange={(o) => !o && setCompare(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>版本对比：{compare?.a.v} → {compare?.b.v}</DialogTitle><DialogDescription>{compare?.file.name}</DialogDescription></DialogHeader>
          <div className="flex flex-wrap gap-3 rounded-xl border bg-muted/40 px-3 py-2 text-sm text-foreground">
            <span>新增 <b className="font-display">2</b> 行</span><span>修改 <b className="font-display">3</b> 个单元格</span>
            <span className="ml-auto flex items-center gap-3 text-xs"><span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm bg-primary/20 border border-primary/50" />新增行</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm bg-warning/30 border border-warning/60" />修改单元格</span></span>
          </div>
          <div className="max-h-[50vh] overflow-auto rounded-xl border">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-muted text-xs text-muted-foreground"><tr>{traitCols.slice(0, 8).map((h) => <th key={h} className="p-2.5 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {diffRows().map((d, i) => (
                  <tr key={i} className={cn("border-t", d.kind === "added" && "bg-primary/15")}>
                    {d.row.map((c, j) => <td key={j} className={cn("p-2.5", j > 2 && "font-display", d.cells.includes(j) && "bg-warning/30 font-semibold")}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCompare(null)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!traitView} onOpenChange={(o) => !o && setTraitView(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>数据详情：{traitView?.name}</DialogTitle><DialogDescription>{traitView?.desc} · 共 {traitView?.rows} 行，展示前 {traitRows.length} 行</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-xl border">
            <table className="text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground"><tr>{traitCols.map((h) => <th key={h} className="p-2.5 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>{traitRows.map((r, i) => <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className={cn("p-2.5", j > 2 && "font-display")}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTraitView(null)}>关闭</Button>
            <Button onClick={() => traitView && toast.success("开始下载 " + traitView.name)}><Download />下载</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>预览：{preview?.name}</DialogTitle><DialogDescription>{preview?.desc}</DialogDescription></DialogHeader>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["材料", "重复", "小区", "株高(cm)", "穗长(cm)", "千粒重(g)"].map((h) => <th key={h} className="p-2.5 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2.5">{r.material}</td><td className="p-2.5">{r.rep}</td><td className="p-2.5">{r.plot}</td>
                    <td className="p-2.5 font-display">{r.height}</td>
                    <td className={cn("p-2.5 font-display", r.spike === null && "bg-destructive/10 text-destructive")}>{r.spike ?? "缺失"}</td>
                    <td className="p-2.5 font-display">{r.tkw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">共 {preview?.rows} 行，显示前 6 行；红色单元格为缺失值。</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!missing} onOpenChange={(o) => !o && setMissing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>缺失值处理：{missing?.file.name}</DialogTitle><DialogDescription>共检测到 {missing?.rows.length ?? 0} 处缺失值，可逐条填充默认值或删除该行。</DialogDescription></DialogHeader>
          <div className="rounded-xl border divide-y text-sm">
            {missing?.rows.map((r) => (
              <div key={r.row} className="flex items-center gap-2 p-2.5">
                <span className="flex-1">第 <b className="font-display">{r.row}</b> 行 · 字段「{r.field}」<span className="text-destructive ml-1">缺失</span></span>
                <Button size="sm" variant="outline" onClick={() => { setMissing((m) => m && { ...m, rows: m.rows.filter((x) => x.row !== r.row) }); toast.success(`第 ${r.row} 行已填充默认值（列均值）`); }}>填充默认值</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setMissing((m) => m && { ...m, rows: m.rows.filter((x) => x.row !== r.row) }); setFiles((fs) => fs.map((x) => (x.id === missing.file.id ? { ...x, rows: x.rows - 1 } : x))); toast.success(`已删除第 ${r.row} 行`); }}>删除该行</Button>
              </div>
            ))}
            {missing && missing.rows.length === 0 && <p className="p-6 text-center text-muted-foreground">缺失值已全部处理</p>}
          </div>
          <DialogFooter><Button onClick={() => setMissing(null)}>完成</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejected} onOpenChange={(o) => !o && setRejected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>审核反馈：{rejected?.name}</DialogTitle><DialogDescription>审核状态：{rejected?.status}</DialogDescription></DialogHeader>
          <div className="rounded-xl bg-destructive/5 p-4 text-sm space-y-1">
            <p className="font-medium text-destructive">驳回原因：重复记录 14 条</p>
            <p className="text-muted-foreground">第 33–46 行与第 1–14 行的材料、重复、小区完全一致，请去重后重新提交。审核人：admin · 2026-09-21</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (rejected) openEditFile(rejected); setRejected(null); }}><Pencil />修改文件</Button>
            <Button onClick={() => { if (!rejected) return; setFiles((fs) => fs.map((x) => (x.id === rejected.id ? { ...x, status: "待审核" } : x))); logAction(`重新提交「${rejected.name}」`); setRejected(null); toast.success("已去重并重新提交审核"); }}>去重并重新提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fileDlg} onOpenChange={(o) => !o && setFileDlg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{fileDlg?.mode === "add" ? "新增文件" : "修改文件属性"}</DialogTitle>
            {fileDlg?.mode === "add" && <DialogDescription>文件将上传到节点「{node.name}」</DialogDescription>}
            {fileDlg?.mode === "edit" && editHint && <DialogDescription className="text-warning">{editHint}</DialogDescription>}
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2"><Label>文件名</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="wheat_2026_height.csv" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>文件描述</Label><Textarea rows={2} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="如：株高、穗长、千粒重" /></div>
            <div className="space-y-1.5"><Label>日期</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <label className="flex items-center justify-between rounded-xl border px-3 self-end h-9 text-sm">是否公开<Switch checked={form.public} onCheckedChange={(v) => setForm({ ...form, public: v })} /></label>
            {fileDlg?.mode === "add" && (
              <label className="sm:col-span-2 block rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary hover:bg-primary-soft/40 transition-colors">
                <Upload className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-sm">{form.csv ? `已选择：${form.csv}` : "点击选择 CSV 文件"}</p>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((s) => ({ ...s, csv: f.name, name: s.name || f.name })); }} />
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileDlg(null)}>取消</Button>
            <Button onClick={saveFile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailDialog info={detail} onClose={() => setDetail(null)} />
      <ConfirmDialog open={!!confirmFiles} title={`确认删除 ${confirmFiles?.length ?? 0} 个文件？`} desc="删除后将移入回收站，30 天内可恢复。"
        onClose={() => setConfirmFiles(null)}
        onConfirm={() => { setFiles((fs) => fs.filter((f) => !confirmFiles?.includes(f.id))); setSel([]); setConfirmFiles(null); toast.success("已删除"); }} />

      <NodeFormDialog open={nodeDlg === "add"} title={`在「${node.name}」下添加子节点`} initial={{ name: "", public: true }} onClose={() => setNodeDlg(null)}
        onSave={(v) => { const id = `n${Date.now()}`; setTree(addChild(tree, node.id, { id, ...v })); setNodeId(id); setNodeDlg(null); toast.success(`已添加节点「${v.name}」`); logAction(`新增节点「${v.name}」`); }} />
      <NodeFormDialog open={nodeDlg === "edit"} title="修改节点" initial={{ name: node.name, public: node.public }} onClose={() => setNodeDlg(null)}
        onSave={(v) => { setTree(updateNode(tree, node.id, v)); setNodeDlg(null); toast.success("节点已修改"); logAction(`修改节点「${v.name}」`); }} />
      <ConfirmDialog open={delNode} title={`确认删除节点「${node.name}」？`} desc="该节点及其子节点下的文件将一并删除。" onClose={() => setDelNode(false)}
        onConfirm={() => { const ids = new Set(collectIds(node)); setFiles(files.filter((f) => !ids.has(f.nodeId))); setTree(removeNode(tree, node.id)); setNodeId("d0"); setDelNode(false); logAction(`删除节点「${node.name}」`); toast.success("节点已删除"); }} />
    </div>
  );
}
