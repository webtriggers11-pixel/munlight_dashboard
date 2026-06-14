import { useState } from "react"
import { Loader2, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatDate, titleCase } from "@/lib/format"
import { listUsers, toggleUserStatus } from "@/services/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ActivePill } from "@/components/status-badge"
import { PaginationBar } from "@/components/pagination-bar"
import { PageHeader } from "@/components/page-header"
import { CreateAdminDialog } from "@/components/create-admin-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { data, loading, error, refetch } = useAsync(
    () => listUsers(page, 20),
    [page]
  )

  async function handleToggle(userId: number) {
    setBusyId(userId)
    try {
      const updated = await toggleUserStatus(userId)
      toast.success(
        `User ${updated.is_active ? "activated" : "deactivated"}`
      )
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="View customer accounts and manage admins."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Create admin
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !data || data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="capitalize">
                        {titleCase(user.role)}
                      </TableCell>
                      <TableCell>
                        <ActivePill active={user.is_active} />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === user.id}
                          onClick={() => handleToggle(user.id)}
                        >
                          {busyId === user.id && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateAdminDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refetch}
      />
    </div>
  )
}
