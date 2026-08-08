import { useRef, useState } from "react"
import {
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  Loader2,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import {
  bulkImportProducts,
  type BulkImportRowResult,
  type BulkImportStatus,
  type BulkImportSummary,
} from "@/services/products"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"

const ACCEPT = ".csv,.xlsx,.xlsm"
const MAX_BYTES = 5 * 1024 * 1024

const STATUS_VARIANT: Record<
  BulkImportStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  created: "default",
  updated: "secondary",
  revived: "outline",
  skipped: "destructive",
}

const TEMPLATE_HEADERS = [
  "Category Path", "Product Name", "SKU", "Description", "Price", "MRP",
  "Stock", "Collection", "Material", "Color", "Weight (kg)", "Length (cm)",
  "Breadth (cm)", "Height (cm)", "HSN Code", "Tags", "Handmade (Yes/No)",
  "Featured (Yes/No)", "New Arrival (Yes/No)", "Bestseller (Yes/No)",
  "Product URL",
]

const TEMPLATE_EXAMPLE = [
  "Handmade Jewellery > Pendant Sets", "Square meenakari pendants",
  "MB-MPS-001",
  "Square meenakari pendants with earrings from our Festive Collection.",
  "230", "300", "1", "Festival", "Meenakari", "", "20", "8.5", "", "", "",
  "festive, pendant set", "Yes", "No", "No", "No",
  "https://example.com/square-meenakari.jpg",
]

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<"validate" | "import" | null>(null)
  const [summary, setSummary] = useState<BulkImportSummary | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(next: File | null) {
    if (next && next.size > MAX_BYTES) {
      toast.error("File too large. Maximum allowed size is 5 MB.")
      return
    }
    setFile(next)
    setSummary(null)
  }

  async function run(dryRun: boolean) {
    if (!file) return
    setBusy(dryRun ? "validate" : "import")
    try {
      const result = await bulkImportProducts(file, dryRun)
      setSummary(result)
      if (dryRun) {
        toast.success(
          `Validated ${result.total} row(s) — ${result.skipped} would be skipped`
        )
      } else {
        toast.success(
          `Imported: ${result.created} created, ${result.updated} updated, ${result.revived} revived`
        )
      }
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const failedRows: BulkImportRowResult[] =
    summary?.rows.filter((r) => r.status === "skipped") ?? []

  const warningRows: BulkImportRowResult[] =
    summary?.rows.filter((r) => r.warnings && r.warnings.length > 0) ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bulk Upload"
        description="Import products in bulk from a CSV or Excel sheet. Rows are matched by SKU — existing SKUs are updated, new SKUs are created."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <FileSpreadsheetIcon />
            Download template
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload sheet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            The last column, <span className="font-medium text-foreground">Product URL</span>,
            is optional — paste a public image link (or several, separated by commas)
            to attach product images. <span className="font-medium text-foreground">Google Drive
            share links work</span> — just set the file's sharing to “Anyone with the link”.
            Images are downloaded and stored on import. Leave it blank to import without images.
            (Dry run validates the sheet only; images are fetched on the real import.)
          </p>
          <label
            htmlFor="bulk-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pickFile(e.dataTransfer.files?.[0] ?? null)
            }}
          >
            <UploadCloudIcon className="size-8 text-muted-foreground" />
            {file ? (
              <>
                <span className="text-sm font-medium text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB — click to choose a different file
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-foreground">
                  Click to browse or drag a file here
                </span>
                <span className="text-xs text-muted-foreground">
                  CSV or Excel (.xlsx) — max 5 MB
                </span>
              </>
            )}
            <input
              ref={inputRef}
              id="bulk-file"
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={!file || busy !== null}
              onClick={() => run(true)}
            >
              {busy === "validate" ? <Loader2 className="animate-spin" /> : null}
              Validate (dry run)
            </Button>
            <Button disabled={!file || busy !== null} onClick={() => run(false)}>
              {busy === "import" ? <Loader2 className="animate-spin" /> : <UploadCloudIcon />}
              Import products
            </Button>
            {file ? (
              <Button
                variant="ghost"
                disabled={busy !== null}
                onClick={() => {
                  setFile(null)
                  setSummary(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.dry_run ? (
                <>
                  <CheckCircle2Icon className="size-5 text-muted-foreground" />
                  Dry run result — nothing was saved
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-5 text-primary" />
                  Import complete
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard label="Total rows" value={summary.total} />
              <StatCard label="Created" value={summary.created} />
              <StatCard label="Updated" value={summary.updated} />
              <StatCard label="Revived" value={summary.revived} />
              <StatCard label="Skipped" value={summary.skipped} />
            </div>

            {failedRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircleIcon className="size-4" />
                  {failedRows.length} row(s) skipped due to errors
                </p>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedRows.map((r) => (
                        <TableRow key={r.row}>
                          <TableCell className="tabular-nums">{r.row}</TableCell>
                          <TableCell>{r.sku ?? "—"}</TableCell>
                          <TableCell>{r.name}</TableCell>
                          <TableCell className="text-destructive">{r.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            {warningRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500">
                  <XCircleIcon className="size-4" />
                  {warningRows.length} row(s) imported with image warnings
                </p>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Warning</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warningRows.map((r) =>
                        r.warnings.map((w, idx) => (
                          <TableRow key={`${r.row}-${idx}`}>
                            <TableCell className="tabular-nums">{r.row}</TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell className="text-amber-600 dark:text-amber-500">{w}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">All rows</p>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.rows.map((r) => (
                      <TableRow key={r.row}>
                        <TableCell className="tabular-nums">{r.row}</TableCell>
                        <TableCell>{r.sku ?? "—"}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
