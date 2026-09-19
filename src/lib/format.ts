const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

const numFmt = new Intl.NumberFormat("en-IN")

export function formatCurrency(value: number): string {
  return inrFmt.format(value)
}

export function formatNumber(value: number): string {
  return numFmt.format(value)
}

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

// "₹12,34,567" — whole rupees, Indian digit grouping, for headline numbers.
export function formatInr(value: number): string {
  return inrWhole.format(Math.round(value))
}

// "₹1.2L" / "₹3.4Cr" — short form for chart axes, the way people say it in India.
export function formatCompactInr(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "")
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3)}K`
  return `${sign}₹${Math.round(abs)}`
}

export function formatDate(value: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// "17 Sep 2026, 9:42 pm" — used where the exact time matters (order timelines).
export function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
