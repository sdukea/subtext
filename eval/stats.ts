/** Small statistics helpers for pairwise evaluation (research/09 §7–8). */

export type Verdict = "A" | "B" | "tie";

/**
 * Combine a both-orders pairwise judgement. `first` judged (A,B); `second` judged (B,A) and is
 * reported in that swapped frame. Inconsistent verdicts (position bias) count as a tie.
 */
export function combineOrders(first: Verdict, secondSwapped: Verdict): Verdict {
  const second: Verdict = secondSwapped === "A" ? "B" : secondSwapped === "B" ? "A" : "tie";
  return first === second ? first : "tie";
}

/** Two-sided exact binomial (sign) test on non-tied pairs. */
export function signTest(wins: number, losses: number): number {
  const n = wins + losses;
  if (n === 0) return 1;
  const k = Math.min(wins, losses);
  let p = 0;
  for (let i = 0; i <= k; i++) p += binom(n, i);
  return Math.min(1, (2 * p) / Math.pow(2, n));
}

function binom(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export function summarise(verdicts: Verdict[]) {
  const wins = verdicts.filter((v) => v === "A").length;
  const losses = verdicts.filter((v) => v === "B").length;
  const ties = verdicts.length - wins - losses;
  const winRate = wins + losses ? wins / (wins + losses) : NaN;
  return { n: verdicts.length, wins, losses, ties, winRate, p: signTest(wins, losses) };
}

export const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}

/** Wilson score interval for a binomial proportion (95% by default). */
export function wilson(successes: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [NaN, NaN];
  const p = successes / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - r) / d, (c + r) / d];
}

/** Holm–Bonferroni adjusted p-values (same order as input). */
export function holm(ps: number[]): number[] {
  const order = ps.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const out = new Array<number>(ps.length);
  let running = 0;
  order.forEach(({ p, i }, k) => {
    running = Math.max(running, Math.min(1, (ps.length - k) * p));
    out[i] = running;
  });
  return out;
}

/**
 * Length-controlled win rate (research/09 §3, after Dubois et al. 2024): logistic regression of
 * win (1) / loss (0) on Δ = log(wordsA / wordsB), ties excluded. The intercept is the log-odds of
 * winning at equal length, so LC win rate = σ(β₀). A small ridge penalty keeps the fit finite
 * when the data are separable. Returns NaN with fewer than 3 non-tied pairs.
 */
export function lengthControlledWinRate(pairs: { verdict: Verdict; wordsA: number; wordsB: number }[], ridge = 0.1) {
  const data = pairs
    .filter((p) => p.verdict !== "tie" && p.wordsA > 0 && p.wordsB > 0)
    .map((p) => ({ y: p.verdict === "A" ? 1 : 0, x: Math.log(p.wordsA / p.wordsB) }));
  if (data.length < 3) return { lcWinRate: NaN, slope: NaN, n: data.length };
  let b0 = 0;
  let b1 = 0;
  for (let iter = 0; iter < 50; iter++) {
    let g0 = 0, g1 = -ridge * b1, h00 = 0, h01 = 0, h11 = ridge;
    for (const { x, y } of data) {
      const p = 1 / (1 + Math.exp(-(b0 + b1 * x)));
      const w = p * (1 - p);
      g0 += y - p;
      g1 += (y - p) * x;
      h00 += w;
      h01 += w * x;
      h11 += w * x * x;
    }
    h00 += 1e-9;
    const det = h00 * h11 - h01 * h01;
    if (Math.abs(det) < 1e-12) break;
    const d0 = (h11 * g0 - h01 * g1) / det;
    const d1 = (h00 * g1 - h01 * g0) / det;
    b0 += Math.max(-5, Math.min(5, d0));
    b1 += Math.max(-5, Math.min(5, d1));
    if (Math.abs(d0) + Math.abs(d1) < 1e-8) break;
  }
  return { lcWinRate: 1 / (1 + Math.exp(-b0)), slope: b1, n: data.length };
}
