import { useRef, useState } from "react"
import { Loader2, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { uploadImage } from "@/services/upload"
import { Button } from "@/components/ui/button"
import { RemoteImage } from "@/components/remote-image"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB — must match backend MAX_SIZE_BYTES in app/utils/storage.py

interface ImageUploaderProps {
  value: string[]
  onChange: (keys: string[]) => void
  multiple?: boolean
  /** Maximum number of images allowed in `value`. Extra picked files are rejected with a toast. */
  max?: number
}

export function ImageUploader({
  value,
  onChange,
  multiple = true,
  max,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const atMax = max != null && value.length >= max

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = max != null ? Math.max(0, max - value.length) : Infinity
    const picked = Array.from(files)
    const valid: File[] = []
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`)
        continue
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`${f.name} is larger than 5 MB`)
        continue
      }
      if (valid.length >= remaining) {
        toast.error(`You can only have ${max} image${max === 1 ? "" : "s"} per product`)
        break
      }
      valid.push(f)
    }
    if (valid.length === 0) {
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setUploading(true)
    try {
      const results = await Promise.all(valid.map((f) => uploadImage(f)))
      const keys = results.map((r) => r.key)
      onChange(multiple ? [...value, ...keys] : keys.slice(0, 1))
      toast.success(`${keys.length} image${keys.length > 1 ? "s" : ""} uploaded`)
    } catch (err) {
      toast.error(apiErrorMessage(err, "Upload failed"))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value.map((key, i) => (
        <div key={`${key}-${i}`} className="relative">
          <RemoteImage value={key} className="size-16 border" />
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow"
            aria-label="Remove image"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}

      {(multiple || value.length === 0) && !atMax && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-16 w-16 flex-col gap-1"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <UploadIcon className="size-4" />
              <span className="text-xs">Add</span>
            </>
          )}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
