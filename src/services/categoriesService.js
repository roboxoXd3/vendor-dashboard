export const categoriesService = {
  async fetchAll() {
    const res = await fetch('/api/categories', { method: 'GET' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch categories')
    }
    return json.categories || []
  },

  toCSV(categories) {
    const rows = [['id', 'name', 'description']]
    for (const c of categories) {
      rows.push([
        c.id ?? '',
        (c.name ?? '').replaceAll(',', ' '),
        (c.description ?? '').replaceAll(',', ' ')
      ])
    }
    return rows.map(r => r.join(',')).join('\n')
  },

  downloadCSV(categories) {
    const csv = this.toCSV(categories)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'categories.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}


