import { useEffect, useState, type FormEvent } from "react"
import { Loader2, Link2 } from "lucide-react"
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
import { TagInput } from "@/components/tag-input"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]   // flat list
  onSaved: () => void
}

const NO_CAT = "none"

interface FormState {
  name         : string
  slug         : string
  slugTouched  : boolean
  description  : string
  price        : string
  mrp          : string
  stock        : string
  sku          : string
  hsn_code     : string
  weight       : string
  length       : string
  breadth      : string
  height       : string
  topCategoryId: string   // top-level category picker (not sent to API)
  category_id  : string   // subcategory ID (sent to API)
  collection   : string
  material     : string
  color        : string
  tags         : string[]
  images       : string[]
  is_handmade  : boolean
  is_featured  : boolean
  is_new       : boolean
  is_bestseller: boolean
  is_active    : boolean
}

function emptyForm(): FormState {
  return {
    name         : "",
    slug         : "",
    slugTouched  : false,
    description  : "",
    price        : "",
    mrp          : "",
    stock        : "0",
    sku          : "",
    hsn_code     : "",
    weight       : "",
    length       : "",
    breadth      : "",
    height       : "",
    topCategoryId: NO_CAT,
    category_id  : NO_CAT,
    collection   : "",
    material     : "",
    color        : "",
    tags         : [],
    images       : [],
    is_handmade  : true,
    is_featured  : false,
    is_new       : false,
    is_bestseller: false,
    is_active    : true,
  }
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const FLAGS: { key: keyof FormState; label: string }[] = [
  { key: "is_handmade",   label: "Handmade"   },
  { key: "is_featured",   label: "Featured"   },
  { key: "is_new",        label: "New"        },
  { key: "is_bestseller", label: "Bestseller" },
  { key: "is_active",     label: "Active"     },
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

  // Derived category lists
  const topLevelCats = categories.filter((c) => c.parent_id === null)
  const subcategories = categories.filter(
    (c) => c.parent_id !== null && String(c.parent_id) === form.topCategoryId
  )

  // URL preview for the product
  const topSlug = topLevelCats.find((c) => String(c.id) === form.topCategoryId)?.slug
  const subSlug = subcategories.find((c) => String(c.id) === form.category_id)?.slug
  const urlPreview =
    topSlug && subSlug && form.slug
      ? `/shop/${topSlug}/${subSlug}/${form.slug}`
      : form.slug
      ? `/product/${form.slug}`
      : null

  useEffect(() => {
    if (!open) return
    if (product) {
      // Find the subcategory and its parent from the flat list
      const sub = product.category_id != null
        ? categories.find((c) => c.id === product.category_id)
        : null
      const topId = sub?.parent_id != null
        ? String(sub.parent_id)
        : sub
        ? String(sub.id)
        : NO_CAT

      setForm({
        name         : product.name,
        slug         : product.slug,
        slugTouched  : true,
        description  : product.description ?? "",
        price        : String(product.price),
        mrp          : String(product.mrp),
        stock        : String(product.stock),
        sku          : product.sku ?? "",
        hsn_code     : product.hsn_code ?? "",
        weight       : product.weight != null ? String(product.weight) : "",
        length       : product.length != null ? String(product.length) : "",
        breadth      : product.breadth != null ? String(product.breadth) : "",
        height       : product.height != null ? String(product.height) : "",
        topCategoryId: topId,
        category_id  : product.category_id != null ? String(product.category_id) : NO_CAT,
        collection   : product.collection ?? "",
        material     : product.material   ?? "",
        color        : product.color      ?? "",
        tags         : product.tags ?? [],
        images       : product.images ?? [],
        is_handmade  : product.is_handmade,
        is_featured  : product.is_featured,
        is_new       : product.is_new,
        is_bestseller: product.is_bestseller,
        is_active    : product.is_active,
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, product, categories])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleNameChange(val: string) {
    setForm((f) => ({
      ...f,
      name: val,
      slug: f.slugTouched ? f.slug : toSlug(val),
    }))
  }

  function handleSlugChange(val: string) {
    setForm((f) => ({ ...f, slug: toSlug(val), slugTouched: true }))
  }

  function handleTopCategoryChange(val: string) {
    // Reset subcategory when top-level changes
    setForm((f) => ({ ...f, topCategoryId: val, category_id: NO_CAT }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const base = {
        name        : form.name,
        slug        : form.slug.trim() || undefined,
        description : form.description || undefined,
        price       : Number(form.price),
        mrp         : Number(form.mrp),
        stock       : Number(form.stock),
        sku         : form.sku     || undefined,
        hsn_code    : form.hsn_code || undefined,
        weight      : form.weight  ? Number(form.weight)  : undefined,
        length      : form.length  ? Number(form.length)  : undefined,
        breadth     : form.breadth ? Number(form.breadth) : undefined,
        height      : form.height  ? Number(form.height)  : undefined,
        category_id : form.category_id !== NO_CAT ? Number(form.category_id) : undefined,
        collection  : form.collection || undefined,
        material    : form.material   || undefined,
        color       : form.color      || undefined,
        tags        : form.tags,
        images      : form.images,
        is_handmade : form.is_handmade,
        is_featured : form.is_featured,
        is_new      : form.is_new,
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
              : "Fill in the details to add a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* ── Section: Basic info ── */}
          <fieldset className="grid gap-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Basic Info
            </legend>

            <div className="grid gap-2">
              <Label htmlFor="p-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Rani Pink Pendant Set"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-slug">
                  Slug{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (auto-generated from name)
                  </span>
                </Label>
                {form.slugTouched && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setForm((f) => ({ ...f, slug: toSlug(f.name), slugTouched: false }))}
                  >
                    Reset to auto
                  </button>
                )}
              </div>
              <Input
                id="p-slug"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. rani-pink-pendant-set"
              />
              {urlPreview && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link2 size={12} />
                  {urlPreview}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Describe the product…"
              />
            </div>

            <div className="grid gap-2">
              <Label>Images</Label>
              <ImageUploader
                value={form.images}
                onChange={(keys) => set("images", keys)}
              />
            </div>
          </fieldset>

          {/* ── Section: Category ── */}
          <fieldset className="grid gap-4 rounded-lg border p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </legend>

            <div className="grid gap-2">
              <Label>Collection / Category</Label>
              <Select value={form.topCategoryId} onValueChange={handleTopCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CAT}>— Uncategorised —</SelectItem>
                  {topLevelCats.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>
                Subcategory
                {form.topCategoryId === NO_CAT && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (select a category first)
                  </span>
                )}
              </Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => set("category_id", v)}
                disabled={form.topCategoryId === NO_CAT || subcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.topCategoryId === NO_CAT
                        ? "Choose a category first"
                        : subcategories.length === 0
                        ? "No subcategories available"
                        : "Select a subcategory…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CAT}>— None —</SelectItem>
                  {subcategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          {/* ── Section: Pricing & Stock ── */}
          <fieldset className="grid gap-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Pricing & Stock
            </legend>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-price">Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="530"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-mrp">MRP (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="p-mrp"
                  type="number"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) => set("mrp", e.target.value)}
                  placeholder="650"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-sku">SKU</Label>
                <Input
                  id="p-sku"
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  placeholder="MB-FS-001"
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
            </div>
          </fieldset>

          {/* ── Section: Product details ── */}
          <fieldset className="grid gap-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Product Details
            </legend>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-collection">Collection</Label>
                <Input
                  id="p-collection"
                  value={form.collection}
                  onChange={(e) => set("collection", e.target.value)}
                  placeholder="Festive Collection"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-material">Material</Label>
                <Input
                  id="p-material"
                  value={form.material}
                  onChange={(e) => set("material", e.target.value)}
                  placeholder="Fabric, Metal…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-color">Color</Label>
                <Input
                  id="p-color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  placeholder="Hot Pink, Green…"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <TagInput
                value={form.tags}
                onChange={(tags) => set("tags", tags)}
                placeholder="Type a tag and press Enter or ,"
              />
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 rounded border text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 rounded border text-[10px]">,</kbd> to add · Backspace to remove last
              </p>
            </div>
          </fieldset>

          {/* ── Section: Shipping dimensions (collapsed by default) ── */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Shipping dimensions (optional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="p-weight">Weight (kg)</Label>
                <Input
                  id="p-weight"
                  type="number"
                  step="0.001"
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
          </details>

          {/* ── Flags ── */}
          <div className="flex flex-wrap gap-5 rounded-lg border p-4">
            {FLAGS.filter((f) => isEdit || f.key !== "is_active").map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch
                  checked={form[flag.key] as boolean}
                  onCheckedChange={(v) => set(flag.key, v as never)}
                />
                {flag.label}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
