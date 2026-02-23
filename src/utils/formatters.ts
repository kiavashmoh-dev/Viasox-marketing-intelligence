export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function classifyFrequency(percent: number): string {
  if (percent > 5) return 'Very Common';
  if (percent >= 2) return 'Moderately Common';
  return 'Not Common';
}
