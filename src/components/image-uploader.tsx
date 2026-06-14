import { useRef, useState } from "react"
import { Loader2, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { uploadImage } from "@/services/upload"
import { Button } from "@/components/ui/button"
import { RemoteImage } from "@/components/remote-image"

interface ImageUploaderProps {
  value: string[]
  onChange: (keys: string[]) => void
  multiple?: boolean
}

export function ImageUploader({
  value,
  onChange,
  multiple = true,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const picked = Array.from(files)
      const results = await Promise.all(picked.map((f) => uploadImage(f)))
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

      {(multiple || value.length === 0) && (
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
