import { useEffect, useState } from "react"
import {
  CopyIcon,
  Loader2,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import {
  deleteGateway,
  listGateways,
  updateGateway,
} from "@/services/gateway-config"
import type { GatewayConfig } from "@/types/gateway"
import { GatewayFormDialog } from "@/components/gateway-form-dialog"
import { MaskedSecretInput } from "@/components/masked-secret-input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "")

const RAZORPAY_WEBHOOK_URL = `${API_URL}/webhooks/razorpay`

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Gateways"
        description="Manage Razorpay credentials and payment webhooks."
      />
      <Tabs defaultValue="gateways">
        <TabsList>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="gateways" className="mt-4">
          <GatewaysTab />
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
          <CardTitle className="text-base">Configured gateways</CardTitle>
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
                  <TableHead>Key secret</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((gw) => (
                  <TableRow key={gw.id}>
                    <TableCell className="font-medium capitalize">{gw.gateway}</TableCell>
                    <TableCell>{gw.display_name}</TableCell>
                    <TableCell className="font-mono text-xs">{gw.key_id}</TableCell>
                    <TableCell className="font-mono text-xs">{gw.key_secret}</TableCell>
                    <TableCell>
                      {gw.webhook_secret ? (
                        <Badge variant="secondary">Secret set</Badge>
                      ) : gw.gateway === "razorpay" ? (
                        <Badge variant="outline">Not configured</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <ActivePill active={gw.is_active} />
                        {gw.is_test_mode && <Badge variant="secondary">Test</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => { setEditing(gw); setDialogOpen(true) }}
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

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete gateway?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{deleting?.display_name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); confirmDelete() }}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function WebhooksTab() {
  const { data, loading, error, refetch } = useAsync(listGateways, [])
  const razorpay = data?.find((g) => g.gateway === "razorpay")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setWebhookSecret(razorpay?.webhook_secret ?? "")
  }, [razorpay?.id, razorpay?.webhook_secret])

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(RAZORPAY_WEBHOOK_URL)
      toast.success("Webhook URL copied")
    } catch {
      toast.error("Could not copy — select the URL and copy it manually")
    }
  }

  async function handleSave() {
    if (!razorpay) return
    setSaving(true)
    try {
      await updateGateway(razorpay.id, { webhook_secret: webhookSecret })
      toast.success("Webhook secret saved")
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changed =
    !!webhookSecret.trim() && webhookSecret !== razorpay?.webhook_secret

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Razorpay webhook</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4">
        <p className="text-sm text-muted-foreground">
          Razorpay calls this URL when a payment is captured or fails, so orders
          are marked paid even if the customer closes the browser after paying.
          Add it in Razorpay Dashboard → Account &amp; Settings → Webhooks, using
          the same secret you save below.
        </p>
        <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">
          POST {RAZORPAY_WEBHOOK_URL}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="wh-url">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="wh-url"
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
        ) : !razorpay ? (
          <p className="text-sm text-muted-foreground">
            Add a Razorpay gateway in the Gateways tab first, then come back to
            set its webhook secret.
          </p>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="wh-secret">Webhook secret</Label>
              <MaskedSecretInput
                id="wh-secret"
                value={webhookSecret}
                onChange={setWebhookSecret}
                saved={razorpay.webhook_secret}
                placeholder="Enter the secret you set in Razorpay"
              />
              <p className="text-xs text-muted-foreground">
                Not the same as the Key secret. It must match the secret typed
                into the Razorpay webhook form exactly.
              </p>
            </div>
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Events to enable in Razorpay
              </p>
              <ul className="mt-1 list-inside list-disc font-mono">
                <li>payment.captured</li>
                <li>payment.failed</li>
              </ul>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !changed}
              className="w-fit"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save webhook secret
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
