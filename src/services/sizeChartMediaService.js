async function parseResponse(response, fallback) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || data.detail || fallback)
  }
  return data
}

export const sizeChartMediaService = {
  async uploadImage(templateId, file) {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`/api/size-charts/${templateId}/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    const data = await parseResponse(response, 'Failed to upload size chart image')
    return {
      imageUrl: data.image_url,
    }
  },
}
