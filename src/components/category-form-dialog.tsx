import { useEffect, useState, type FormEvent } from "react"
import { Loader2, Link2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { createCategory, updateCategory } from "@/services/categories"
import type { Category, CategoryCreate } from "@/types/category"
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
import { cn } from "@/lib/utils"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  categories: Category[]   // flat list — used for parent selector
  onSaved: () => void
}

const NO_PARENT = "none"

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
  onSaved,
}: CategoryFormDialogProps) {
  const isEdit = !!category

  // Category type: top-level or subcategory
  const [categoryType, setCategoryType] = useState<"top" | "sub">("top")

  const [name,        setName]        = useState("")
  const [slug,        setSlug]        = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [image,       setImage]       = useState<string[]>([])
  const [parentId,    setParentId]    = useState<string>(NO_PARENT)
  const [sortOrder,   setSortOrder]   = useState("0")
  const [isActive,    setIsActive]    = useState(true)
  const [saving,      setSaving]      = useState(false)

  // Only top-level categories are valid parents (no 3-level nesting)
  const topLevelCategories = categories.filter(
    (c) => c.parent_id === null && c.id !== category?.id
  )

  // URL preview
  const parentSlug = topLevelCategories.find((c) => String(c.id) === parentId)?.slug
  const urlPreview =
    categoryType === "sub" && parentSlug
      ? `/shop/${parentSlug}/${slug || "…"}`
      : `/shop/${slug || "…"}`

  useEffect(() => {
    if (!open) return
    const isSubcategory = category?.parent_id != null
    setCategoryType(isSubcategory ? "sub" : "top")
    setName(category?.name ?? "")
    setSlug(category?.slug ?? "")
    setSlugTouched(!!category?.slug)   // on edit, treat existing slug as touched
    setDescription(category?.description ?? "")
    setImage(category?.image ? [category.image] : [])
    setParentId(category?.parent_id != null ? String(category.parent_id) : NO_PARENT)
    setSortOrder(String(category?.sort_order ?? 0))
    setIsActive(category?.is_active ?? true)
  }, [open, category])

  function handleNameChange(val: string) {
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlug(toSlug(val))
    setSlugTouched(true)
  }

  function handleTypeChange(type: "top" | "sub") {
    setCategoryType(type)
    if (type === "top") setParentId(NO_PARENT)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (categoryType === "sub" && parentId === NO_PARENT) {
      toast.error("Please select a parent category")
      return
    }
    setSaving(true)
    try {
      const payload: CategoryCreate = {
        name,
        slug:        slug.trim() || undefined,
        description: description || undefined,
        image:       image[0] || undefined,
        parent_id:   categoryType === "sub" && parentId !== NO_PARENT ? Number(parentId) : undefined,
        sort_order:  Number(sortOrder),
        is_active:   isActive,
      }
      if (isEdit && category) {
        await updateCategory(category.id, payload)
        toast.success("Category updated")
      } else {
        await createCategory(payload)
        toast.success("Category created")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category details below."
              : "Fill in the details to create a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* ── Category type ── */}
          {!isEdit && (
            <div className="grid gap-2">
              <Label>Category type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["top", "sub"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left transition-colors",
                      categoryType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <p className="text-sm font-semibold">
                      {type === "top" ? "Top-level" : "Subcategory"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {type === "top"
                        ? "Shown as a column in the mega-menu"
                        : "Listed under a top-level category"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Parent (only for subcategory) ── */}
          {(categoryType === "sub" || (isEdit && category?.parent_id != null)) && (
            <div className="grid gap-2">
              <Label>
                Parent category <span className="text-destructive">*</span>
              </Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a top-level category…" />
                </SelectTrigger>
                <SelectContent>
                  {topLevelCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Name ── */}
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={categoryType === "sub" ? "e.g. Pendant Sets" : "e.g. Handmade Jewellery"}
              required
            />
          </div>

          {/* ── Slug + URL preview ── */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="c-slug">
                Slug{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (auto-generated from name)
                </span>
              </Label>
              {slugTouched && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setSlug(toSlug(name)); setSlugTouched(false) }}
                >
                  Reset to auto
                </button>
              )}
            </div>
            <Input
              id="c-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. pendant-sets"
            />
            {slug && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 size={12} />
                {urlPreview}
              </p>
            )}
          </div>

          {/* ── Description ── */}
          <div className="grid gap-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description shown on the category page"
            />
          </div>

          {/* ── Image ── */}
          <div className="grid gap-2">
            <Label>Image</Label>
            <ImageUploader value={image} onChange={setImage} multiple={false} />
          </div>

          {/* ── Active + Sort (secondary) ── */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              Active (visible on storefront)
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="c-sort" className="text-xs text-muted-foreground whitespace-nowrap">
                Sort order
              </Label>
              <Input
                id="c-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-20 h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
