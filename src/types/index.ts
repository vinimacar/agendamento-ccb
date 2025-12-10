export interface Congregation {
  id: string;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  admin: string;
  regional: string;
  localElders: string[];
  officeCooperators: string[];
  youthCooperators: string[];
  deacons: string[];
  worshipDays: string[]; // Deprecated - manter para compatibilidade
  rjmDays: string[]; // Deprecated - manter para compatibilidade
  schedules?: EventSchedule[]; // Horários de cultos e RJM com regras especiais
  regionalSupervisor: string;
  localSupervisor: string;
  examiner: string;
  rehearsals: Rehearsal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Rehearsal {
  type: 'Local' | 'Regional' | 'GEM' | 'Geral';
  day: string;
  time: string;
  repeats: boolean;
}

export interface EventSchedule {
  day: string; // Dia da semana
  time: string; // Horário
  type: 'culto' | 'rjm'; // Tipo de reunião
  hasSpecialRule: boolean; // Se tem regra especial
  weekOfMonth?: '1' | '2' | '3' | '4'; // Semana do mês (1º, 2º, 3º, 4º)
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time: string;
  congregationId?: string;
  congregationName?: string;
  elderName?: string;
  elderFromOtherLocation?: boolean;
  otherElderName?: string;
  ministerRole?: 'elder' | 'cooperator' | 'deacon' | 'youth-cooperator'; // Tipo de ministro
  description?: string;
  irmaos?: number;
  irmas?: number;
  createdAt: Date;
}

export type EventType = 
  | 'culto-busca-dons'
  | 'culto-jovens'
  | 'reuniao-mocidade'
  | 'batismo'
  | 'santa-ceia'
  | 'ordenacao'
  | 'reuniao-ministerial'
  | 'culto-oficial-reforco'
  | 'rjm-reforco';

export const eventTypeLabels: Record<EventType, string> = {
  'culto-busca-dons': 'Culto para Busca dos Dons',
  'culto-jovens': 'Culto para Jovens',
  'reuniao-mocidade': 'Reunião para Mocidade',
  'batismo': 'Batismo',
  'santa-ceia': 'Santa Ceia',
  'ordenacao': 'Ordenação',
  'reuniao-ministerial': 'Reunião Ministerial',
  'culto-oficial-reforco': 'Culto Oficial para Reforço de Coletas',
  'rjm-reforco': 'RJM para Reforço de Coletas',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
