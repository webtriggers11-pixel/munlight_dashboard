import { useEffect, useState } from "react"
import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { getAvatarColorClass, getInitials } from "@/lib/avatar"
import { getSignedUrl } from "@/services/upload"

// Cache resolved signed URLs per key for the session to avoid refetching.
const urlCache = new Map<string, Promise<string>>()

function resolve(value: string): Promise<string> {
  if (/^https?:\/\//.test(value)) return Promise.resolve(value)
  let cached = urlCache.get(value)
  if (!cached) {
    cached = getSignedUrl(value).catch((err) => {
      urlCache.delete(value)
      throw err
    })
    urlCache.set(value, cached)
  }
  return cached
}

interface RemoteImageProps {
  /** A stored image key or a full URL. */
  value?: string | null
  alt?: string
  className?: string
  /**
   * When there's no image (or it fails to load), show a colored initials
   * avatar derived from this name instead of a generic picture icon —
   * reads as an intentional empty state rather than a broken image.
   */
  fallbackLabel?: string
}

export function RemoteImage({ value, alt = "", className, fallbackLabel }: RemoteImageProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setSrc(null)
    setFailed(false)
    if (!value) return
    resolve(value)
      .then((url) => active && setSrc(url))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [value])

  if (!value || failed) {
    if (fallbackLabel) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-md text-xs font-semibold",
            getAvatarColorClass(fallbackLabel),
            className
          )}
        >
          {getInitials(fallbackLabel)}
        </div>
      )
    }
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageIcon className="size-4" />
      </div>
    )
  }

  if (!src) {
    return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("rounded-md object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}
