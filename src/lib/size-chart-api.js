export function transformBesmartSizeChart(chart, categories = []) {
  const categoryId = chart.category || chart.category_id || null
  const categoryName = categories.find((c) => c.id === categoryId)?.name || null

  return {
    ...chart,
    category_id: categoryId,
    category_name: categoryName,
    entries: chart.template_data?.entries || chart.entries || [],
  }
}

export function buildBesmartSizeChartPayload(formData, { includeImage = false } = {}) {
  const payload = {
    name: formData.name,
    measurement_types: formData.measurement_types,
    measurement_instructions: formData.measurement_instructions || null,
    chart_type: formData.chart_type || 'custom',
    template_data: {
      entries: formData.entries || [],
    },
    is_active: formData.is_active ?? true,
    is_dynamic: formData.is_dynamic ?? true,
    schema_version: formData.schema_version || '1.0',
    category: formData.category_id || null,
  }

  if (includeImage && formData.image_url && !formData.image_url.startsWith('blob:')) {
    payload.image_url = formData.image_url
  }

  return payload
}
