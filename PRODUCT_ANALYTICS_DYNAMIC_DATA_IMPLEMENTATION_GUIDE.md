# Product Analytics Dynamic Data Implementation Guide

## Overview

This document provides a comprehensive guide on how to replace the static dummy data in the Product Analytics page with dynamic data from the Supabase database. The analytics page currently displays hardcoded values but can be enhanced to show real-time vendor-specific metrics.

## Current Analytics Components Analysis

### 1. Analytics Page Cards (Top Metrics)

**Current Static Data:**
- Product Views: 8,492 (↑18.2%)
- Conversion Rate: 4.5% (↑0.5%)
- Avg. Order Value: $94.32 (↑3.1%)
- Return Rate: 1.2% (↑0.3%)

### 2. Conversion Funnel

**Current Static Data:**
- Product Views: 8,492 (100%)
- Add to Cart: 1,254 (14.8%)
- Checkout Started: 528 (6.2%)
- Purchased: 412 (4.8%)

### 3. Product Performance Table

**Current Static Data:**
- Product list with views, conversion rate, revenue, and ratings
- Data sourced from `productsPerformance.json`

### 4. Charts
- Product Views Over Time (Daily/Weekly/Monthly)
- Conversion Rate by Product

## Database Schema Analysis

### Key Tables for Analytics

#### 1. **products** table
- `vendor_id`: Links products to vendors
- `rating`: Average product rating
- `reviews`: Number of reviews
- `orders_count`: Number of times ordered
- `created_at`: Product creation date
- `status`: Product status (active, inactive, etc.)
- `in_stock`: Stock availability

#### 2. **orders** table
- `vendor_id`: Links orders to vendors
- `total`: Order total amount
- `status`: Order status
- `created_at`: Order creation date
- `payment_status`: Payment completion status

#### 3. **order_items** table
- `order_id`: Links to orders
- `product_id`: Links to products
- `quantity`: Items ordered
- `price`: Item price at time of order

#### 4. **cart_items** table
- `product_id`: Products added to cart
- `created_at`: When added to cart

#### 5. **search_analytics** table
- `query`: Search terms used
- `result_count`: Number of results
- `timestamp`: When search occurred

#### 6. **product_reviews** table
- `product_id`: Product being reviewed
- `rating`: Review rating (1-5)
- `created_at`: Review date

#### 7. **wishlist** table
- `product_id`: Products added to wishlist
- `user_id`: User who added to wishlist

## Dynamic Data Implementation

### 1. Product Views Calculation

**Current Challenge:** No direct "views" tracking table exists.

**Recommended Solutions:**

#### Option A: Create Product Views Tracking
```sql
-- Create new table for tracking product views
CREATE TABLE product_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_created_at ON product_views(created_at);
```

#### Option B: Use Existing Data as Proxy
```sql
-- Use search analytics + cart additions + wishlist as view proxy
WITH product_engagement AS (
    SELECT 
        p.id as product_id,
        p.name,
        -- Count search appearances
        COALESCE(search_count.count, 0) as search_appearances,
        -- Count cart additions
        COALESCE(cart_count.count, 0) as cart_additions,
        -- Count wishlist additions
        COALESCE(wishlist_count.count, 0) as wishlist_additions,
        -- Estimate views as combination
        (COALESCE(search_count.count, 0) * 3 + 
         COALESCE(cart_count.count, 0) * 10 + 
         COALESCE(wishlist_count.count, 0) * 5) as estimated_views
    FROM products p
    LEFT JOIN (
        SELECT 
            p.id,
            COUNT(*) as count
        FROM products p
        JOIN search_analytics sa ON sa.query ILIKE '%' || p.name || '%'
        WHERE sa.timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY p.id
    ) search_count ON p.id = search_count.id
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) as count
        FROM cart_items
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
    ) cart_count ON p.id = cart_count.product_id
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) as count
        FROM wishlist
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
    ) wishlist_count ON p.id = wishlist_count.product_id
    WHERE p.vendor_id = $1
)
SELECT SUM(estimated_views) as total_views FROM product_engagement;
```

### 2. Conversion Rate Calculation

```sql
-- Calculate conversion rate for vendor
WITH vendor_metrics AS (
    SELECT 
        -- Total "views" (using proxy method)
        SUM(
            (COALESCE(search_appearances, 0) * 3 + 
             COALESCE(cart_additions, 0) * 10 + 
             COALESCE(wishlist_additions, 0) * 5)
        ) as total_views,
        -- Total purchases
        SUM(COALESCE(purchase_count, 0)) as total_purchases
    FROM (
        SELECT 
            p.id,
            -- Search appearances
            (SELECT COUNT(*) FROM search_analytics sa 
             WHERE sa.query ILIKE '%' || p.name || '%' 
             AND sa.timestamp >= NOW() - INTERVAL '30 days') as search_appearances,
            -- Cart additions
            (SELECT COUNT(*) FROM cart_items ci 
             WHERE ci.product_id = p.id 
             AND ci.created_at >= NOW() - INTERVAL '30 days') as cart_additions,
            -- Wishlist additions
            (SELECT COUNT(*) FROM wishlist w 
             WHERE w.product_id = p.id 
             AND w.created_at >= NOW() - INTERVAL '30 days') as wishlist_additions,
            -- Actual purchases
            (SELECT COUNT(*) FROM order_items oi 
             JOIN orders o ON oi.order_id = o.id 
             WHERE oi.product_id = p.id 
             AND o.status IN ('delivered', 'shipped', 'processing')
             AND o.created_at >= NOW() - INTERVAL '30 days') as purchase_count
        FROM products p
        WHERE p.vendor_id = $1
    ) product_stats
)
SELECT 
    CASE 
        WHEN total_views > 0 THEN ROUND((total_purchases::DECIMAL / total_views::DECIMAL) * 100, 2)
        ELSE 0 
    END as conversion_rate
FROM vendor_metrics;
```

### 3. Average Order Value Calculation

```sql
-- Calculate average order value for vendor
SELECT 
    ROUND(AVG(o.total), 2) as avg_order_value,
    COUNT(*) as total_orders
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.vendor_id = $1
AND o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
AND o.created_at >= NOW() - INTERVAL '30 days';
```

### 4. Return Rate Calculation

**Note:** Currently no return tracking in database. Need to add return functionality.

```sql
-- Create returns table (recommended)
CREATE TABLE product_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    order_item_id UUID REFERENCES order_items(id),
    reason TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    return_amount DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Calculate return rate
WITH return_stats AS (
    SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT pr.order_id) as returned_orders
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_returns pr ON o.id = pr.order_id
    WHERE p.vendor_id = $1
    AND o.created_at >= NOW() - INTERVAL '30 days'
    AND o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
)
SELECT 
    CASE 
        WHEN total_orders > 0 THEN ROUND((returned_orders::DECIMAL / total_orders::DECIMAL) * 100, 2)
        ELSE 0 
    END as return_rate
FROM return_stats;
```

### 5. Conversion Funnel Data

```sql
-- Calculate conversion funnel metrics
WITH funnel_data AS (
    SELECT 
        p.vendor_id,
        -- Step 1: Product Views (estimated)
        SUM(
            (COALESCE(search_count, 0) * 3 + 
             COALESCE(cart_count, 0) * 10 + 
             COALESCE(wishlist_count, 0) * 5)
        ) as product_views,
        -- Step 2: Add to Cart
        SUM(COALESCE(cart_count, 0)) as add_to_cart,
        -- Step 3: Checkout Started (orders created)
        SUM(COALESCE(checkout_started, 0)) as checkout_started,
        -- Step 4: Purchased (completed orders)
        SUM(COALESCE(purchased, 0)) as purchased
    FROM products p
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) as cart_count
        FROM cart_items
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
    ) cart_stats ON p.id = cart_stats.product_id
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) as wishlist_count
        FROM wishlist
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
    ) wishlist_stats ON p.id = wishlist_stats.product_id
    LEFT JOIN (
        SELECT 
            p.id as product_id,
            COUNT(*) as search_count
        FROM products p
        JOIN search_analytics sa ON sa.query ILIKE '%' || p.name || '%'
        WHERE sa.timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY p.id
    ) search_stats ON p.id = search_stats.product_id
    LEFT JOIN (
        SELECT 
            oi.product_id,
            COUNT(DISTINCT o.id) as checkout_started
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY oi.product_id
    ) checkout_stats ON p.id = checkout_stats.product_id
    LEFT JOIN (
        SELECT 
            oi.product_id,
            COUNT(DISTINCT o.id) as purchased
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
        GROUP BY oi.product_id
    ) purchase_stats ON p.id = purchase_stats.product_id
    WHERE p.vendor_id = $1
    GROUP BY p.vendor_id
)
SELECT 
    product_views,
    add_to_cart,
    checkout_started,
    purchased,
    -- Calculate percentages
    CASE WHEN product_views > 0 THEN ROUND((add_to_cart::DECIMAL / product_views::DECIMAL) * 100, 1) ELSE 0 END as cart_percentage,
    CASE WHEN product_views > 0 THEN ROUND((checkout_started::DECIMAL / product_views::DECIMAL) * 100, 1) ELSE 0 END as checkout_percentage,
    CASE WHEN product_views > 0 THEN ROUND((purchased::DECIMAL / product_views::DECIMAL) * 100, 1) ELSE 0 END as purchase_percentage
FROM funnel_data;
```

### 6. Product Performance Table

```sql
-- Get detailed product performance metrics
SELECT 
    p.id,
    p.name,
    p.images,
    p.rating,
    p.reviews,
    -- Estimated views
    (
        COALESCE(search_count, 0) * 3 + 
        COALESCE(cart_count, 0) * 10 + 
        COALESCE(wishlist_count, 0) * 5
    ) as estimated_views,
    -- Conversion rate
    CASE 
        WHEN (COALESCE(search_count, 0) * 3 + COALESCE(cart_count, 0) * 10 + COALESCE(wishlist_count, 0) * 5) > 0 
        THEN ROUND((COALESCE(purchase_count, 0)::DECIMAL / (COALESCE(search_count, 0) * 3 + COALESCE(cart_count, 0) * 10 + COALESCE(wishlist_count, 0) * 5)::DECIMAL) * 100, 1)
        ELSE 0 
    END as conversion_rate,
    -- Revenue
    COALESCE(revenue, 0) as revenue,
    -- Orders count
    COALESCE(purchase_count, 0) as orders_count
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) as cart_count
    FROM cart_items
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY product_id
) cart_stats ON p.id = cart_stats.product_id
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) as wishlist_count
    FROM wishlist
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY product_id
) wishlist_stats ON p.id = wishlist_stats.product_id
LEFT JOIN (
    SELECT 
        p.id as product_id,
        COUNT(*) as search_count
    FROM products p
    JOIN search_analytics sa ON sa.query ILIKE '%' || p.name || '%'
    WHERE sa.timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
) search_stats ON p.id = search_stats.product_id
LEFT JOIN (
    SELECT 
        oi.product_id,
        COUNT(*) as purchase_count,
        SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= NOW() - INTERVAL '30 days'
    AND o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
    GROUP BY oi.product_id
) purchase_stats ON p.id = purchase_stats.product_id
WHERE p.vendor_id = $1
ORDER BY revenue DESC NULLS LAST;
```

### 7. Time-based Analytics (Charts)

#### Product Views Over Time
```sql
-- Daily product views for the last 30 days
SELECT 
    DATE(created_at) as date,
    COUNT(*) as views
FROM (
    -- Combine all engagement events as "views"
    SELECT created_at FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id 
    WHERE p.vendor_id = $1
    UNION ALL
    SELECT created_at FROM wishlist w 
    JOIN products p ON w.product_id = p.id 
    WHERE p.vendor_id = $1
    UNION ALL
    SELECT timestamp as created_at FROM search_analytics sa
    JOIN products p ON sa.query ILIKE '%' || p.name || '%'
    WHERE p.vendor_id = $1
) combined_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

#### Conversion Rate by Product Over Time
```sql
-- Weekly conversion rates by product
WITH weekly_stats AS (
    SELECT 
        p.id,
        p.name,
        DATE_TRUNC('week', o.created_at) as week,
        COUNT(DISTINCT o.id) as purchases,
        -- Estimate views for the week
        (
            SELECT COUNT(*) FROM cart_items ci 
            WHERE ci.product_id = p.id 
            AND DATE_TRUNC('week', ci.created_at) = DATE_TRUNC('week', o.created_at)
        ) * 10 as estimated_views
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE p.vendor_id = $1
    AND o.created_at >= NOW() - INTERVAL '12 weeks'
    AND o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
    GROUP BY p.id, p.name, DATE_TRUNC('week', o.created_at)
)
SELECT 
    name,
    week,
    purchases,
    estimated_views,
    CASE 
        WHEN estimated_views > 0 THEN ROUND((purchases::DECIMAL / estimated_views::DECIMAL) * 100, 2)
        ELSE 0 
    END as conversion_rate
FROM weekly_stats
ORDER BY week DESC, conversion_rate DESC;
```

## API Implementation Strategy

### 1. Create Analytics API Endpoint

Create `/api/analytics/route.js`:

```javascript
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d
    const supabase = getSupabaseServer()
    
    if (!vendorId) {
      return Response.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[period] || 30

    // Get all analytics data in parallel
    const [
      viewsData,
      conversionData,
      avgOrderValue,
      returnRate,
      funnelData,
      productPerformance,
      timeSeriesData
    ] = await Promise.all([
      calculateProductViews(supabase, vendorId, days),
      calculateConversionRate(supabase, vendorId, days),
      calculateAvgOrderValue(supabase, vendorId, days),
      calculateReturnRate(supabase, vendorId, days),
      calculateFunnelData(supabase, vendorId, days),
      getProductPerformance(supabase, vendorId, days),
      getTimeSeriesData(supabase, vendorId, days)
    ])

    return Response.json({
      success: true,
      data: {
        overview: {
          productViews: viewsData,
          conversionRate: conversionData,
          avgOrderValue: avgOrderValue,
          returnRate: returnRate
        },
        funnel: funnelData,
        productPerformance: productPerformance,
        timeSeries: timeSeriesData
      }
    })

  } catch (error) {
    console.error('Analytics API Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2. Update Analytics Components

#### Update AnalyticsPageCards.jsx:
```javascript
'use client'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

export default function AnalyticsPageCards() {
  const { vendor } = useAuth()
  
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-overview', vendor?.id],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?vendorId=${vendor?.id}&period=30d`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isLoading) return <LoadingSkeleton />
  
  const overview = analyticsData?.data?.overview || {}
  
  const items = [
    {
      title: "Product Views",
      value: overview.productViews?.current?.toLocaleString() || "0",
      percent: `${overview.productViews?.changePercent || 0}%`,
      // ... rest of config
    },
    // ... other items
  ]
  
  // ... rest of component
}
```

## Performance Considerations

### 1. Database Indexing
```sql
-- Essential indexes for analytics performance
CREATE INDEX CONCURRENTLY idx_orders_vendor_created ON orders(vendor_id, created_at);
CREATE INDEX CONCURRENTLY idx_order_items_product_created ON order_items(product_id, created_at);
CREATE INDEX CONCURRENTLY idx_cart_items_product_created ON cart_items(product_id, created_at);
CREATE INDEX CONCURRENTLY idx_wishlist_product_created ON wishlist(product_id, created_at);
CREATE INDEX CONCURRENTLY idx_search_analytics_timestamp ON search_analytics(timestamp);
CREATE INDEX CONCURRENTLY idx_products_vendor_status ON products(vendor_id, status);
```

### 2. Caching Strategy
- Cache analytics data for 5-15 minutes
- Use React Query for client-side caching
- Consider Redis for server-side caching of expensive queries

### 3. Query Optimization
- Use materialized views for complex aggregations
- Implement pagination for large datasets
- Use EXPLAIN ANALYZE to optimize slow queries

## Missing Data Tracking Implementation

### 1. Product Views Tracking
Add client-side tracking to product pages:

```javascript
// In product detail page
useEffect(() => {
  const trackView = async () => {
    await fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString()
      })
    })
  }
  
  trackView()
}, [product.id])
```

### 2. Return Tracking
Implement return request functionality in orders management.

### 3. Enhanced Search Analytics
Track more detailed search interactions and product impressions.

## Comparison Calculations (Month-over-Month)

```sql
-- Calculate month-over-month changes
WITH current_period AS (
    -- Current month metrics
    SELECT 
        SUM(estimated_views) as views,
        AVG(conversion_rate) as conversion,
        AVG(order_value) as avg_order
    FROM analytics_summary 
    WHERE vendor_id = $1 
    AND created_at >= DATE_TRUNC('month', NOW())
),
previous_period AS (
    -- Previous month metrics
    SELECT 
        SUM(estimated_views) as views,
        AVG(conversion_rate) as conversion,
        AVG(order_value) as avg_order
    FROM analytics_summary 
    WHERE vendor_id = $1 
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW())
)
SELECT 
    c.views as current_views,
    p.views as previous_views,
    CASE 
        WHEN p.views > 0 THEN ROUND(((c.views - p.views)::DECIMAL / p.views::DECIMAL) * 100, 1)
        ELSE 0 
    END as views_change_percent,
    -- Similar calculations for other metrics
FROM current_period c, previous_period p;
```

## Implementation Phases

### Phase 1: Basic Metrics (Week 1)
- Implement product views estimation
- Add conversion rate calculation
- Create basic analytics API endpoint
- Update analytics cards with real data

### Phase 2: Enhanced Tracking (Week 2)
- Add proper product views tracking
- Implement return tracking system
- Create conversion funnel calculations
- Add time-based analytics

### Phase 3: Advanced Features (Week 3)
- Product performance table with real data
- Interactive charts with Chart.js/Recharts
- Advanced filtering and date ranges
- Performance optimizations

### Phase 4: Polish & Optimization (Week 4)
- Add caching layer
- Implement real-time updates
- Add export functionality
- Performance monitoring and optimization

## Testing Strategy

### 1. Data Validation
- Verify calculations against known test data
- Cross-check metrics with actual order records
- Test edge cases (no data, single product, etc.)

### 2. Performance Testing
- Load test analytics endpoints
- Monitor query performance
- Test with large datasets

### 3. User Acceptance Testing
- Validate metrics make business sense
- Test different vendor scenarios
- Ensure data accuracy across time periods

## Conclusion

This implementation guide provides a comprehensive approach to replacing static analytics data with dynamic, real-time metrics from the Supabase database. The key challenges are:

1. **Product Views Tracking**: Currently missing, requires either new tracking or estimation
2. **Return Rate**: Needs return functionality implementation
3. **Performance**: Requires proper indexing and caching
4. **Data Accuracy**: Needs validation and testing

The phased approach ensures gradual implementation while maintaining system stability and allows for iterative improvements based on user feedback and performance monitoring.
