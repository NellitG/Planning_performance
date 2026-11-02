/** Calculate a finite, visually capped indicator progress percentage. */
export function reportProgressPercent(reportedValue: unknown, targetValue: unknown): number {
  const reported = Number(reportedValue);
  const target = Number(targetValue);
  if (!Number.isFinite(reported) || !Number.isFinite(target) || reported <= 0 || target <= 0) return 0;
  return Math.min(100, (reported / target) * 100);
}
