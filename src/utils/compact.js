// 1000 -> 1K, 1500 -> 1.5K, 2500000 -> 2.5M (one decimal, trailing .0 dropped).
const UNITS = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
export function compact(n) {
  for (const [v, u] of UNITS) {
    if (n >= v) return `${(Math.floor((n / v) * 10) / 10).toString()}${u}`
  }
  return String(n)
}
