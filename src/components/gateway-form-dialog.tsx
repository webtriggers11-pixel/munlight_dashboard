import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { createGateway, updateGateway } from "@/services/gateway-config"
import type { GatewayConfig, GatewayConfigCreate } from "@/types/gateway"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface GatewayFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gateway: GatewayConfig | null
  onSaved: () => void
}

export function GatewayFormDialog({
  open,
  onOpenChange,
  gateway,
  onSaved,
}: GatewayFormDialogProps) {
  const isEdit = !!gateway
  const [gatewayName, setGatewayName] = useState("razorpay")
  const [displayName, setDisplayName] = useState("")
  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setGatewayName(gateway?.gateway ?? "razorpay")
    setDisplayName(gateway?.display_name ?? "")
    setKeyId(gateway?.key_id ?? "")
    setKeySecret("")
    setIsActive(gateway?.is_active ?? true)
    setIsTestMode(gateway?.is_test_mode ?? false)
  }, [open, gateway])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit && gateway) {
        const payload: Record<string, unknown> = {
          display_name: displayName,
          key_id: keyId,
          is_active: isActive,
          is_test_mode: isTestMode,
        }
        if (keySecret.trim()) payload.key_secret = keySecret
        await updateGateway(gateway.id, payload)
        toast.success("Gateway updated")
      } else {
        const payload: GatewayConfigCreate = {
          gateway: gatewayName,
          display_name: displayName,
          key_id: keyId,
          key_secret: keySecret,
          is_active: isActive,
          is_test_mode: isTestMode,
        }
        await createGateway(payload)
        toast.success("Gateway created")
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit gateway" : "Add payment gateway"}</DialogTitle>
          <DialogDescription>
            Razorpay credentials. Secret is masked after save — leave blank to keep
            the current value.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="gw-name">Gateway</Label>
              <Input
                id="gw-name"
                value={gatewayName}
                onChange={(e) => setGatewayName(e.target.value)}
                placeholder="razorpay"
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="gw-display">Display name</Label>
            <Input
              id="gw-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Razorpay Live"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gw-key-id">Key ID</Label>
            <Input
              id="gw-key-id"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gw-secret">
              Key secret{isEdit ? " (optional)" : ""}
            </Label>
            <Input
              id="gw-secret"
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current" : undefined}
              required={!isEdit}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isTestMode} onCheckedChange={setIsTestMode} />
              Test mode
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
