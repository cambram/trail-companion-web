// Unset or blank means on. Otherwise only "true" means on, matching bool.TryParse in the API.
export function parseFlag(value: string | undefined): boolean {
  const v = value?.trim() ?? ""
  return v === "" || v.toLowerCase() === "true"
}
