import { parseFlag } from "./flags"

// Read at build time. A toggle needs a rebuild. Keep it equal to the API's FEATURE_REGISTRATION_ENABLED.
export const registrationEnabled = parseFlag(import.meta.env.FEATURE_REGISTRATION_ENABLED)
