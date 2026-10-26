import type { TreeNode } from "@/lib/mock";
import type { FileRow, Img } from "@/store";
import { rawRows, type RawRow } from "./analysisKit";
import { materials, traitByMaterial } from "@/lib/mock";

export function nodePath(tree: TreeNode[], id: string, parents: string[] = []): string {
  for (const node of tree) {
    const path = [...parents, node.name];
    if (node.id === id) return path.join(" / ");
    const found = nodePath(node.children ?? [], id, path);
    if (found) return found;
  }
  return "";
}
export function fileContext(file: FileRow, tree: TreeNode[]) {
  const path = nodePath(tree, file.nodeId);
  return { year: (path.match(/20\d{2}/) ?? file.name.match(/20\d{2}/))?.[0] ?? file.date.slice(0, 4), site: path.match(/郑州|新乡|北京|海淀|扬州|江苏|河南|武汉|湖北|吉林|重庆/)?.[0] ?? "未标注" };
}
/** Existing deterministic demo measurements, scoped by the file's crop/year/location; no measurements are invented for unmatched crops. */
export function fileSamples(file: FileRow, tree: TreeNode[]): RawRow[] {
  const context = fileContext(file, tree);
  const codes = materials.filter(m => m.crop === file.crop).map(m => m.code).filter(code => traitByMaterial.some(r => r.material === code));
  return codes.flatMap(code => rawRows(code).filter(r => r.year === context.year && (context.site === "新乡" ? r.site === "新乡" : r.site === "郑州")).map(r => ({ ...r, site: context.site })));
}
export function countImages(images: Img[], key: (image: Img) => string) {
  return [...images.reduce((map, image) => { const name = key(image); map.set(name, (map.get(name) ?? 0) + 1); return map; }, new Map<string, number>())].map(([name, value]) => ({ name, value }));
}
export function matchesRegion(text: string, region: string) {
  const [province, city] = region.split(" · ");
  if (text.includes(city ?? region)) return true;
  if (region.includes("郑州")) return text.includes("河南") && !text.includes("新乡");
  if (region.includes("海淀")) return text.includes("北京");
  if (region.includes("扬州")) return text.includes("江苏");
  return !!province && text.includes(province) && !text.includes("郑州");
}