import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimestamp, truncate } from './formatUtils';

describe('formatDuration', () => {
  it('returns dash for undefined', () => {
    expect(formatDuration(undefined)).toBe('—');
  });

  it('formats milliseconds', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds with fractional part', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(1200)).toBe('1.2s');
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(59900)).toBe('59.9s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m');
    expect(formatDuration(65000)).toBe('1m 5s');
    expect(formatDuration(3599000)).toBe('59m 59s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h 0m');
    expect(formatDuration(5400000)).toBe('1h 30m');
    expect(formatDuration(7200000)).toBe('2h 0m');
  });
});

describe('formatTimestamp', () => {
  it('returns dash for empty/undefined', () => {
    expect(formatTimestamp(undefined)).toBe('—');
    expect(formatTimestamp('')).toBe('—');
  });

  it('formats a valid ISO string', () => {
    const result = formatTimestamp('2024-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
  });
});

describe('truncate', () => {
  it('returns string unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
    expect(truncate('abcdefgh', 4)).toBe('abc…');
  });
});
