import type { ReactNode } from "react"
import { InfoIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// A small "?" that explains a term in plain words. Hover on a computer; the same
// explanation is also written under each section title for phones.
export function Hint({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="What does this mean?"
            className="text-muted-foreground hover:text-foreground"
          >
            <InfoIcon className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface SectionProps {
  title: string
  description?: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}

export function Section({
  title,
  description,
  hint,
  action,
  children,
}: SectionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              {title}
              {hint && <Hint text={hint} />}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 max-w-2xl">
                {description}
              </CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  )
}

// One number with a label and a plain-words line under it.
export function Stat({
  label,
  value,
  note,
  tone,
  hint,
}: {
  label: string
  value: string
  note?: string
  tone?: "good" | "bad"
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
        {hint && <Hint text={hint} />}
      </p>
      <p
        className={
          "text-2xl font-semibold tabular-nums " +
          (tone === "good"
            ? "text-emerald-600"
            : tone === "bad"
              ? "text-destructive"
              : "")
        }
      >
        {value}
      </p>
      {note && <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  )
}

// A label, a bar showing how big it is compared with the largest, and a value.
export function BarRow({
  label,
  value,
  max,
  right,
  sub,
}: {
  label: string
  value: number
  max: number
  right: string
  sub?: string
}) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{right}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${width}%` }}
        />
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
