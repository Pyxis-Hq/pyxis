// Fixed histogram v1. Upper bounds in ms; last bucket is +Inf. Counts are NON-cumulative.
export const HISTOGRAM_BOUNDS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;
export const HISTOGRAM_BUCKETS = HISTOGRAM_BOUNDS_MS.length + 1; // 12

export function bucketIndex(valueMs: number): number {
  for (let i = 0; i < HISTOGRAM_BOUNDS_MS.length; i++) if (valueMs <= HISTOGRAM_BOUNDS_MS[i]) return i;
  return HISTOGRAM_BOUNDS_MS.length;
}

/**
 * Re-bucket an exporter histogram onto the fixed bounds. Each source bucket is assigned by its
 * UPPER bound (overflow bucket -> +Inf), so latency is never under-reported. Approximation error is
 * bounded by the source bucket width; documented in docs/04.
 */
export function rebucket(srcBoundsMs: number[], srcCounts: number[]): number[] {
  const out = new Array<number>(HISTOGRAM_BUCKETS).fill(0);
  srcCounts.forEach((n, i) => {
    if (!n) return;
    const idx = i < srcBoundsMs.length ? bucketIndex(srcBoundsMs[i]) : HISTOGRAM_BUCKETS - 1;
    out[idx] += n;
  });
  return out;
}

export function mergeCounts(a: number[], b: number[]): number[] {
  return a.map((x, i) => x + (b[i] ?? 0));
}

/** Quantile from merged counts with linear interpolation inside the bucket. +Inf bucket reports its lower bound. */
export function quantile(counts: number[], q: number): number | null {
  const total = counts.reduce((s, n) => s + n, 0);
  if (!total) return null;
  const rank = q * total;
  let cum = 0;
  for (let i = 0; i < counts.length; i++) {
    const next = cum + counts[i];
    if (next >= rank && counts[i] > 0) {
      const lo = i === 0 ? 0 : HISTOGRAM_BOUNDS_MS[i - 1];
      if (i >= HISTOGRAM_BOUNDS_MS.length) return lo;
      const hi = HISTOGRAM_BOUNDS_MS[i];
      return lo + ((rank - cum) / counts[i]) * (hi - lo);
    }
    cum = next;
  }
  return HISTOGRAM_BOUNDS_MS[HISTOGRAM_BOUNDS_MS.length - 1];
}
