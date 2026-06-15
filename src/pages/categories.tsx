import { useState } from "react"
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatNumber } from "@/lib/format"
import {
  deleteCategory,
  listCategories,
  listCategoryHierarchy,
} from "@/services/categories"
import type { Category } from "@/types/category"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RemoteImage } from "@/components/remote-image"
import { PageHeader } from "@/components/page-header"
import { CategoryFormDialog } from "@/components/category-form-dialog"

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const { data, loading, error, refetch } = useAsync(listCategoryHierarchy, [])
  // Flat list used by the form dialog's parent-category dropdown
  const { data: flatCategories } = useAsync(listCategories, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteCategory(deleting.id)
      toast.success("Category deleted")
      setDeleting(null)
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Organise products into browsable collections."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add Category
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
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flatMap((category) => [
                  // Top-level category row
                  <TableRow key={category.id}>
                    <TableCell>
                      <RemoteImage
                        value={category.image}
                        alt={category.name}
                        className="size-10"
                      />
                    </TableCell>
                    <TableCell className="font-semibold">
                      {category.name}
                      {(category.children ?? []).length > 0 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {category.children.length} subcategories
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(category.sort_order)}
                    </TableCell>
                    <TableCell>
                      <ActivePill active={category.is_active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(category)}
                          aria-label="Edit"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(category)}
                          aria-label="Delete"
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  // Subcategory rows (indented)
                  ...(category.children ?? []).map((sub) => (
                    <TableRow key={sub.id} className="bg-muted/30">
                      <TableCell>
                        <RemoteImage
                          value={sub.image}
                          alt={sub.name}
                          className="size-8 ml-4"
                        />
                      </TableCell>
                      <TableCell className="text-sm pl-8 text-muted-foreground">
                        ↳ {sub.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.slug}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(sub.sort_order)}
                      </TableCell>
                      <TableCell>
                        <ActivePill active={sub.is_active} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(sub)}
                            aria-label="Edit"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(sub)}
                            aria-label="Delete"
                          >
                            <Trash2Icon className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )),
                ])}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={flatCategories ?? []}
        onSaved={refetch}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{deleting?.name}”. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deletingBusy}
            >
              {deletingBusy && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
