export interface Musician {
  id?: string;
  name: string;
  congregationId: string;
  congregationName: string;
  city: string;
  phone: string;
  instrument: string;
  stage: string;
}

class MusicianService {
  private musicians: Musician[] = [];

  async getAll(): Promise<Musician[]> {
    return this.musicians;
  }

  async getById(id: string): Promise<Musician | undefined> {
    return this.musicians.find(m => m.id === id);
  }

  async create(musician: Musician): Promise<Musician> {
    const newMusician = { ...musician, id: Date.now().toString() };
    this.musicians.push(newMusician);
    return newMusician;
  }

  async update(id: string, musician: Musician): Promise<Musician> {
    const index = this.musicians.findIndex(m => m.id === id);
    if (index !== -1) {
      this.musicians[index] = { ...musician, id };
      return this.musicians[index];
    }
    throw new Error('Musician not found');
  }

  async delete(id: string): Promise<void> {
    this.musicians = this.musicians.filter(m => m.id !== id);
  }

  async bulkCreate(musicians: Musician[]): Promise<Musician[]> {
    const newMusicians = musicians.map(m => ({ ...m, id: Date.now().toString() + Math.random() }));
    this.musicians.push(...newMusicians);
    return newMusicians;
  }
}

export const musicianService = new MusicianService();
