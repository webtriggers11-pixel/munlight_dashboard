import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import {
  createShippingConfig,
  listShippingProviders,
  updateShippingConfig,
} from "@/services/shipping-config"
import type {
  ShippingConfig,
  ShippingConfigCreate,
  ShippingConfigUpdate,
} from "@/types/shipping-config"
import { MaskedSecretInput } from "@/components/masked-secret-input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface ShippingConfigFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ShippingConfig | null
  // true on the Shipping Setup page: shows the provider picker and API address field.
  setup?: boolean
  onSaved: () => void
}

export function ShippingConfigFormDialog({
  open,
  onOpenChange,
  config,
  setup = false,
  onSaved,
}: ShippingConfigFormDialogProps) {
  const isEdit = !!config
  const { user } = useAuth()
  // Only a super admin can add a provider or change where its requests are sent, and only
  // from the Shipping Setup page.
  const isSuperAdmin = setup && user?.role === "super_admin"
  const { data: providerOptions } = useAsync(listShippingProviders, [])
  const [provider, setProvider] = useState("shiprocket")
  const [baseUrl, setBaseUrl] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [isTestMode, setIsTestMode] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setProvider(config?.provider ?? "shiprocket")
    setBaseUrl(config?.base_url ?? "")
    setDisplayName(config?.display_name ?? "")
    setEmail(config?.email ?? "")
    setPassword(config?.password ?? "")
    setIsActive(config?.is_active ?? false)
    setIsTestMode(config?.is_test_mode ?? true)
  }, [open, config])

  // What the provider uses when the address field is left blank.
  const defaultBaseUrl =
    providerOptions?.find((p) => p.provider === (config?.provider ?? provider))
      ?.default_base_url ?? ""

  function chooseProvider(value: string) {
    setProvider(value)
    const option = providerOptions?.find((p) => p.provider === value)
    if (option && !displayName.trim()) setDisplayName(option.display_name)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit && config) {
        const payload: ShippingConfigUpdate = {
          display_name: displayName,
          email,
          is_active: isActive,
          is_test_mode: isTestMode,
        }
        // The field is pre-filled with the masked value — only send a real change.
        if (password.trim() && password !== config.password) {
          payload.password = password
        }
        // Blank clears the override. Only send it when it actually changed.
        if (isSuperAdmin && baseUrl.trim() !== (config.base_url ?? "")) {
          payload.base_url = baseUrl.trim()
        }
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
        if (baseUrl.trim()) payload.base_url = baseUrl.trim()
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
            API credentials for the courier aggregator. The password is shown
            masked — click it and type to replace it, or leave it as is to keep
            the current value.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="sp-provider">Provider</Label>
              <Select value={provider} onValueChange={chooseProvider}>
                <SelectTrigger id="sp-provider">
                  <SelectValue placeholder="Choose an aggregator…" />
                </SelectTrigger>
                <SelectContent>
                  {(providerOptions ?? []).map((p) => (
                    <SelectItem key={p.provider} value={p.provider}>
                      {p.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label htmlFor="sp-password">API password</Label>
            <MaskedSecretInput
              id="sp-password"
              value={password}
              onChange={setPassword}
              saved={config?.password}
            />
          </div>
          {isSuperAdmin ? (
            <div className="grid gap-2">
              <Label htmlFor="sp-base-url">API address (advanced)</Label>
              <Input
                id="sp-base-url"
                className="font-mono text-xs"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={defaultBaseUrl || "https://api.example.com/v1"}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the default
                {defaultBaseUrl ? ` (${defaultBaseUrl})` : ""}. Change it only
                for a sandbox or if the aggregator moves its API.
              </p>
            </div>
          ) : (
            config?.effective_base_url && (
              <p className="break-all text-xs text-muted-foreground">
                API address: <span className="font-mono">{config.effective_base_url}</span>{" "}
                (only a super admin can change this)
              </p>
            )
          )}
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
            <Button type="submit" disabled={saving || !password.trim() || (!isEdit && !provider)}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
