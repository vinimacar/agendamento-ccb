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
