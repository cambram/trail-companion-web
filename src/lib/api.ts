const API_URL = import.meta.env.VITE_API_URL

export type ValidationError = { code: string; message: string }

export class ApiError extends Error {
  status: number
  validationErrors: ValidationError[]
  /** True when the body was ProblemDetails. A 401 without one is an expired or invalid token. */
  problem: boolean

  constructor(status: number, message: string, validationErrors: ValidationError[] = [], problem = false) {
    super(message)
    this.status = status
    this.validationErrors = validationErrors
    this.problem = problem
  }
}

/** Login is limited to 5/min per IP: wait out the fixed window. */
export class RateLimitedError extends Error {
  seconds = 60
}

// 401 and 429 can have empty bodies: check status first, parse JSON only for problem+json.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // Sends and stores the httpOnly refresh cookie.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  })
  if (res.status === 204) return undefined as T
  if (res.ok) return (await res.json()) as T

  let problem: { detail?: string; title?: string; validationErrors?: ValidationError[] } = {}
  const isProblem = !!res.headers.get("Content-Type")?.includes("application/problem+json")
  if (isProblem) problem = await res.json()
  throw new ApiError(
    res.status,
    problem.detail ?? problem.title ?? "Something went wrong",
    problem.validationErrors,
    isProblem,
  )
}
