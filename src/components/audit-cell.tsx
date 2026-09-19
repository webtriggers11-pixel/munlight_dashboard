import { formatDate } from "@/lib/format"
import type { AuditUserRef } from "@/types/common"

export function AuditCell({
  at,
  by,
}: {
  at: string | null
  by: AuditUserRef | null
}) {
  return (
    <div className="text-xs leading-tight">
      <div>{formatDate(at)}</div>
      <div className="text-muted-foreground">{by ? by.full_name : "—"}</div>
    </div>
  )
}
