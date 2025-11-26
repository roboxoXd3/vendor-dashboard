import Papa from 'papaparse'

export const bulkUploadService = {
  /**
   * Parse CSV file and return structured data
   * @param {File} file - The CSV file to parse
   * @returns {Promise<Array>} Parsed CSV data as array of objects
   */
  async parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
            return
          }
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  },

  /**
   * Validate CSV structure and data
   * @param {Array} data - Parsed CSV data
   * @returns {Object} Validation result with isValid flag and errors
   */
  validateCSVStructure(data) {
    const requiredColumns = ['name', 'price']
    const errors = []

    if (!data || data.length === 0) {
      errors.push('CSV file is empty')
      return { isValid: false, errors }
    }

    const firstRow = data[0]
    const columns = Object.keys(firstRow)

    // Check required columns
    for (const required of requiredColumns) {
      if (!columns.includes(required)) {
        errors.push(`Missing required column: ${required}`)
      }
    }

    // Check for completely empty rows
    const validRows = data.filter(row => 
      Object.values(row).some(value => value && value.toString().trim())
    )

    if (validRows.length === 0) {
      errors.push('No valid data rows found')
    }

    // Validate data in each row
    validRows.forEach((row, index) => {
      const rowNumber = index + 2 // Account for header row
      
      // Check required fields
      if (!row.name || !row.name.trim()) {
        errors.push(`Row ${rowNumber}: Product name is required`)
      }
      
      if (!row.price || isNaN(parseFloat(row.price))) {
        errors.push(`Row ${rowNumber}: Valid price is required`)
      }
      
      // Validate numeric fields
      const numericFields = ['price', 'mrp', 'sale_price', 'discount_percentage', 'stock_quantity', 'weight', 'length', 'width', 'height']
      numericFields.forEach(field => {
        if (row[field] && row[field].trim() && isNaN(parseFloat(row[field]))) {
          errors.push(`Row ${rowNumber}: ${field} must be a valid number`)
        }
      })
      
      // Validate boolean fields
      const booleanFields = ['is_featured', 'is_new_arrival', 'is_on_sale', 'in_stock', 'shipping_required', 'sizing_required']
      booleanFields.forEach(field => {
        if (row[field] && row[field].trim() && 
            !['true', 'false', '1', '0', 'yes', 'no', ''].includes(row[field].toLowerCase())) {
          errors.push(`Row ${rowNumber}: ${field} must be true/false`)
        }
      })
    })

    return {
      isValid: errors.length === 0,
      errors,
      totalRows: data.length,
      validRows: validRows.length,
      columns
    }
  },

  /**
   * Generate CSV template with sample data
   * @returns {string} CSV template as string
   */
  generateTemplate() {
    const template = [
      {
        name: 'Premium Wireless Headphones',
        subtitle: 'High-Quality Audio Experience',
        description: 'Professional-grade wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
        brand: 'AudioTech',
        sku: 'AT-WH-001',
        category_name: 'Electronics',
        subcategory_name: '',
        price: '199.99',
        mrp: '249.99',
        sale_price: '179.99',
        discount_percentage: '20',
        currency: 'NGN',
        base_currency: 'NGN',
        stock_quantity: '50',
        in_stock: 'true',
        weight: '0.3',
        length: '20',
        width: '18',
        height: '8',
        sizes: 'One Size',
        colors: 'Black|White|Silver',
        tags: 'wireless|premium|noise-cancelling|bluetooth',
        box_contents: 'Headphones|Charging Cable|Carrying Case|User Manual|Warranty Card',
        usage_instructions: 'Charge for 2 hours before first use|Pair via Bluetooth settings|Press power button for 3 seconds to turn on',
        care_instructions: 'Clean with dry cloth only|Store in provided case|Avoid exposure to water',
        safety_notes: 'Do not use while driving|Keep volume at safe levels|Charge only with provided cable',
        image_urls: 'https://example.com/headphones-main.jpg,https://example.com/headphones-side.jpg',
        video_url: 'https://example.com/headphones-demo.mp4',
        is_featured: 'true',
        is_new_arrival: 'true',
        is_on_sale: 'true',
        shipping_required: 'true',
        sizing_required: 'false',
        product_type: 'Electronics',
        status: 'active',
        meta_title: 'Premium Wireless Headphones - AudioTech',
        meta_description: 'Buy premium wireless headphones with noise cancellation. High-quality audio experience for music lovers.',
        size_chart_override: 'auto'
      },
      {
        name: 'Cotton T-Shirt',
        subtitle: 'Comfortable Everyday Wear',
        description: '100% organic cotton t-shirt with modern fit. Soft, breathable, and perfect for casual wear.',
        brand: 'ComfortWear',
        sku: 'CW-TS-002',
        category_name: 'Fashion',
        subcategory_name: 'T-Shirts',
        price: '29.99',
        mrp: '39.99',
        sale_price: '',
        discount_percentage: '0',
        currency: 'NGN',
        base_currency: 'NGN',
        stock_quantity: '100',
        in_stock: 'true',
        weight: '0.2',
        length: '70',
        width: '50',
        height: '2',
        sizes: 'XS|S|M|L|XL|XXL',
        colors: 'White|Black|Navy|Gray',
        tags: 'cotton|casual|comfortable|organic',
        box_contents: 'T-Shirt|Care Instructions',
        usage_instructions: 'Machine wash cold|Tumble dry low|Iron on low heat if needed',
        care_instructions: 'Wash with similar colors|Do not bleach|Hang dry when possible',
        safety_notes: 'Check size chart before ordering|May shrink slightly after first wash',
        image_urls: 'https://example.com/tshirt-front.jpg,https://example.com/tshirt-back.jpg',
        video_url: '',
        is_featured: 'false',
        is_new_arrival: 'false',
        is_on_sale: 'false',
        shipping_required: 'true',
        sizing_required: 'true',
        product_type: 'Apparel',
        status: 'active',
        meta_title: 'Cotton T-Shirt - ComfortWear Organic',
        meta_description: '100% organic cotton t-shirt. Comfortable everyday wear with modern fit. Available in multiple sizes and colors.',
        size_chart_override: 'auto'
      },
      {
        name: 'Ceramic Coffee Mug',
        subtitle: 'Handcrafted Kitchen Essential',
        description: 'Beautiful handcrafted ceramic mug perfect for your morning coffee or tea. Microwave and dishwasher safe.',
        brand: 'HomeArt',
        sku: 'HA-CM-003',
        category_name: 'Home & Garden',
        subcategory_name: 'Kitchenware',
        price: '24.99',
        mrp: '34.99',
        sale_price: '19.99',
        discount_percentage: '15',
        currency: 'NGN',
        base_currency: 'NGN',
        stock_quantity: '75',
        in_stock: 'true',
        weight: '0.4',
        length: '10',
        width: '8',
        height: '10',
        sizes: '12oz',
        colors: 'White|Blue|Green|Gray',
        tags: 'ceramic|handmade|coffee|kitchen|microwave-safe',
        box_contents: 'Ceramic Mug|Care Instructions',
        usage_instructions: 'Microwave safe up to 2 minutes|Hand wash recommended for longevity',
        care_instructions: 'Avoid sudden temperature changes|Use non-abrasive cleaners|Stack carefully',
        safety_notes: 'Handle with care - ceramic can break if dropped|Hot contents - use handle',
        image_urls: 'https://example.com/mug-main.jpg,https://example.com/mug-colors.jpg',
        video_url: '',
        is_featured: 'false',
        is_new_arrival: 'true',
        is_on_sale: 'true',
        shipping_required: 'true',
        sizing_required: 'false',
        product_type: 'Home & Kitchen',
        status: 'active',
        meta_title: 'Ceramic Coffee Mug - Handcrafted Kitchen Essential',
        meta_description: 'Beautiful handcrafted ceramic mug. Microwave and dishwasher safe. Perfect for coffee and tea lovers.',
        size_chart_override: 'auto'
      },
      {
        name: 'Yoga Mat Premium',
        subtitle: 'Non-Slip Exercise Mat',
        description: '6mm thick premium yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness routines.',
        brand: 'FitZen',
        sku: 'FZ-YM-004',
        category_name: 'Sports',
        subcategory_name: 'Fitness Equipment',
        price: '79.99',
        mrp: '99.99',
        sale_price: '69.99',
        discount_percentage: '10',
        currency: 'NGN',
        base_currency: 'NGN',
        stock_quantity: '30',
        in_stock: 'true',
        weight: '1.2',
        length: '183',
        width: '61',
        height: '0.6',
        sizes: 'Standard',
        colors: 'Purple|Blue|Pink|Black',
        tags: 'yoga|fitness|eco-friendly|non-slip|premium',
        box_contents: 'Yoga Mat|Carrying Strap|Storage Bag|Exercise Guide',
        usage_instructions: 'Unroll and air out before first use|Use on flat surface|Store rolled up',
        care_instructions: 'Clean with mild soap and water|Air dry completely|Avoid direct sunlight',
        safety_notes: 'Ensure mat is dry before use|Check for wear and replace if damaged',
        image_urls: 'https://example.com/yoga-mat-main.jpg,https://example.com/yoga-mat-colors.jpg',
        video_url: '',
        is_featured: 'true',
        is_new_arrival: 'false',
        is_on_sale: 'true',
        shipping_required: 'true',
        sizing_required: 'false',
        product_type: 'Sports & Fitness',
        status: 'active',
        meta_title: 'Premium Yoga Mat - Non-Slip Exercise Mat',
        meta_description: '6mm thick premium yoga mat. Eco-friendly materials. Perfect for yoga, pilates, and fitness routines.',
        size_chart_override: 'auto'
      },
      {
        name: 'Moisturizing Face Cream',
        subtitle: 'Daily Hydration for All Skin Types',
        description: 'Luxurious face cream with hyaluronic acid and vitamin E. Provides 24-hour hydration for healthy, glowing skin.',
        brand: 'GlowLux',
        sku: 'GL-FC-005',
        category_name: 'Beauty',
        subcategory_name: 'Skincare',
        price: '49.99',
        mrp: '69.99',
        sale_price: '39.99',
        discount_percentage: '15',
        currency: 'NGN',
        base_currency: 'NGN',
        stock_quantity: '60',
        in_stock: 'true',
        weight: '0.15',
        length: '8',
        width: '8',
        height: '5',
        sizes: '50ml',
        colors: 'White Packaging',
        tags: 'skincare|moisturizer|hyaluronic-acid|vitamin-e|daily-use',
        box_contents: 'Face Cream 50ml|Usage Guide|Ingredient List',
        usage_instructions: 'Apply to clean face morning and evening|Gently massage until absorbed',
        care_instructions: 'Store in cool, dry place|Use within 12 months of opening|Avoid direct sunlight',
        safety_notes: 'For external use only|Patch test before first use|Discontinue if irritation occurs',
        image_urls: 'https://example.com/face-cream-main.jpg,https://example.com/face-cream-texture.jpg',
        video_url: '',
        is_featured: 'false',
        is_new_arrival: 'true',
        is_on_sale: 'true',
        shipping_required: 'true',
        sizing_required: 'false',
        product_type: 'Beauty & Personal Care',
        status: 'active',
        meta_title: 'Moisturizing Face Cream - Daily Hydration',
        meta_description: 'Luxurious face cream with hyaluronic acid and vitamin E. 24-hour hydration for healthy, glowing skin.',
        size_chart_override: 'auto'
      }
    ]

    const csv = Papa.unparse(template)
    return csv
  },

  /**
   * Process and validate individual product data
   * @param {Object} productRow - Single row of CSV data
   * @param {number} rowNumber - Row number for error reporting
   * @param {Map} categoryMap - Map of category names to IDs
   * @returns {Object} Processed product data or error
   */
  processProductRow(productRow, rowNumber, categoryMap) {
    try {
      // Basic validation
      if (!productRow.name?.trim()) {
        throw new Error('Product name is required')
      }
      
      if (!productRow.price || isNaN(parseFloat(productRow.price))) {
        throw new Error('Valid price is required')
      }

      // Process category
      let categoryId = null
      if (productRow.category_name?.trim()) {
        categoryId = categoryMap.get(productRow.category_name.toLowerCase())
        if (!categoryId) {
          throw new Error(`Category "${productRow.category_name}" not found`)
        }
      }

      // Process arrays (sizes, colors, tags, etc.)
      const processArray = (value) => {
        if (!value) return []
        return value.split('|').map(item => item.trim()).filter(item => item)
      }

      // Process image URLs
      const processImageUrls = (urls) => {
        if (!urls) return []
        return urls.split(',').map(url => url.trim()).filter(url => url)
      }

      // Process dimensions
      const dimensions = {}
      if (productRow.length) dimensions.length = parseFloat(productRow.length) || 0
      if (productRow.width) dimensions.width = parseFloat(productRow.width) || 0
      if (productRow.height) dimensions.height = parseFloat(productRow.height) || 0

      // Process boolean values
      const processBoolean = (value) => {
        if (!value) return false
        const lowerValue = value.toString().toLowerCase()
        return ['true', '1', 'yes'].includes(lowerValue)
      }

      // Process subcategory if provided
      let subcategoryId = null
      if (productRow.subcategory_name?.trim() && categoryMap) {
        // Note: This would need a subcategory map if subcategories are stored separately
        // For now, we'll leave it as null and let the backend handle it
      }

      const processedProduct = {
        name: productRow.name.trim(),
        subtitle: productRow.subtitle?.trim() || '',
        description: productRow.description?.trim() || '',
        brand: productRow.brand?.trim() || '',
        sku: productRow.sku?.trim() || `SKU-${Date.now()}-${rowNumber}`,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        price: parseFloat(productRow.price),
        mrp: productRow.mrp ? parseFloat(productRow.mrp) : null,
        sale_price: productRow.sale_price ? parseFloat(productRow.sale_price) : null,
        discount_percentage: productRow.discount_percentage ? parseFloat(productRow.discount_percentage) : null,
        currency: productRow.currency?.trim() || 'NGN',
        base_currency: productRow.base_currency?.trim() || productRow.currency?.trim() || 'NGN',
        stock_quantity: parseInt(productRow.stock_quantity) || 0,
        weight: productRow.weight ? parseFloat(productRow.weight) : null,
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : null,
        sizes: processArray(productRow.sizes),
        colors: processArray(productRow.colors),
        tags: processArray(productRow.tags),
        box_contents: processArray(productRow.box_contents),
        usage_instructions: processArray(productRow.usage_instructions),
        care_instructions: processArray(productRow.care_instructions),
        safety_notes: processArray(productRow.safety_notes),
        image_urls: processImageUrls(productRow.image_urls),
        video_url: productRow.video_url?.trim() || null,
        is_featured: processBoolean(productRow.is_featured),
        is_new_arrival: productRow.is_new_arrival ? processBoolean(productRow.is_new_arrival) : false,
        is_on_sale: productRow.is_on_sale ? processBoolean(productRow.is_on_sale) : false,
        shipping_required: productRow.shipping_required !== 'false' && productRow.shipping_required !== false,
        sizing_required: productRow.sizing_required ? processBoolean(productRow.sizing_required) : false,
        product_type: productRow.product_type?.trim() || null,
        status: productRow.status?.trim() || 'active',
        meta_title: productRow.meta_title?.trim() || null,
        meta_description: productRow.meta_description?.trim() || null,
        size_chart_override: productRow.size_chart_override?.trim() || 'auto',
        // Default values
        approval_status: 'pending',
        in_stock: productRow.in_stock ? processBoolean(productRow.in_stock) : (parseInt(productRow.stock_quantity) > 0)
      }

      return { success: true, data: processedProduct }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Upload products in batches to avoid overwhelming the server
   * @param {string} vendorId - Vendor ID
   * @param {Array} products - Array of product data
   * @param {number} batchSize - Number of products per batch
   * @returns {Promise<Object>} Upload results
   */
  async uploadProducts(vendorId, products, batchSize = 50) {
    const results = {
      successful: [],
      failed: [],
      errors: []
    }

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      try {
        const response = await fetch('/api/products/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorId,
            products: batch
          })
        })

        const result = await response.json()

        if (result.success) {
          results.successful.push(...(result.data || []))
        } else {
          results.failed.push(...batch)
          results.errors.push(...(result.errors || [result.error]))
        }
      } catch (error) {
        results.failed.push(...batch)
        results.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
      }
    }

    return results
  }
}
