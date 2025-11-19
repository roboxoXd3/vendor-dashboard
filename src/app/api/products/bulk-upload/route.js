import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { vendorId, products } = body

    console.log('🚀 Bulk upload request received:', {
      vendorId,
      productCount: products?.length
    })

    // Validation
    if (!vendorId) {
      return NextResponse.json({ 
        success: false,
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Products array is required and cannot be empty' 
      }, { status: 400 })
    }

    const supabase = getSupabaseServer()
    
    // All new products require admin approval
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('status, is_active')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.error('❌ Error fetching vendor status:', vendorError)
      return NextResponse.json({
        success: false,
        error: 'Failed to verify vendor status',
        message: vendorError.message
      }, { status: 500 })
    }

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 })
    }

    // All new products require admin approval
    const approvalStatus = 'pending'

    console.log(`📦 Bulk upload for vendor with status: ${vendor.status}, products approval_status: ${approvalStatus}`)
    
    // Get categories for validation - reuse existing pattern
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        message: categoriesError.message
      }, { status: 500 })
    }

    const categoryMap = new Map(categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || [])
    console.log('📂 Available categories:', Array.from(categoryMap.keys()))

    const processedProducts = []
    const errors = []

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNumber = i + 2 // Account for header row
      
      try {
        // Basic validation - same as existing product creation
        if (!product.name?.trim()) {
          errors.push(`Row ${rowNumber}: Product name is required`)
          continue
        }
        
        if (!product.price || isNaN(parseFloat(product.price))) {
          errors.push(`Row ${rowNumber}: Valid price is required`)
          continue
        }

        // Process category
        let categoryId = null
        if (product.category_name?.trim()) {
          categoryId = categoryMap.get(product.category_name.toLowerCase())
          if (!categoryId) {
            errors.push(`Row ${rowNumber}: Category "${product.category_name}" not found. Available categories: ${Array.from(categoryMap.keys()).join(', ')}`)
            continue
          }
        }

        // Process arrays - same pattern as existing form
        const processArray = (value) => {
          if (!value) return []
          return value.split('|').map(item => item.trim()).filter(item => item)
        }

        // Process image URLs for later processing (keep as empty for now)
        const imageUrls = product.image_urls ? 
          product.image_urls.split(',').map(url => url.trim()).filter(url => url) : []

        // Process dimensions
        const dimensions = {}
        if (product.length) dimensions.length = parseFloat(product.length) || 0
        if (product.width) dimensions.width = parseFloat(product.width) || 0
        if (product.height) dimensions.height = parseFloat(product.height) || 0

        // Process boolean values
        const processBoolean = (value) => {
          if (!value) return false
          const lowerValue = value.toString().toLowerCase()
          return ['true', '1', 'yes'].includes(lowerValue)
        }

        // Create product data - SAME STRUCTURE as existing useProductSubmit
        const processedProduct = {
          vendor_id: vendorId,
          name: product.name.trim(),
          subtitle: product.subtitle?.trim() || '',
          description: product.description?.trim() || '',
          brand: product.brand?.trim() || '',
          sku: product.sku?.trim() || `SKU-${Date.now()}-${i}`,
          category_id: categoryId,
          price: parseFloat(product.price),
          mrp: product.mrp ? parseFloat(product.mrp) : null,
          sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
          discount_percentage: product.discount_percentage ? parseFloat(product.discount_percentage) : null,
          currency: product.currency?.trim() || 'USD',
          base_currency: product.base_currency?.trim() || product.currency?.trim() || 'USD',
          stock_quantity: parseInt(product.stock_quantity) || 0,
          weight: product.weight ? parseFloat(product.weight) : null,
          dimensions: Object.keys(dimensions).length > 0 ? dimensions : null,
          sizes: processArray(product.sizes),
          colors: processArray(product.colors),
          tags: processArray(product.tags),
          box_contents: processArray(product.box_contents),
          usage_instructions: processArray(product.usage_instructions),
          care_instructions: processArray(product.care_instructions),
          safety_notes: processArray(product.safety_notes),
          
          // Images: Start empty, can be added later to avoid timeout
          images: JSON.stringify([]),
          video_url: product.video_url?.trim() || null,
          
          is_featured: processBoolean(product.is_featured),
          is_new_arrival: product.is_new_arrival ? processBoolean(product.is_new_arrival) : true,
          is_on_sale: product.is_on_sale ? processBoolean(product.is_on_sale) : false,
          shipping_required: product.shipping_required !== 'false' && product.shipping_required !== false,
          sizing_required: product.sizing_required ? processBoolean(product.sizing_required) : false,
          product_type: product.product_type?.trim() || null,
          status: product.status?.trim() || 'active',
          meta_title: product.meta_title?.trim() || null,
          meta_description: product.meta_description?.trim() || null,
          size_chart_override: product.size_chart_override?.trim() || 'auto',
          approval_status: approvalStatus, // Based on vendor status
          in_stock: product.in_stock ? processBoolean(product.in_stock) : (parseInt(product.stock_quantity) > 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        processedProducts.push(processedProduct)

        console.log(`✅ Processed product ${rowNumber}: ${product.name}`)

      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error)
        errors.push(`Row ${rowNumber}: ${error.message}`)
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      console.log('❌ Validation errors found:', errors.length)
      return NextResponse.json({
        success: false,
        error: 'Validation errors found',
        errors,
        processedCount: 0,
        totalCount: products.length
      }, { status: 400 })
    }

    console.log(`📦 Processing ${processedProducts.length} products with advanced SKU handling`)

    // Step 1: Check for existing SKUs globally and by vendor
    const skus = processedProducts.map(p => p.sku)
    
    // Get all existing products with these SKUs (globally)
    const { data: allExistingProducts } = await supabase
      .from('products')
      .select('id, sku, vendor_id, name')
      .in('sku', skus)

    // Get existing products for this specific vendor
    const { data: vendorExistingProducts } = await supabase
      .from('products')
      .select('id, sku, vendor_id, name')
      .in('sku', skus)
      .eq('vendor_id', vendorId)

    const globalExistingSKUs = new Map()
    const vendorExistingSKUs = new Map()

    // Map global existing SKUs
    allExistingProducts?.forEach(product => {
      globalExistingSKUs.set(product.sku, product)
    })

    // Map vendor-specific existing SKUs
    vendorExistingProducts?.forEach(product => {
      vendorExistingSKUs.set(product.sku, product)
    })

    // Step 2: Categorize products based on SKU conflicts
    const productsToInsert = []
    const productsToUpdate = []
    const skuConflicts = []

    for (const product of processedProducts) {
      const originalSku = product.sku
      
      if (vendorExistingSKUs.has(originalSku)) {
        // Same vendor, same SKU -> Update existing product
        const existingProduct = vendorExistingSKUs.get(originalSku)
        productsToUpdate.push({
          ...product,
          id: existingProduct.id,
          originalSku
        })
        console.log(`🔄 Will update existing product: ${product.name} (SKU: ${originalSku})`)
        
      } else if (globalExistingSKUs.has(originalSku)) {
        // Different vendor, same SKU -> Create with modified SKU
        let newSku = `${originalSku}-V${vendorId.slice(-4)}`
        let counter = 1
        
        // Ensure the new SKU is globally unique
        while (globalExistingSKUs.has(newSku)) {
          newSku = `${originalSku}-V${vendorId.slice(-4)}-${counter}`
          counter++
        }
        
        const modifiedProduct = { ...product, sku: newSku }
        productsToInsert.push(modifiedProduct)
        skuConflicts.push({
          originalSku,
          newSku,
          productName: product.name,
          reason: 'SKU exists with different vendor'
        })
        console.log(`🔀 SKU conflict resolved: ${originalSku} -> ${newSku} for ${product.name}`)
        
      } else {
        // New SKU -> Insert normally
        productsToInsert.push(product)
        console.log(`✨ New product: ${product.name} (SKU: ${originalSku})`)
      }
    }

    console.log(`📊 Processing summary:`)
    console.log(`  - Products to insert: ${productsToInsert.length}`)
    console.log(`  - Products to update: ${productsToUpdate.length}`)
    console.log(`  - SKU conflicts resolved: ${skuConflicts.length}`)

    let insertedData = []
    let updatedData = []
    let processingErrors = []

    // Step 3: Insert new products
    if (productsToInsert.length > 0) {
      const { data: insertResult, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select('id, name, sku')

      if (insertError) {
        console.error('❌ Insert error:', insertError)
        processingErrors.push(`Insert failed: ${insertError.message}`)
      } else {
        insertedData = insertResult || []
        console.log(`✅ Successfully inserted ${insertedData.length} products`)
      }
    }

    // Step 4: Update existing products
    if (productsToUpdate.length > 0) {
      for (const product of productsToUpdate) {
        const { id, originalSku, ...updateData } = product
        
        const { data: updateResult, error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select('id, name, sku')

        if (updateError) {
          console.error(`❌ Update error for ${product.name}:`, updateError)
          processingErrors.push(`Update failed for ${product.name}: ${updateError.message}`)
        } else if (updateResult && updateResult.length > 0) {
          updatedData.push(updateResult[0])
          console.log(`✅ Successfully updated ${product.name}`)
        }
      }
    }

    // Check for any errors
    if (processingErrors.length > 0 && insertedData.length === 0 && updatedData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bulk operation failed',
        message: processingErrors.join('; '),
        details: processingErrors
      }, { status: 500 })
    }

    // Step 5: Prepare comprehensive response
    const totalProcessed = insertedData.length + updatedData.length
    const allProcessedData = [...insertedData, ...updatedData]
    
    console.log(`✅ Bulk operation completed: ${totalProcessed} products processed`)

    let message = `Successfully processed ${totalProcessed} products`
    if (insertedData.length > 0) message += ` (${insertedData.length} created`
    if (updatedData.length > 0) message += `${insertedData.length > 0 ? ', ' : ' ('}${updatedData.length} updated`
    if (insertedData.length > 0 || updatedData.length > 0) message += ')'
    if (skuConflicts.length > 0) message += ` - ${skuConflicts.length} SKU conflicts resolved`
    if (processingErrors.length > 0) message += ` - ${processingErrors.length} errors occurred`

    return NextResponse.json({
      success: true,
      message,
      summary: {
        totalUploaded: products.length,
        totalProcessed,
        inserted: insertedData.length,
        updated: updatedData.length,
        skuConflictsResolved: skuConflicts.length,
        errors: processingErrors.length
      },
      data: {
        inserted: insertedData.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          action: 'created'
        })),
        updated: updatedData.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          action: 'updated'
        })),
        skuConflicts: skuConflicts,
        errors: processingErrors
      }
    })

  } catch (error) {
    console.error('❌ Bulk upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// GET method to check API availability
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Bulk upload API is available',
    endpoints: {
      POST: 'Upload products via CSV data'
    }
  })
}
