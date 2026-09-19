// Pickup date helpers shared by the order detail page and the order dialog.

// Local YYYY-MM-DD (not UTC) so the default date matches the admin's timezone.
export function toISODate(d: Date): string {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export function todayISODate(): string {
  return toISODate(new Date())
}

// Shiprocket-style pickup date chips. We generate these ourselves (Today,
// Tomorrow, then upcoming days) because Shiprocket's public API does not expose
// the list of couriers' available slots. Sundays are skipped as most couriers
// don't collect then; if the manager still hits an unavailable date, Shiprocket
// shifts it to the nearest slot and we surface the confirmed date afterwards.
export function pickupDateOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const start = new Date()
  let offset = 0
  while (options.length < 6) {
    const d = new Date(start)
    d.setDate(start.getDate() + offset)
    offset += 1
    if (d.getDay() === 0 && options.length > 0) continue // skip Sundays (keep today)
    const value = toISODate(d)
    let label: string
    if (offset - 1 === 0) label = "Today"
    else if (offset - 1 === 1) label = "Tomorrow"
    else
      label = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    options.push({ value, label })
  }
  return options
}

// Formats "2026-09-18" or "2026-09-18 12:44:00" → "18 Sep 2026".
export function formatPickupDate(value: string): string {
  const day = value.slice(0, 10)
  const parsed = new Date(`${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
