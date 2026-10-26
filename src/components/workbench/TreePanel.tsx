import { useEffect, useState } from "react";
import { ChevronRight, Folder, FolderOpen, Lock } from "lucide-react";
import type { TreeNode } from "@/lib/mock";
import { cn } from "@/lib/utils";

function Node({ node, depth, selected, onSelect, hidePrivate, badges }: { node: TreeNode; depth: number; selected: string; onSelect: (n: TreeNode) => void; hidePrivate: boolean; badges?: Record<string, number> | undefined }) {
  const [open, setOpen] = useState(depth < 2);
  const hit = badges?.[node.id];
  useEffect(() => { if (hit && node.children?.length) setOpen(true); }, [hit, node.children?.length]);
  if (hidePrivate && !node.public) return null;
  const has = !!node.children?.length;
  return (
    <li>
      <button
        onClick={() => { onSelect(node); if (has) setOpen(!open); }}
        className={cn("w-full flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm text-left transition-colors", selected === node.id ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-muted")}
        style={{ paddingLeft: depth * 14 + 6 }}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", !has && "opacity-0", open && "rotate-90")} />
        {open && has ? <FolderOpen className="h-4 w-4 text-primary shrink-0" /> : <Folder className="h-4 w-4 text-primary shrink-0" />}
        <span className="truncate">{node.name}</span>
        {!!hit && <span className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground" aria-label={`${hit} 张匹配`}>{hit}</span>}
        {!node.public && <Lock className="ml-auto h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
      {has && open && (
        <ul>{node.children!.map((c) => <Node key={c.id} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} hidePrivate={hidePrivate} badges={badges} />)}</ul>
      )}
    </li>
  );
}

export function TreePanel({ tree, selected, onSelect, hidePrivate = false, badges }: { tree: TreeNode[]; selected: string; onSelect: (n: TreeNode) => void; hidePrivate?: boolean; badges?: Record<string, number> }) {
  return (
    <aside className="bg-card rounded-2xl border shadow-card p-3 lg:w-64 shrink-0 lg:self-start lg:sticky lg:top-24">
      <p className="px-2 pb-2 text-xs text-muted-foreground">节点目录{hidePrivate && "（仅显示公开与本人节点）"}</p>
      <ul>{tree.map((n) => <Node key={n.id} node={n} depth={0} selected={selected} onSelect={onSelect} hidePrivate={hidePrivate} badges={badges} />)}</ul>
    </aside>
  );
}

export function addChild(tree: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return tree.map((n) => (n.id === parentId ? { ...n, children: [...(n.children ?? []), child] } : { ...n, children: n.children && addChild(n.children, parentId, child) }));
}
export function updateNode(tree: TreeNode[], id: string, patch: Partial<TreeNode>): TreeNode[] {
  return tree.map((n) => (n.id === id ? { ...n, ...patch } : { ...n, children: n.children && updateNode(n.children, id, patch) }));
}
export function removeNode(tree: TreeNode[], id: string): TreeNode[] {
  return tree.filter((n) => n.id !== id).map((n) => ({ ...n, children: n.children && removeNode(n.children, id) }));
}
export function collectIds(n: TreeNode): string[] {
  return [n.id, ...(n.children ?? []).flatMap(collectIds)];
}
export function findNode(tree: TreeNode[], id: string): TreeNode | undefined {
  for (const n of tree) { if (n.id === id) return n; const f = n.children && findNode(n.children, id); if (f) return f; }
  return undefined;
}
