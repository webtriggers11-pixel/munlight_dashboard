// Date ranges for the Insights page. Everything is a plain "YYYY-MM-DD" string in
// India time (IST), because that is how the shop thinks about "today" and "this
// month" — and how the API buckets orders.

export interface DateRange {
  start: string
  end: string
}

export type PresetKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "fy"

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "fy", label: "This financial year" },
]

export function todayIST(): string {
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function presetRange(key: PresetKey): DateRange {
  const today = todayIST()
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7)) // 1–12

  switch (key) {
    case "today":
      return { start: today, end: today }
    case "yesterday": {
      const y = shiftDays(today, -1)
      return { start: y, end: y }
    }
    case "7d":
      return { start: shiftDays(today, -6), end: today }
    case "30d":
      return { start: shiftDays(today, -29), end: today }
    case "month":
      return { start: `${today.slice(0, 7)}-01`, end: today }
    case "last_month": {
      const first = new Date(Date.UTC(year, month - 2, 1))
      const last = new Date(Date.UTC(year, month - 1, 0))
      return {
        start: first.toISOString().slice(0, 10),
        end: last.toISOString().slice(0, 10),
      }
    }
    case "fy": {
      // Indian financial year runs 1 April – 31 March.
      const fyStartYear = month >= 4 ? year : year - 1
      return { start: `${fyStartYear}-04-01`, end: today }
    }
  }
}

export function sameRange(a: DateRange, b: DateRange): boolean {
  return a.start === b.start && a.end === b.end
}

const dayFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})
const dayYearFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

// "18 Sep 2026" or "1 Sep – 19 Sep 2026"
export function describeRange({ start, end }: DateRange): string {
  const s = new Date(`${start}T00:00:00Z`)
  const e = new Date(`${end}T00:00:00Z`)
  if (start === end) return dayYearFmt.format(e)
  return `${dayFmt.format(s)} – ${dayYearFmt.format(e)}`
}

export function formatBucketLabel(
  iso: string,
  bucket: "day" | "week" | "month"
): string {
  if (bucket === "month") {
    const d = new Date(`${iso}-01T00:00:00Z`)
    return d.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
  }
  const d = new Date(`${iso}T00:00:00Z`)
  const label = dayFmt.format(d)
  return bucket === "week" ? `Week of ${label}` : label
}
