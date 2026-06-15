import { useState, useEffect } from "react"
import { Loader2, RefreshCwIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import {
  getStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from "@/services/store-settings"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function StoreSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<StoreSettings | null>(null)

  useEffect(() => {
    getStoreSettings()
      .then(setForm)
      .catch(() => toast.error("Failed to load store settings"))
  }, [])

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    try {
      const updated = await updateStoreSettings({
        cod_enabled             : form.cod_enabled,
        cod_charge              : form.cod_charge,
        free_shipping_threshold : form.free_shipping_threshold,
        min_order_amount        : form.min_order_amount,
      })
      setForm((prev) => (prev ? { ...prev, ...updated } : updated))
      toast.success("Store settings saved")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  const hasPickup = form.pickup_pincode || form.pickup_city

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Store Settings"
        description="Configure COD, free shipping, and view your synced pickup address."
      />

      {/* ── Order & Payment settings ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order &amp; Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 max-w-xl">
          {/* COD */}
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Cash on Delivery (COD)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customers can pay on delivery. Enable only if your logistics supports it.
              </p>
            </div>
            <Switch
              checked={form.cod_enabled}
              onCheckedChange={(v) => set("cod_enabled", v)}
            />
          </div>

          {form.cod_enabled && (
            <div className="grid gap-2">
              <Label htmlFor="cod_charge">COD handling charge (₹)</Label>
              <Input
                id="cod_charge"
                type="number"
                min={0}
                step={1}
                value={form.cod_charge}
                onChange={(e) => set("cod_charge", Number(e.target.value))}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Added to order total for COD orders. Set 0 for no charge.
              </p>
            </div>
          )}

          {/* Free shipping */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="free_shipping_toggle"
                checked={form.free_shipping_threshold !== null}
                onChange={(e) =>
                  set("free_shipping_threshold", e.target.checked ? 999 : null)
                }
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="free_shipping_toggle">
                Enable free shipping above a threshold
              </Label>
            </div>
            {form.free_shipping_threshold !== null && (
              <div className="grid gap-2 pl-7">
                <Label htmlFor="threshold">Free shipping above (₹)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={0}
                  step={1}
                  value={form.free_shipping_threshold}
                  onChange={(e) =>
                    set("free_shipping_threshold", Number(e.target.value))
                  }
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  Orders with subtotal ≥ this amount get free shipping. Shiprocket rate
                  is still fetched but the customer is charged ₹0.
                </p>
              </div>
            )}
          </div>

          {/* Min order */}
          <div className="grid gap-2">
            <Label htmlFor="min_order">Minimum order amount (₹)</Label>
            <Input
              id="min_order"
              type="number"
              min={0}
              step={1}
              value={form.min_order_amount}
              onChange={(e) => set("min_order_amount", Number(e.target.value))}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">Set to 0 to allow any order size.</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="w-fit">
              {saving && <Loader2 className="size-4 animate-spin" />}
              <SaveIcon className="size-4" />
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Pickup address (read-only, synced from Shiprocket) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pickup / warehouse address</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Synced from Shiprocket. To update go to{" "}
            <span className="font-medium">Shipping → Sync pickup</span>.
          </p>
          {hasPickup ? (
            <div className="grid gap-1.5 text-sm max-w-md">
              {form.shiprocket_pickup_location && (
                <Row label="Location name" value={form.shiprocket_pickup_location} />
              )}
              {form.pickup_name    && <Row label="Contact"  value={form.pickup_name} />}
              {form.pickup_phone   && <Row label="Phone"    value={form.pickup_phone} />}
              {form.pickup_address && <Row label="Address"  value={form.pickup_address} />}
              {(form.pickup_city || form.pickup_state) && (
                <Row
                  label="City / State"
                  value={[form.pickup_city, form.pickup_state].filter(Boolean).join(", ")}
                />
              )}
              {form.pickup_pincode && <Row label="Pincode"  value={form.pickup_pincode} />}
              {form.pickup_country && <Row label="Country"  value={form.pickup_country} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pickup address synced yet. Go to{" "}
              <span className="font-medium">Shipping</span> and click the{" "}
              <RefreshCwIcon className="inline size-3" /> sync icon next to your Shiprocket config.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  )
}
