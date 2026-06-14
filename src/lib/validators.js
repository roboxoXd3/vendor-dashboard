const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function isValidProductId(productId) {
  if (!productId || productId === 'temp' || productId === 'size-charts') {
    return false
  }
  return UUID_REGEX.test(productId)
}
