import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
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

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  categories: Category[]
  onSaved: () => void
}

const NO_PARENT = "none"

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
  onSaved,
}: CategoryFormDialogProps) {
  const isEdit = !!category
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string[]>([])
  const [parentId, setParentId] = useState<string>(NO_PARENT)
  const [sortOrder, setSortOrder] = useState("0")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? "")
    setDescription(category?.description ?? "")
    setImage(category?.image ? [category.image] : [])
    setParentId(
      category?.parent_id != null ? String(category.parent_id) : NO_PARENT
    )
    setSortOrder(String(category?.sort_order ?? 0))
    setIsActive(category?.is_active ?? true)
  }, [open, category])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CategoryCreate = {
        name,
        description: description || undefined,
        image: image[0] || undefined,
        parent_id: parentId === NO_PARENT ? undefined : Number(parentId),
        sort_order: Number(sortOrder),
        is_active: isActive,
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

  const parentOptions = categories.filter((c) => c.id !== category?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category details below."
              : "Add a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name *</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Image</Label>
            <ImageUploader value={image} onChange={setImage} multiple={false} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Parent</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>None</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-sort">Sort order</Label>
              <Input
                id="c-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            Active (visible on storefront)
          </label>

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
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
