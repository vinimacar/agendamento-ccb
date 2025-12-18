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
  hasRJM?: boolean; // Se a congregação tem RJM (Reunião da Juventude Mocidade)
  diaconName?: string; // Nome reduzido do diácono que atende a congregação
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

export interface ReforcoSchedule {
  id?: string;
  congregationId: string;
  congregationName: string;
  type: 'culto-oficial' | 'rjm'; // Tipo de reforço
  date: Date;
  time: string;
  responsibleName: string; // Nome do responsável
  isFromOutside: boolean; // Se é de fora
  outsideLocation?: string; // Localidade (se for de fora)
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Tipos para lançamento de dados

export interface BatismoData {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  irmaos: number;
  irmas: number;
  elderName?: string; // Nome do ancião que atendeu
  elderFromOtherLocation?: boolean; // Se o ancião é de outra localidade
  otherElderName?: string; // Nome do ancião se for de outra localidade
  tipoBatismo?: 'extra' | 'darpe' | 'agendado'; // Tipo do batismo
  eventId?: string; // ID do evento agendado (se houver)
  createdAt: Date;
  updatedAt: Date;
}

export interface SantaCeiaData {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  irmaos: number;
  irmas: number;
  elderName?: string; // Nome do ancião que atendeu
  elderFromOtherLocation?: boolean; // Se o ancião é de outra localidade
  otherElderName?: string; // Nome do ancião se for de outra localidade
  eventId?: string; // ID do evento agendado (se houver)
  createdAt: Date;
  updatedAt: Date;
}

export interface InstrumentCounts {
  // Madeiras
  clarinete: number;
  clarone: number;
  saxSoprano: number;
  saxAlto: number;
  saxTenor: number;
  saxBaritono: number;
  // Metais
  trompete: number;
  flugelhorn: number;
  euphonio: number;
  trombone: number;
  trombonito: number;
  tuba: number;
  // Cordas
  viola: number;
  violino: number;
  cello: number;
  // Organistas
  organista: number;
}

export interface EnsaioData {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  type: 'regional' | 'local';
  instruments: InstrumentCounts;
  anciao?: string; // Nome do ancião (para ensaio regional)
  encarregadoRegional?: string; // Nome do encarregado regional (para ensaio regional)
  createdAt: Date;
  updatedAt: Date;
}

// Membro de Reunião de Jovens e Menores
export interface RJMMember {
  id?: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  responsible: string; // Nome do responsável
  age: number;
  congregationId: string;
  congregationName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Lançamento de recitativos por reunião
export interface RecitativeData {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  maleCount: number; // Quantidade de recitativos de irmãos
  femaleCount: number; // Quantidade de recitativos de irmãs
  createdAt: Date;
  updatedAt: Date;
}

// Músico/Organista
export interface Musician {
  id?: string;
  name: string;
  congregationId: string;
  congregationName: string;
  city: string;
  phone: string;
  instrument: string; // Nome do instrumento
  stage: 'Ensaio' | 'RJM' | 'Culto Oficial' | 'Oficialização';
  createdAt: Date;
  updatedAt: Date;
}

// DARPE - Setor
export interface DarpeSector {
  id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DARPE - Membro
export interface DarpeMember {
  id?: string;
  name: string;
  congregationId: string;
  congregationName: string;
  city: string;
  role: string; // Cargo/ministério (ancião, cooperador, diácono, etc.)
  contact: string; // Telefone ou email
  sectors: string[]; // IDs dos setores que participa
  createdAt: Date;
  updatedAt: Date;
}

// DARPE - Instituição Atendida
export interface DarpeInstitution {
  id?: string;
  name: string;
  address: string;
  city: string;
  contact: string;
  schedules: EventSchedule[]; // Usa o mesmo formato de EventSchedule para dias de atendimento
  responsibleMembers: string[]; // IDs dos membros responsáveis
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Grupo de Trabalho
export interface EBIWorkGroup {
  id?: string;
  name: string; // Nome do grupo (ex: Berçário, Maternal, Jardim, etc.)
  description?: string;
  ageRange?: string; // Faixa etária (ex: 0-2 anos)
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Membro/Colaborador
export interface EBIMember {
  id?: string;
  name: string;
  congregationId: string;
  congregationName: string;
  contact: string;
  workGroups: string[]; // IDs dos grupos que atende
  role: string; // Função (Professor, Auxiliar, Coordenador, etc.)
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Escala de Atendimento
export interface EBISchedule {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  time: string;
  workGroupId: string;
  workGroupName: string;
  memberIds: string[]; // IDs dos membros escalados
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Atividade
export interface EBIActivity {
  id?: string;
  congregationId: string;
  congregationName: string;
  workGroupId: string;
  workGroupName: string;
  date: Date;
  theme: string; // Tema da atividade
  objective: string; // Objetivo
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Criança
export interface EBIChild {
  id?: string;
  name: string;
  age: number;
  congregationId: string;
  congregationName: string;
  workGroupId: string;
  workGroupName: string;
  responsibleName: string; // Nome do responsável
  responsibleContact: string; // Contato do responsável
  createdAt: Date;
  updatedAt: Date;
}

// EBI - Frequência
export interface EBIAttendance {
  id?: string;
  congregationId: string;
  congregationName: string;
  activityId: string;
  date: Date;
  workGroupId: string;
  workGroupName: string;
  childrenPresent: string[]; // IDs das crianças presentes
  totalPresent: number;
  totalAbsent: number;
  createdAt: Date;
  updatedAt: Date;
}

// Lista Salva
export interface SavedList {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  filterType: string;
  filterCongregation: string;
  avisos: string;
  items: Array<{
    date: Date;
    time?: string;
    type: string;
    congregationName: string;
    city: string;
    details?: string;
    responsavel?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
