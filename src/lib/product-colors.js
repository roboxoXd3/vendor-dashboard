/** Deep-merge color entries from BeSmart API into existing form/DB colors */
export function mergeColorEntries(baseColors = {}, incomingColors = {}) {
  const merged = { ...baseColors }
  for (const [name, data] of Object.entries(incomingColors)) {
    const existing = merged[name]
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      merged[name] = { ...existing, ...data }
    } else {
      merged[name] = data
    }
  }
  return merged
}

/** Normalize a single color entry for Supabase storage, preserving image_url from R2 */
export function normalizeColorEntry(colorName, colorData, getDefaultColorHex) {
  if (typeof colorData === 'object' && colorData !== null) {
    const entry = {
      hex: colorData.hex || getDefaultColorHex(colorName),
      sizes: colorData.sizes || {},
    }
    if (colorData.image_url) {
      entry.image_url = colorData.image_url
    }
    return entry
  }

  return {
    hex: colorData || getDefaultColorHex(colorName),
    sizes: {},
  }
}
