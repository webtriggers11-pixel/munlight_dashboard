import { Input } from "@/components/ui/input"

interface MaskedSecretInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  // Masked value currently stored on the server (e.g. "****2fUn"), if any.
  saved?: string | null
  placeholder?: string
}

// Shows the saved masked value as-is. The whole value is selected on focus, so
// typing replaces it; once edited it switches to a normal password field.
export function MaskedSecretInput({
  id,
  value,
  onChange,
  saved,
  placeholder,
}: MaskedSecretInputProps) {
  const untouched = !!saved && value === saved
  return (
    <Input
      id={id}
      type={untouched ? "text" : "password"}
      className={untouched ? "font-mono" : undefined}
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
    />
  )
}
