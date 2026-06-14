import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"

export interface UploadResult {
  key: string
  url: string
}

// Uploads a file (multipart, field name "file") and returns the persistent
// storage key plus a short-lived presigned URL.
export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post<ApiEnvelope<UploadResult>>(
    "/upload/image",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data.data
}

// Resolves a stored key to a fresh presigned URL for display.
export async function getSignedUrl(key: string): Promise<string> {
  const { data } = await api.get<ApiEnvelope<{ url: string }>>(
    "/upload/signed-url",
    { params: { key } }
  )
  return data.data.url
}
