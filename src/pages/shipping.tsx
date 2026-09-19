import { useEffect, useState } from "react"
import { CopyIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import {
  listShippingConfigs,
  updateShippingConfig,
} from "@/services/shipping-config"
import { ShippingProvidersCard } from "@/components/shipping-providers-card"
import { MaskedSecretInput } from "@/components/masked-secret-input"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Shiprocket's panel rejects webhook URLs that contain the word "shiprocket",
// so the neutral /courier-tracking path is used.
const SHIPROCKET_WEBHOOK_URL = `${(
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "")}/webhooks/courier-tracking`

export default function ShippingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shipping"
        description="Manage shipping providers, pickup address sync, and webhooks."
      />
      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="mt-4">
          <ShippingProvidersCard mode="operate" />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <ShiprocketWebhookCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ShiprocketWebhookCard() {
  const { data, loading, error, refetch } = useAsync(listShippingConfigs, [])
  const shiprocket = data?.find((c) => c.provider === "shiprocket")
  const [token, setToken] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setToken(shiprocket?.webhook_secret ?? "")
  }, [shiprocket?.id, shiprocket?.webhook_secret])

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(SHIPROCKET_WEBHOOK_URL)
      toast.success("Webhook URL copied")
    } catch {
      toast.error("Could not copy — select the URL and copy it manually")
    }
  }

  async function handleSave() {
    if (!shiprocket) return
    setSaving(true)
    try {
      await updateShippingConfig(shiprocket.id, { webhook_secret: token })
      toast.success("Webhook token saved")
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changed = !!token.trim() && token !== shiprocket?.webhook_secret

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shiprocket webhook</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4">
        <p className="text-sm text-muted-foreground">
          Shiprocket calls this URL with every tracking update. In Shiprocket go to
          Settings → API → Webhooks, paste the URL, enter the same token you save
          below as the security token, and turn the webhook on.
        </p>
        <div className="grid gap-2">
          <Label htmlFor="sr-wh-url">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="sr-wh-url"
              readOnly
              value={SHIPROCKET_WEBHOOK_URL}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy webhook URL"
              onClick={copyUrl}
            >
              <CopyIcon />
            </Button>
          </div>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !shiprocket ? (
          <p className="text-sm text-muted-foreground">
            Add a Shiprocket provider in the Providers tab first.
          </p>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="sr-wh-token">Security token</Label>
              <MaskedSecretInput
                id="sr-wh-token"
                value={token}
                onChange={setToken}
                saved={shiprocket.webhook_secret}
                placeholder="Enter the token you set in Shiprocket"
              />
              <p className="text-xs text-muted-foreground">
                Must match the token entered in the Shiprocket webhook form
                exactly. Shiprocket sends it in the x-api-key header.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving || !changed} className="w-fit">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save webhook token
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Spinner() {
  return (
    <div className="flex h-24 items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  )
}
