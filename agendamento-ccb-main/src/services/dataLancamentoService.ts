export interface EnsaioData {
  id?: string;
  type: 'local' | 'regional' | 'gem' | 'geral' | 'darpe';
  date: Date;
  congregationId: string;
  congregationName: string;
  city: string;
  anciao?: string;
  encarregado?: string;
  instrumentos?: Record<string, number>;
}

class EnsaioDataService {
  private ensaios: EnsaioData[] = [];

  async getAll(): Promise<EnsaioData[]> {
    return this.ensaios;
  }

  async getById(id: string): Promise<EnsaioData | undefined> {
    return this.ensaios.find(e => e.id === id);
  }

  async create(ensaio: EnsaioData): Promise<EnsaioData> {
    const newEnsaio = { ...ensaio, id: Date.now().toString() };
    this.ensaios.push(newEnsaio);
    return newEnsaio;
  }

  async update(id: string, ensaio: EnsaioData): Promise<EnsaioData> {
    const index = this.ensaios.findIndex(e => e.id === id);
    if (index !== -1) {
      this.ensaios[index] = { ...ensaio, id };
      return this.ensaios[index];
    }
    throw new Error('Ensaio not found');
  }

  async delete(id: string): Promise<void> {
    this.ensaios = this.ensaios.filter(e => e.id !== id);
  }

  async getByYear(year: number): Promise<EnsaioData[]> {
    return this.ensaios.filter(e => e.date.getFullYear() === year);
  }

  async getByCongregation(congregationId: string): Promise<EnsaioData[]> {
    return this.ensaios.filter(e => e.congregationId === congregationId);
  }
}

export const ensaioDataService = new EnsaioDataService();
