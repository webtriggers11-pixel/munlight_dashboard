import { useState, useRef, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter or , to add…",
  className,
}: TagInputProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/,+$/, "")
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInput("")
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(input)
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  function handleBlur() {
    if (input.trim()) addTag(input)
  }

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1 h-6"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="rounded-full opacity-60 hover:opacity-100 transition-opacity"
            aria-label={`Remove ${tag}`}
          >
            <X size={10} />
          </button>
        </Badge>
      ))}

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
      />
    </div>
  )
}
