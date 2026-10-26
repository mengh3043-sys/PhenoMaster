export function comparisonConclusion(diff: number) {
  if (diff > 0) return "优于均值";
  if (diff < 0) return "低于均值";
  return "持平";
}

/** Independent physical-unit limits; never compare centimetres and grams on one scale. */
export function indicatorMaximum(values: number[]) {
  const peak = Math.max(1, ...values.filter(Number.isFinite));
  const step = 10 ** Math.floor(Math.log10(peak)) / 2;
  return Math.ceil((peak * 1.15) / step) * step;
}

export function normalizeIndicator(value: number, max: number) {
  return max > 0 ? value / max * 100 : 0;
}