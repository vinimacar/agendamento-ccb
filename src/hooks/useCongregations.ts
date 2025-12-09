import { useState, useEffect } from 'react';
import { congregationService, CongregationData } from '@/services/congregationService';

export function useCongregations() {
  const [congregations, setCongregations] = useState<CongregationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCongregations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await congregationService.getAll();
      setCongregations(data);
    } catch (err) {
      console.error('Error fetching congregations:', err);
      setError('Erro ao carregar congregações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCongregations();
  }, []);

  const deleteCongregation = async (id: string) => {
    try {
      await congregationService.delete(id);
      setCongregations((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting congregation:', err);
      throw err;
    }
  };

  return {
    congregations,
    loading,
    error,
    refetch: fetchCongregations,
    deleteCongregation,
  };
}
