import { useState } from "react"
import {
  Loader2,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import {
  deleteGateway,
  listGateways,
} from "@/services/gateway-config"
import {
  deleteShippingConfig,
  listShippingConfigs,
  syncPickupLocation,
  testShippingConfig,
} from "@/services/shipping-config"
import { registerShiprocketWebhook } from "@/services/webhooks"
import type { GatewayConfig } from "@/types/gateway"
import type { ShippingConfig } from "@/types/shipping-config"
import { GatewayFormDialog } from "@/components/gateway-form-dialog"
import { ShippingConfigFormDialog } from "@/components/shipping-config-form-dialog"
import { PageHeader } from "@/components/page-header"
import { ActivePill } from "@/components/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DEFAULT_WEBHOOK_URL =
  import.meta.env.VITE_PUBLIC_WEBHOOK_URL ??
  "https://your-api-domain.com/api/webhooks/shiprocket"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Payment gateways, shipping providers, and webhook registration."
      />
      <Tabs defaultValue="gateways">
        <TabsList>
          <TabsTrigger value="gateways">Payment gateways</TabsTrigger>
          <TabsTrigger value="shipping">Shipping config</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="gateways" className="mt-4">
          <GatewaysTab />
        </TabsContent>
        <TabsContent value="shipping" className="mt-4">
          <ShippingTab />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <WebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GatewaysTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GatewayConfig | null>(null)
  const [deleting, setDeleting] = useState<GatewayConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const { data, loading, error, refetch } = useAsync(listGateways, [])

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteGateway(deleting.id)
      toast.success("Gateway deleted")
      setDeleting(null)
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Payment gateways</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <PlusIcon />
            Add gateway
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">
              No gateways configured. Add Razorpay credentials to accept payments.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((gw) => (
                  <TableRow key={gw.id}>
                    <TableCell className="font-medium capitalize">
                      {gw.gateway}
                    </TableCell>
                    <TableCell>{gw.display_name}</TableCell>
                    <TableCell className="font-mono text-xs">{gw.key_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <ActivePill active={gw.is_active} />
                        {gw.is_test_mode && (
                          <Badge variant="secondary">Test</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => {
                            setEditing(gw)
                            setDialogOpen(true)
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => setDeleting(gw)}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GatewayFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gateway={editing}
        onSaved={refetch}
      />

      <DeleteDialog
        open={!!deleting}
        title="Delete gateway?"
        description={`Remove "${deleting?.display_name}"? This cannot be undone.`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function ShippingTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShippingConfig | null>(null)
  const [deleting, setDeleting] = useState<ShippingConfig | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const { data, loading, error, refetch } = useAsync(listShippingConfigs, [])

  async function handleTest(id: number) {
    setBusyId(id)
    try {
      const result = await testShippingConfig(id)
      toast.success(result.message)
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleSyncPickup(id: number) {
    setBusyId(id)
    try {
      const result = await syncPickupLocation(id)
      toast.success(
        `Synced pickup "${result.synced_location}" (${result.synced_pincode})`
      )
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteShippingConfig(deleting.id)
      toast.success("Shipping config deleted")
      setDeleting(null)
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Shipping providers</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <PlusIcon />
            Add provider
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">
              No shipping providers configured. Add Shiprocket credentials to
              fulfil orders.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((cfg) => (
                  <TableRow key={cfg.id}>
                    <TableCell>
                      <p className="font-medium">{cfg.display_name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {cfg.provider}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cfg.email}
                    </TableCell>
                    <TableCell>
                      {cfg.has_valid_token ? (
                        <Badge variant="outline" className="text-emerald-600">
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="outline">No token</Badge>
                      )}
                      {cfg.token_expires_at && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Expires {formatDate(cfg.token_expires_at)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <ActivePill active={cfg.is_active} />
                        {cfg.is_test_mode && (
                          <Badge variant="secondary">Test</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Test connection"
                          disabled={busyId === cfg.id}
                          onClick={() => handleTest(cfg.id)}
                        >
                          {busyId === cfg.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ZapIcon />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Sync pickup"
                          disabled={busyId === cfg.id}
                          onClick={() => handleSyncPickup(cfg.id)}
                        >
                          <RefreshCwIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => {
                            setEditing(cfg)
                            setDialogOpen(true)
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => setDeleting(cfg)}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ShippingConfigFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editing}
        onSaved={refetch}
      />

      <DeleteDialog
        open={!!deleting}
        title="Delete shipping config?"
        description={`Remove "${deleting?.display_name}"? This cannot be undone.`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function WebhooksTab() {
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK_URL)
  const [configId, setConfigId] = useState<string>("")
  const [registering, setRegistering] = useState(false)
  const { data: configs, loading } = useAsync(listShippingConfigs, [])

  async function handleRegister() {
    if (!configId) {
      toast.error("Select a shipping config first")
      return
    }
    setRegistering(true)
    try {
      await registerShiprocketWebhook(Number(configId), webhookUrl.trim())
      toast.success("Webhook registered with Shiprocket")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setRegistering(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shiprocket webhook</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4">
        <p className="text-sm text-muted-foreground">
          Register your public webhook URL with Shiprocket so tracking updates
          flow automatically. The webhook secret is saved to the shipping config.
        </p>
        <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">
          POST {webhookUrl || "/api/webhooks/shiprocket"}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="wh-url">Public webhook URL</Label>
          <Input
            id="wh-url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://api.yourdomain.com/api/webhooks/shiprocket"
          />
        </div>
        <div className="grid gap-2">
          <Label>Shipping config</Label>
          {loading ? (
            <Spinner />
          ) : (
            <Select value={configId} onValueChange={setConfigId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Shiprocket config" />
              </SelectTrigger>
              <SelectContent>
                {(configs ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.display_name} ({c.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          onClick={handleRegister}
          disabled={registering || !configId}
          className="w-fit"
        >
          {registering && <Loader2 className="size-4 animate-spin" />}
          Register with Shiprocket
        </Button>
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

function DeleteDialog({
  open,
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
