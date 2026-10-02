import assert from "node:assert/strict"

import { parseFlag } from "./flags.ts"

for (const v of [undefined, "", "   ", "true", "TRUE", "True", " true "]) assert.equal(parseFlag(v), true, String(v))
for (const v of ["false", "False", "FALSE", "0", "1", "no", "off", "flase"]) assert.equal(parseFlag(v), false, v)

console.log("flags ok")
