import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Get size charts with categories and dynamic fields
    const { data: sizeCharts, error: chartsError } = await supabase
      .from('vendor_size_chart_templates')
      .select(`
        *,
        categories(name),
        dynamic_size_chart_fields(*)
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (chartsError) {
      console.error('Error fetching size charts:', chartsError);
      return NextResponse.json({ error: 'Failed to fetch size charts' }, { status: 500 });
    }

    // Transform the data to include category name and organize fields
    const transformedCharts = sizeCharts.map(chart => ({
      ...chart,
      category_name: chart.categories?.name || null,
      dynamic_fields: chart.dynamic_size_chart_fields || [],
      // Remove the nested objects
      categories: undefined,
      dynamic_size_chart_fields: undefined
    }));

    return NextResponse.json({ 
      sizeCharts: transformedCharts,
      success: true 
    });

  } catch (error) {
    console.error('Error in size charts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      category_id, 
      measurement_types, 
      measurement_instructions, 
      entries, 
      vendor_id,
      dynamic_fields = []
    } = body;

    if (!name || !vendor_id) {
      return NextResponse.json({ error: 'Name and vendor_id are required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Create the size chart template
    const { data: sizeChart, error: chartError } = await supabase
      .from('vendor_size_chart_templates')
      .insert({
        vendor_id,
        name,
        category_id: category_id || null,
        measurement_types,
        measurement_instructions: measurement_instructions || null,
        template_data: {
          entries: entries || []
        },
        chart_type: 'custom',
        is_dynamic: true
      })
      .select()
      .single();

    if (chartError) {
      console.error('Error creating size chart:', chartError);
      return NextResponse.json({ error: 'Failed to create size chart' }, { status: 500 });
    }

    // Create dynamic fields if provided
    if (dynamic_fields.length > 0) {
      const fieldsToInsert = dynamic_fields.map((field, index) => ({
        size_chart_id: sizeChart.id,
        field_name: field.name,
        field_type: field.type || 'measurement',
        field_unit: field.unit || 'cm',
        is_required: field.required || false,
        field_options: field.options || null,
        placeholder_text: field.placeholder || null,
        help_text: field.help || null,
        sort_order: index,
        validation_rules: field.validation || null
      }));

      const { error: fieldsError } = await supabase
        .from('dynamic_size_chart_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('Error creating dynamic fields:', fieldsError);
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({ 
      sizeChart,
      success: true,
      message: 'Size chart created successfully' 
    });

  } catch (error) {
    console.error('Error in create size chart API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}