import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const STORAGE_KEY = 'saccoName';
const FALLBACK = 'MatatuConnect';

export function useSaccoName() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['sacco', 'settings'],
    queryFn: async () => {
      const result = await api.admin.getSettings();
      const name = result?.sacco_name || FALLBACK;
      localStorage.setItem(STORAGE_KEY, name);
      return name;
    },
    // Use localStorage as initial data while fetching
    initialData: () => localStorage.getItem(STORAGE_KEY) || FALLBACK,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sacco', 'settings'] });

  return { saccoName: data || FALLBACK, invalidateSaccoName: invalidate };
}
