import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Size chart ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Get size chart with categories and dynamic fields
    const { data: sizeChart, error: chartError } = await supabase
      .from('vendor_size_chart_templates')
      .select(`
        *,
        categories(name),
        dynamic_size_chart_fields(*)
      `)
      .eq('id', id)
      .single();

    if (chartError) {
      console.error('Error fetching size chart:', chartError);
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    // Transform the data
    const transformedChart = {
      ...sizeChart,
      category_name: sizeChart.categories?.name || null,
      dynamic_fields: sizeChart.dynamic_size_chart_fields || [],
      entries: sizeChart.template_data?.entries || [],
      // Remove the nested objects
      categories: undefined,
      dynamic_size_chart_fields: undefined,
      template_data: undefined
    };

    return NextResponse.json({ 
      sizeChart: transformedChart,
      success: true 
    });

  } catch (error) {
    console.error('Error in get size chart API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      name, 
      category_id, 
      measurement_types, 
      measurement_instructions, 
      entries, 
      dynamic_fields = []
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Size chart ID is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Update the size chart template
    const { data: sizeChart, error: chartError } = await supabase
      .from('vendor_size_chart_templates')
      .update({
        name,
        category_id: category_id || null,
        measurement_types,
        measurement_instructions: measurement_instructions || null,
        template_data: {
          entries: entries || []
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (chartError) {
      console.error('Error updating size chart:', chartError);
      return NextResponse.json({ error: 'Failed to update size chart' }, { status: 500 });
    }

    // Delete existing dynamic fields
    const { error: deleteFieldsError } = await supabase
      .from('dynamic_size_chart_fields')
      .delete()
      .eq('size_chart_id', id);

    if (deleteFieldsError) {
      console.error('Error deleting existing dynamic fields:', deleteFieldsError);
    }

    // Create new dynamic fields if provided
    if (dynamic_fields.length > 0) {
      const fieldsToInsert = dynamic_fields.map((field, index) => ({
        size_chart_id: id,
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
      message: 'Size chart updated successfully' 
    });

  } catch (error) {
    console.error('Error in update size chart API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Size chart ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('vendor_size_chart_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting size chart:', deleteError);
      return NextResponse.json({ error: 'Failed to delete size chart' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Size chart deleted successfully' 
    });

  } catch (error) {
    console.error('Error in delete size chart API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}