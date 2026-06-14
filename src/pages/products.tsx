import { useState } from "react"
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/format"
import { deleteProduct, listProducts } from "@/services/products"
import { listCategories } from "@/services/categories"
import type { Product } from "@/types/product"
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
import { PaginationBar } from "@/components/pagination-bar"
import { PageHeader } from "@/components/page-header"
import { RemoteImage } from "@/components/remote-image"
import { ProductFormDialog } from "@/components/product-form-dialog"

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const { data, loading, error, refetch } = useAsync(
    () => listProducts(page, 20),
    [page]
  )
  const { data: categories } = useAsync(listCategories, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteProduct(deleting.id)
      toast.success("Product deleted")
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
        title="Products"
        description="Manage your jewellery inventory and listings."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add Product
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
            <p className="text-sm text-muted-foreground">No products found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <RemoteImage
                          value={product.images?.[0]}
                          alt={product.name}
                          className="size-10"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={
                            product.stock < 5 ? "text-destructive" : undefined
                          }
                        >
                          {formatNumber(product.stock)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActivePill active={product.is_active} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(product)}
                            aria-label="Edit"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(product)}
                            aria-label="Delete"
                          >
                            <Trash2Icon className="text-destructive" />
                          </Button>
                        </div>
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories ?? []}
        onSaved={refetch}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
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
