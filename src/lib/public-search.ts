export function normalizeSearchQuery(value: string) {
  return value.trim().replace(/^#+/, "").trim();
}

const aliases = [
  ["drought", "干旱", "抗旱"],
  ["wheat", "小麦"],
  ["maize", "corn", "玉米"],
  ["rice", "水稻"],
  ["uav", "无人机"],
  ["ndvi", "植被指数"],
];

export function matchesPublicSearch(query: string, ...values: unknown[]) {
  const keyword = normalizeSearchQuery(query).toLowerCase();
  if (!keyword) return false;
  const terms = aliases.find(group => group.includes(keyword)) ?? [keyword];
  return values.some(value => terms.some(term => String(value ?? "").toLowerCase().includes(term)));
}

export function isPublicSearchFile(file: { public: boolean; status: string }) {
  return file.public && file.status === "已审核";
}