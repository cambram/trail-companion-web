const API_URL = import.meta.env.VITE_API_URL

export type ValidationError = { code: string; message: string }

export class ApiError extends Error {
  status: number
  validationErrors: ValidationError[]

  constructor(status: number, message: string, validationErrors: ValidationError[] = []) {
    super(message)
    this.status = status
    this.validationErrors = validationErrors
  }
}

// 401 and 429 can have empty bodies: check status first, parse JSON only for problem+json.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  })
  if (res.ok) return (await res.json()) as T

  let problem: { detail?: string; title?: string; validationErrors?: ValidationError[] } = {}
  if (res.headers.get("Content-Type")?.includes("application/problem+json")) {
    problem = await res.json()
  }
  throw new ApiError(
    res.status,
    problem.detail ?? problem.title ?? "Something went wrong",
    problem.validationErrors,
  )
}
