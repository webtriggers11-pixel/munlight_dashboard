import { useState } from "react"
import { Loader2, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon, ZapIcon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { formatDate } from "@/lib/format"
import {
  deleteShippingConfig,
  listShippingConfigs,
  syncPickupLocation,
  testShippingConfig,
} from "@/services/shipping-config"
import type { ShippingConfig } from "@/types/shipping-config"
import { ShippingConfigFormDialog } from "@/components/shipping-config-form-dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// mode "setup"   — Shipping Setup page (super admin): the API address and removing providers.
// mode "operate" — everyday Shipping page (admins): add a provider, credentials, toggles, test,
//                  pickup sync. The API address is never shown for editing here.
export function ShippingProvidersCard({ mode }: { mode: "setup" | "operate" }) {
  // Anyone with dashboard access can add a provider (credentials only). Changing a provider's
  // API address and removing a provider are super-admin tasks, done on the Shipping Setup page.
  const { user } = useAuth()
  const isSetup = mode === "setup" && user?.role === "super_admin"
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
      toast.success(`Synced pickup "${result.synced_location}" (${result.synced_pincode})`)
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
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
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
              No shipping providers configured. Add one with its API credentials to fulfil orders.
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
                      <p className="text-xs capitalize text-muted-foreground">{cfg.provider}</p>
                      {isSetup && cfg.effective_base_url && (
                        <p className="max-w-56 truncate font-mono text-[11px] text-muted-foreground"
                          title={cfg.effective_base_url}>
                          {cfg.effective_base_url}
                          {cfg.base_url && <Badge variant="outline" className="ml-1 px-1 py-0 text-[10px]">custom</Badge>}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cfg.email}</TableCell>
                    <TableCell>
                      {cfg.has_valid_token ? (
                        <Badge variant="outline" className="text-emerald-600">Valid</Badge>
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
                        {cfg.is_test_mode && <Badge variant="secondary">Test</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Test connection"
                          disabled={busyId === cfg.id} onClick={() => handleTest(cfg.id)}>
                          {busyId === cfg.id
                            ? <Loader2 className="size-4 animate-spin" />
                            : <ZapIcon />}
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Sync pickup address"
                          disabled={busyId === cfg.id} onClick={() => handleSyncPickup(cfg.id)}>
                          <RefreshCwIcon />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Edit"
                          onClick={() => { setEditing(cfg); setDialogOpen(true) }}>
                          <PencilIcon />
                        </Button>
                        {isSetup && (
                          <Button variant="ghost" size="icon" aria-label="Delete"
                            onClick={() => setDeleting(cfg)}>
                            <Trash2Icon className="text-destructive" />
                          </Button>
                        )}
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
        setup={isSetup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editing}
        onSaved={refetch}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shipping config?</AlertDialogTitle>
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

function Spinner() {
  return (
    <div className="flex h-24 items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  )
}
