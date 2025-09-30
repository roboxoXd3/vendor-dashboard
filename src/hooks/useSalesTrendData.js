import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useSalesTrendData(filters = {}) {
  const { vendor } = useAuth();
  
  return useQuery({
    queryKey: ['salesTrend', vendor?.id, filters],
    queryFn: async () => {
      if (!vendor?.id) {
        throw new Error('Vendor ID is required');
      }

      const params = new URLSearchParams({
        vendorId: vendor.id,
        ...filters
      });

      const response = await fetch(`/api/dashboard-stats/sales-trend?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch sales trend data');
      }

      return result;
    },
    enabled: !!vendor?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
