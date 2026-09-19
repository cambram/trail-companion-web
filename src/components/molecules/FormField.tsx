import { useId } from "react"

import { ErrorText } from "@/components/atoms/ErrorText"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormFieldProps = React.ComponentProps<typeof Input> & {
  label: string
  error?: string
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-invalid={!!error} {...inputProps} />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}
