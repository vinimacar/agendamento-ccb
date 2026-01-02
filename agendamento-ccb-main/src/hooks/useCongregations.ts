import { useState, useEffect } from 'react';

export interface Congregation {
  id?: string;
  name: string;
  city: string;
  state?: string;
  rehearsals?: Array<{
    type: string;
    time: string;
    day?: string;
  }>;
}

// Mock data - replace with actual API call
const mockCongregations: Congregation[] = [
  {
    id: '1',
    name: 'Congregação Central',
    city: 'São Paulo',
    state: 'SP',
    rehearsals: [
      { type: 'local', time: '19h30', day: 'Terça' },
      { type: 'regional', time: '09h00', day: 'Sábado' }
    ]
  }
];

export const useCongregations = () => {
  const [congregations, setCongregations] = useState<Congregation[]>(mockCongregations);
  const [loading, setLoading] = useState(false);

  const addCongregation = async (congregation: Congregation) => {
    setCongregations([...congregations, { ...congregation, id: Date.now().toString() }]);
  };

  const updateCongregation = async (id: string, congregation: Congregation) => {
    setCongregations(congregations.map(c => c.id === id ? { ...congregation, id } : c));
  };

  const deleteCongregation = async (id: string) => {
    setCongregations(congregations.filter(c => c.id !== id));
  };

  return {
    congregations,
    loading,
    addCongregation,
    updateCongregation,
    deleteCongregation,
  };
};
