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
  hasEBI?: boolean; // Se a congregação tem EBI (Espaço Bíblico Infantil)
  ebiSchedules?: EBISchedule[]; // Horários do EBI
  regionalSupervisor: string;
  localSupervisor: string;
  examiner: string;
  rehearsals: Rehearsal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Rehearsal {
  type: 'Local' | 'Regional' | 'GEM' | 'Geral';
  day?: string; // Dia da semana (para ensaios recorrentes)
  date?: Date; // Data específica (para ensaios pontuais)
  time: string;
  repeats: boolean; // Se repete semanalmente
}

export interface EventSchedule {
  day: string; // Dia da semana
  time: string; // Horário
  type: 'culto' | 'rjm'; // Tipo de reunião
  hasSpecialRule: boolean; // Se tem regra especial
  weekOfMonth?: string[]; // Semanas do mês (pode ser múltiplas: ['1', '2'] para 1ª e 2ª semanas)
}

export interface EBISchedule {
  day: string; // Dia da semana
  time: string; // Horário
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
