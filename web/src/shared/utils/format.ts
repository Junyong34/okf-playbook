const numberFormat = new Intl.NumberFormat('ko-KR');

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
}

export function formatChars(chars: number): string {
  return `${formatNumber(chars)}자`;
}
