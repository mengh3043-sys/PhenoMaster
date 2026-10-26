import { useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { TreeNode } from "@/lib/mock";
import { ALL_IMAGES_NODE } from "@/store/imageStatistics";
import { cn } from "@/lib/utils";

function Directory({ node, selected, toggle }: { node: TreeNode; selected: string[]; toggle: (id: string) => void }) {
  const [open, setOpen] = useState(true);
  if (!node.public) return null;
  return <li>
    <div className={cn("flex min-w-0 items-center gap-1 rounded py-1", selected.includes(node.id) && "bg-primary-soft")}>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label={`展开或折叠${node.name}`} onClick={() => setOpen(!open)} disabled={!node.children?.length}><ChevronRight className={cn("h-3 w-3", open && "rotate-90", !node.children?.length && "invisible")} /></Button>
      <Checkbox id={`statistics-${node.id}`} checked={selected.includes(node.id)} onCheckedChange={() => toggle(node.id)} aria-label={`选择目录${node.name}`} />
      <label htmlFor={`statistics-${node.id}`} className="flex min-w-0 cursor-pointer items-center gap-1.5 text-xs"><Folder className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate" title={node.name}>{node.name}</span></label>
    </div>
    {open && node.children && <ul className="ml-3 border-l pl-1">{node.children.map((child) => <Directory key={child.id} node={child} selected={selected} toggle={toggle} />)}</ul>}
  </li>;
}
export function StatisticsDirectoryTree({ tree, selected, onChange, rootId = ALL_IMAGES_NODE, rootName = "全部图片", title = "图片目录" }: { tree: TreeNode[]; selected: string[]; onChange: (ids: string[]) => void; rootId?: string; rootName?: string; title?: string }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : id === rootId ? [id] : [...selected.filter((s) => s !== rootId), id]);
  return <aside className="max-h-[680px] shrink-0 overflow-y-auto rounded-lg border bg-card p-3 lg:w-56 lg:self-start"><p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p><ul><Directory node={{ id: rootId, name: rootName, public: true, children: tree }} selected={selected} toggle={toggle} /></ul></aside>;
}