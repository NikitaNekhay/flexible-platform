/**
 * Format milliseconds to human-readable duration string.
 * e.g. 65432 → "1m 5s", 1234 → "1.2s", 123 → "123ms"
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return '—';

  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    const frac = Math.floor((ms % 1000) / 100);
    return frac > 0 ? `${seconds}.${frac}s` : `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  if (minutes < 60) {
    return remainSec > 0 ? `${minutes}m ${remainSec}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h ${remainMin}m`;
}

/**
 * Format an ISO 8601 timestamp to locale-appropriate display string.
 */
export function formatTimestamp(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Truncate a string to maxLen characters with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
