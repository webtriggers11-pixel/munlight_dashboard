import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import {
  PRESETS,
  describeRange,
  presetRange,
  sameRange,
  todayIST,
  type DateRange,
} from "@/lib/date-ranges"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

// Quick choices first (what shop owners actually use), exact dates as a fallback.
export function RangePicker({ value, onChange }: RangePickerProps) {
  const [from, setFrom] = useState(value.start)
  const [to, setTo] = useState(value.end)
  const [showCustom, setShowCustom] = useState(false)

  const activePreset = PRESETS.find((p) => sameRange(presetRange(p.key), value))
  const customInvalid = !from || !to || from > to

  function pick(range: DateRange) {
    setFrom(range.start)
    setTo(range.end)
    onChange(range)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            size="sm"
            variant={activePreset?.key === preset.key ? "default" : "outline"}
            onClick={() => {
              setShowCustom(false)
              pick(presetRange(preset.key))
            }}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={!activePreset || showCustom ? "default" : "outline"}
          onClick={() => setShowCustom((s) => !s)}
        >
          <CalendarIcon />
          Choose dates
        </Button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
          <div className="grid gap-1.5">
            <Label htmlFor="range-from">From</Label>
            <Input
              id="range-from"
              type="date"
              value={from}
              max={todayIST()}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="range-to">To</Label>
            <Input
              id="range-to"
              type="date"
              value={to}
              max={todayIST()}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={customInvalid}
            onClick={() => onChange({ start: from, end: to })}
          >
            Show
          </Button>
          {customInvalid && from && to && (
            <p className="text-xs text-destructive">
              “From” must be on or before “To”.
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{describeRange(value)}</span>{" "}
        (India time)
      </p>
    </div>
  )
}
