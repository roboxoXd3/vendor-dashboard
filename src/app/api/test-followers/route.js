import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { vendorId, userId } = await request.json()
    const supabase = getSupabaseServer()
    
    if (!vendorId || !userId) {
      return Response.json({ 
        error: 'Vendor ID and User ID are required' 
      }, { status: 400 })
    }

    console.log('👥 Adding follower for vendor:', vendorId, 'user:', userId)

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('vendor_follows')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('user_id', userId)
      .single()

    if (existingFollow) {
      return Response.json({ 
        message: 'Already following this vendor',
        data: existingFollow
      })
    }

    // Add new follow
    const { data, error } = await supabase
      .from('vendor_follows')
      .insert({
        vendor_id: vendorId,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Follower added successfully:', data)
    return Response.json({ 
      message: 'Successfully followed vendor',
      data 
    })

  } catch (error) {
    console.error('❌ Error adding follower:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const supabase = getSupabaseServer()
    
    if (!vendorId) {
      return Response.json({ 
        error: 'Vendor ID is required' 
      }, { status: 400 })
    }

    console.log('👥 Fetching followers for vendor:', vendorId)

    // Get follower count and list
    const { data: followers, error } = await supabase
      .from('vendor_follows')
      .select(`
        id,
        user_id,
        created_at
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get user profiles for followers
    const userIds = followers?.map(f => f.user_id) || []
    let userProfiles = []
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      if (profilesError) {
        console.error('❌ Error fetching user profiles:', profilesError)
      } else {
        userProfiles = profiles || []
      }
    }

    // Create a map of user profiles for quick lookup
    const profilesMap = new Map()
    userProfiles.forEach(profile => {
      profilesMap.set(profile.id, profile)
    })

    // Combine followers with their profile data
    const followersWithProfiles = followers?.map(follower => ({
      ...follower,
      profiles: profilesMap.get(follower.user_id) || { full_name: 'Unknown User' }
    })) || []

    const { count: followerCount } = await supabase
      .from('vendor_follows')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    console.log('✅ Followers retrieved:', { count: followerCount, followers: followersWithProfiles })
    return Response.json({ 
      data: {
        count: followerCount || 0,
        followers: followersWithProfiles
      }
    })

  } catch (error) {
    console.error('❌ Error fetching followers:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
