import { useEffect, useState, type FormEvent } from "react"
import { CopyIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { createGateway, updateGateway } from "@/services/gateway-config"
import type { GatewayConfig, GatewayConfigCreate } from "@/types/gateway"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "")

const RAZORPAY_WEBHOOK_URL = `${API_URL}/webhooks/razorpay`

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
  const [tab, setTab] = useState("credentials")
  const [gatewayName, setGatewayName] = useState("razorpay")
  const [displayName, setDisplayName] = useState("")
  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab("credentials")
    setGatewayName(gateway?.gateway ?? "razorpay")
    setDisplayName(gateway?.display_name ?? "")
    setKeyId(gateway?.key_id ?? "")
    setKeySecret("")
    setWebhookSecret("")
    setIsActive(gateway?.is_active ?? true)
    setIsTestMode(gateway?.is_test_mode ?? false)
  }, [open, gateway])

  const showWebhookTab = gatewayName.trim().toLowerCase() === "razorpay"

  async function copyWebhookUrl() {
    try {
      await navigator.clipboard.writeText(RAZORPAY_WEBHOOK_URL)
      toast.success("Webhook URL copied")
    } catch {
      toast.error("Could not copy — select the URL and copy it manually")
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Fields live on different tabs, so native `required` can't be used —
    // a required input on a hidden tab would block submit with no visible error.
    if (!displayName.trim() || !keyId.trim() || (!isEdit && !keySecret.trim())) {
      setTab("credentials")
      toast.error("Display name, Key ID and Key secret are required")
      return
    }

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
        if (webhookSecret.trim()) payload.webhook_secret = webhookSecret
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
        if (webhookSecret.trim()) payload.webhook_secret = webhookSecret
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit gateway" : "Add payment gateway"}</DialogTitle>
          <DialogDescription>
            Saved secrets are always shown masked. Leave a secret field blank to
            keep the current value.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="credentials" className="flex-1">
                API credentials
              </TabsTrigger>
              {showWebhookTab && (
                <TabsTrigger value="webhook" className="flex-1">
                  Webhook
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="credentials" className="mt-4 grid gap-4">
              {!isEdit && (
                <div className="grid gap-2">
                  <Label htmlFor="gw-name">Gateway</Label>
                  <Input
                    id="gw-name"
                    value={gatewayName}
                    onChange={(e) => setGatewayName(e.target.value)}
                    placeholder="razorpay"
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gw-key-id">Key ID</Label>
                <Input
                  id="gw-key-id"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  From Razorpay Dashboard → Account &amp; Settings → API Keys.
                </p>
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
                />
                <SecretStatus masked={gateway?.key_secret} />
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
            </TabsContent>

            {showWebhookTab && (
              <TabsContent value="webhook" className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gw-webhook-url">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gw-webhook-url"
                      readOnly
                      value={RAZORPAY_WEBHOOK_URL}
                      className="font-mono text-xs"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Copy webhook URL"
                      onClick={copyWebhookUrl}
                    >
                      <CopyIcon />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste this into Razorpay Dashboard → Account &amp; Settings →
                    Webhooks → Add New Webhook.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="gw-webhook-secret">
                    Webhook secret{isEdit ? " (optional)" : ""}
                  </Label>
                  <Input
                    id="gw-webhook-secret"
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={
                      gateway?.webhook_secret
                        ? "Leave blank to keep current"
                        : "Enter the secret you set in Razorpay"
                    }
                  />
                  <SecretStatus masked={gateway?.webhook_secret} />
                  <p className="text-xs text-muted-foreground">
                    This is not the Key secret. It is the secret typed into the
                    Razorpay webhook form, and it must match exactly — it is used
                    to verify that incoming webhooks really come from Razorpay.
                  </p>
                </div>

                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Events to enable in Razorpay
                  </p>
                  <ul className="mt-1 list-inside list-disc">
                    <li className="font-mono">payment.captured</li>
                    <li className="font-mono">payment.failed</li>
                  </ul>
                </div>
              </TabsContent>
            )}
          </Tabs>

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

function SecretStatus({ masked }: { masked?: string | null }) {
  if (!masked) {
    return (
      <p className="text-xs text-muted-foreground">
        Current value: <Badge variant="secondary">Not set</Badge>
      </p>
    )
  }
  return (
    <p className="text-xs text-muted-foreground">
      Current value: <span className="font-mono text-foreground">{masked}</span>
    </p>
  )
}
