import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import {
  createShippingConfig,
  updateShippingConfig,
} from "@/services/shipping-config"
import type {
  ShippingConfig,
  ShippingConfigCreate,
} from "@/types/shipping-config"
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

interface ShippingConfigFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ShippingConfig | null
  onSaved: () => void
}

export function ShippingConfigFormDialog({
  open,
  onOpenChange,
  config,
  onSaved,
}: ShippingConfigFormDialogProps) {
  const isEdit = !!config
  const [provider, setProvider] = useState("shiprocket")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [isTestMode, setIsTestMode] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setProvider(config?.provider ?? "shiprocket")
    setDisplayName(config?.display_name ?? "")
    setEmail(config?.email ?? "")
    setPassword("")
    setIsActive(config?.is_active ?? false)
    setIsTestMode(config?.is_test_mode ?? true)
  }, [open, config])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit && config) {
        const payload: Record<string, unknown> = {
          display_name: displayName,
          email,
          is_active: isActive,
          is_test_mode: isTestMode,
        }
        if (password.trim()) payload.password = password
        await updateShippingConfig(config.id, payload)
        toast.success("Shipping config updated")
      } else {
        const payload: ShippingConfigCreate = {
          provider,
          display_name: displayName,
          email,
          password,
          is_active: isActive,
          is_test_mode: isTestMode,
        }
        await createShippingConfig(payload)
        toast.success("Shipping config created")
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
          <DialogTitle>
            {isEdit ? "Edit shipping provider" : "Add shipping provider"}
          </DialogTitle>
          <DialogDescription>
            Shiprocket API credentials. Password is masked after save.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="sp-provider">Provider</Label>
              <Input
                id="sp-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="shiprocket"
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="sp-display">Display name</Label>
            <Input
              id="sp-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sp-email">API email</Label>
            <Input
              id="sp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sp-password">
              API password{isEdit ? " (optional)" : ""}
            </Label>
            <Input
              id="sp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
