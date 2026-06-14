import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { createProduct, updateProduct } from "@/services/products"
import type { Category } from "@/types/category"
import type { Product, ProductCreate, ProductUpdate } from "@/types/product"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUploader } from "@/components/image-uploader"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  onSaved: () => void
}

const NO_CATEGORY = "none"

interface FormState {
  name: string
  description: string
  price: string
  mrp: string
  stock: string
  sku: string
  hsn_code: string
  weight: string
  length: string
  breadth: string
  height: string
  category_id: string
  tags: string
  images: string[]
  is_handmade: boolean
  is_featured: boolean
  is_new: boolean
  is_bestseller: boolean
  is_active: boolean
}

function emptyForm(): FormState {
  return {
    name: "",
    description: "",
    price: "",
    mrp: "",
    stock: "0",
    sku: "",
    hsn_code: "",
    weight: "",
    length: "",
    breadth: "",
    height: "",
    category_id: NO_CATEGORY,
    tags: "",
    images: [],
    is_handmade: true,
    is_featured: false,
    is_new: false,
    is_bestseller: false,
    is_active: true,
  }
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    description: p.description ?? "",
    price: String(p.price),
    mrp: String(p.mrp),
    stock: String(p.stock),
    sku: p.sku ?? "",
    hsn_code: p.hsn_code ?? "",
    weight: p.weight != null ? String(p.weight) : "",
    length: p.length != null ? String(p.length) : "",
    breadth: p.breadth != null ? String(p.breadth) : "",
    height: p.height != null ? String(p.height) : "",
    category_id: p.category_id != null ? String(p.category_id) : NO_CATEGORY,
    tags: (p.tags ?? []).join(", "),
    images: p.images ?? [],
    is_handmade: p.is_handmade,
    is_featured: p.is_featured,
    is_new: p.is_new,
    is_bestseller: p.is_bestseller,
    is_active: p.is_active,
  }
}

const FLAGS: { key: keyof FormState; label: string }[] = [
  { key: "is_handmade", label: "Handmade" },
  { key: "is_featured", label: "Featured" },
  { key: "is_new", label: "New" },
  { key: "is_bestseller", label: "Bestseller" },
  { key: "is_active", label: "Active" },
]

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: ProductFormDialogProps) {
  const isEdit = !!product
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(product ? fromProduct(product) : emptyForm())
  }, [open, product])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const base = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        sku: form.sku || undefined,
        hsn_code: form.hsn_code || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        length: form.length ? Number(form.length) : undefined,
        breadth: form.breadth ? Number(form.breadth) : undefined,
        height: form.height ? Number(form.height) : undefined,
        category_id:
          form.category_id === NO_CATEGORY
            ? undefined
            : Number(form.category_id),
        tags,
        images: form.images,
        is_handmade: form.is_handmade,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_bestseller: form.is_bestseller,
      }

      if (isEdit && product) {
        const payload: ProductUpdate = { ...base, is_active: form.is_active }
        await updateProduct(product.id, payload)
        toast.success("Product updated")
      } else {
        await createProduct(base as ProductCreate)
        toast.success("Product created")
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the product details below."
              : "Add a new product to your catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Name *</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Images</Label>
            <ImageUploader
              value={form.images}
              onChange={(keys) => set("images", keys)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="p-price">Price *</Label>
              <Input
                id="p-price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-mrp">MRP *</Label>
              <Input
                id="p-mrp"
                type="number"
                step="0.01"
                value={form.mrp}
                onChange={(e) => set("mrp", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-stock">Stock</Label>
              <Input
                id="p-stock"
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-sku">SKU</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-hsn">HSN code</Label>
              <Input
                id="p-hsn"
                value={form.hsn_code}
                onChange={(e) => set("hsn_code", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-weight">Weight (kg)</Label>
              <Input
                id="p-weight"
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-length">Length (cm)</Label>
              <Input
                id="p-length"
                type="number"
                step="0.1"
                value={form.length}
                onChange={(e) => set("length", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-breadth">Breadth (cm)</Label>
              <Input
                id="p-breadth"
                type="number"
                step="0.1"
                value={form.breadth}
                onChange={(e) => set("breadth", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-height">Height (cm)</Label>
              <Input
                id="p-height"
                type="number"
                step="0.1"
                value={form.height}
                onChange={(e) => set("height", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => set("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Uncategorised" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-tags">Tags (comma separated)</Label>
              <Input
                id="p-tags"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="gift, blue, ceramic"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 rounded-lg border p-4">
            {FLAGS.filter((f) => isEdit || f.key !== "is_active").map((flag) => (
              <label
                key={flag.key}
                className="flex items-center gap-2 text-sm"
              >
                <Switch
                  checked={form[flag.key] as boolean}
                  onCheckedChange={(v) => set(flag.key, v as never)}
                />
                {flag.label}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
