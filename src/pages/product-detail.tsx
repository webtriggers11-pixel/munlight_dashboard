import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
import {
  deleteProduct,
  getProductBySlug,
} from "@/services/products"
import { listCategories } from "@/services/categories"
import type { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { ActivePill } from "@/components/status-badge"
import { RemoteImage } from "@/components/remote-image"
import { ProductFormDialog } from "@/components/product-form-dialog"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

const FLAGS: { key: keyof Product; label: string }[] = [
  { key: "is_handmade", label: "Handmade" },
  { key: "is_featured", label: "Featured" },
  { key: "is_new", label: "New arrival" },
  { key: "is_bestseller", label: "Bestseller" },
]

export default function ProductDetailPage() {
  const { slug = "" } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: product, loading, error, refetch } = useAsync(
    () => getProductBySlug(slug),
    [slug]
  )
  const { data: categories } = useAsync(listCategories, [])

  async function confirmDelete() {
    if (!product) return
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      toast.success("Product deleted")
      navigate("/products", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Back to products
        </Link>
        <p className="text-sm text-destructive">
          {error ?? "Product not found."}
        </p>
      </div>
    )
  }

  const images = product.images ?? []
  const categoryName =
    categories?.find((c) => c.id === product.category_id)?.name ?? "—"

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Back to products
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <ActivePill active={product.is_active} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {product.sku ?? "No SKU"} · {categoryName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <PencilIcon /> Edit
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon className="text-destructive" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Media */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <RemoteImage
              value={images[selected]}
              alt={product.name}
              className="aspect-square w-full border"
            />
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={
                      "rounded-md border p-0.5 " +
                      (i === selected
                        ? "ring-2 ring-ring"
                        : "opacity-70 hover:opacity-100")
                    }
                  >
                    <RemoteImage value={img} className="size-12" />
                  </button>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <p className="text-sm text-muted-foreground">No images.</p>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pricing &amp; Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Selling price" value={formatCurrency(product.price)} />
              <Field label="MRP" value={formatCurrency(product.mrp)} />
              <Field
                label="Stock"
                value={
                  <span className={product.stock < 5 ? "text-destructive" : ""}>
                    {formatNumber(product.stock)}
                  </span>
                }
              />
              <Field label="SKU" value={product.sku ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization &amp; Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Category" value={categoryName} />
              <Field
                label="Weight"
                value={product.weight != null ? `${product.weight} kg` : "—"}
              />
              <Field label="HSN code" value={product.hsn_code ?? "—"} />
              <Field
                label="Rating"
                value={`${product.avg_rating.toFixed(1)} (${product.review_count})`}
              />
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-muted-foreground">Tags</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status &amp; Flags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {FLAGS.map((flag) => {
                const on = Boolean(product[flag.key])
                return (
                  <Badge
                    key={flag.key}
                    variant="outline"
                    className={
                      on
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }
                  >
                    {on ? (
                      <CheckIcon className="size-3" />
                    ) : (
                      <XIcon className="size-3" />
                    )}
                    {flag.label}
                  </Badge>
                )
              })}
            </CardContent>
          </Card>

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            Slug: <span className="font-mono">{product.slug}</span> · Created{" "}
            {formatDate(product.created_at)}
          </p>
        </div>
      </div>

      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
        categories={categories ?? []}
        onSaved={refetch}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{product.name}”. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
