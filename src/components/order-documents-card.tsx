import { useState } from "react"
import { DownloadIcon, FileTextIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import {
  getShipmentDocumentUrl,
  type ShipmentDocument,
} from "@/services/orders"
import type { OrderAdmin } from "@/types/order"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DocRow {
  doc: ShipmentDocument
  title: string
  description: string
  /** null when the document can be fetched, otherwise why it can't. */
  blockedReason: string | null
}

// Each document has its own precondition on the API side; mirroring them here
// means a manager sees *why* a document isn't ready instead of a 400 toast.
function documentRows(order: OrderAdmin): DocRow[] {
  const shipment = order.shipment_detail
  const inShiprocket = !!shipment?.shiprocket_order_id

  const noShipment = !shipment
    ? "Create the shipment first."
    : !inShiprocket
      ? "This shipment isn’t in Shiprocket yet."
      : null

  return [
    {
      doc: "label",
      title: "Shipping label",
      description: "The courier label to print and stick on the parcel.",
      blockedReason: shipment?.awb_number
        ? null
        : (noShipment ?? "No AWB assigned yet."),
    },
    {
      doc: "invoice",
      title: "Invoice",
      description: "Shiprocket’s invoice for this shipment.",
      blockedReason: noShipment,
    },
    {
      doc: "manifest",
      title: "Manifest",
      description:
        "The handover sheet for the courier. Generated on first request.",
      blockedReason: noShipment,
    },
  ]
}

export function OrderDocumentsCard({ order }: { order: OrderAdmin }) {
  const [busy, setBusy] = useState<ShipmentDocument | null>(null)
  const rows = documentRows(order)

  async function openDocument(doc: ShipmentDocument) {
    // The tab has to be opened synchronously inside the click, or the popup
    // blocker kills it once we await the URL. `noopener` in the feature string
    // would make window.open return null, so the opener is cleared by hand.
    const tab = window.open("", "_blank")
    if (tab) tab.opener = null

    setBusy(doc)
    try {
      const url = await getShipmentDocumentUrl(order.id, doc)
      if (tab) {
        tab.location.href = url
      } else {
        // Popup blocked — offer it behind a fresh click instead.
        toast.success("Document ready", {
          action: {
            label: "Open",
            onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
          },
        })
      }
    } catch (err) {
      tab?.close()
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Shipping documents</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.doc}
            className="flex flex-col gap-3 rounded-md border p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileTextIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {row.blockedReason ?? row.description}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-auto w-full"
              disabled={!!row.blockedReason || busy !== null}
              onClick={() => openDocument(row.doc)}
            >
              {busy === row.doc ? (
                <Loader2 className="animate-spin" />
              ) : (
                <DownloadIcon />
              )}
              Open PDF
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
