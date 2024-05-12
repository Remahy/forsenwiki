import { uint8ArrayToBase64 } from "uint8array-extras"

import { Y } from "./index.mjs"

/**
 * @param {YDoc} yDoc
 */
export function encodeYDocToUpdateV2(yDoc) {
  const yjsUpdateState = Y.encodeStateAsUpdateV2(yDoc)
  const encodedContent = uint8ArrayToBase64(yjsUpdateState)

  return encodedContent
}
