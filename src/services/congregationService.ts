import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EventSchedule } from '@/types';

export interface PersonEntry {
  name: string;
  isLocal: boolean;
}

export interface RehearsalEntry {
  type: 'Local' | 'Regional' | 'GEM' | 'Geral';
  day?: string; // Dia da semana (para ensaios recorrentes)
  date?: Date; // Data específica (para ensaios pontuais)
  time: string;
  repeats: boolean; // Se repete semanalmente
  months?: number[]; // Meses em que o ensaio ocorre (1-12)
  recurrenceType: 'Semanal' | 'Mensal' | 'Agendado'; // Tipo de recorrência
  weekOfMonth?: number; // Semana do mês (1-5) - apenas para ensaios mensais
}

export interface CongregationData {
  id?: string;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  admin: string;
  regional: string;
  elders: PersonEntry[];
  officeCooperators: PersonEntry[];
  youthCooperators: PersonEntry[];
  deacons: PersonEntry[];
  regionalSupervisor: PersonEntry;
  localSupervisor: string;
  examiner: PersonEntry;
  worshipDays: string[];
  rjmDays: string[];
  schedules?: EventSchedule[];
  hasEBI?: boolean;
  ebiSchedules?: Array<{ day: string; time: string }>;
  hasRJM?: boolean;
  diaconName?: string;
  rehearsals: RehearsalEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'congregations';

export const congregationService = {
  async create(data: Omit<CongregationData, 'id'>): Promise<string> {
    // Remove undefined values to avoid Firestore errors
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Converter dates em rehearsals para Timestamp e remover campos undefined
    if (cleanData.rehearsals) {
      cleanData.rehearsals = cleanData.rehearsals.map((r: any) => {
        const cleanRehearsal = Object.entries(r).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        return {
          ...cleanRehearsal,
          date: cleanRehearsal.date instanceof Date ? Timestamp.fromDate(cleanRehearsal.date) : cleanRehearsal.date,
        };
      });
    }
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cleanData,
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
    return docRef.id;
  },

  async getAll(): Promise<CongregationData[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        street: data.street || '',
        number: data.number || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        admin: data.admin || '',
        regional: data.regional || '',
        elders: data.elders || [],
        officeCooperators: data.officeCooperators || [],
        youthCooperators: data.youthCooperators || [],
        deacons: data.deacons || [],
        regionalSupervisor: data.regionalSupervisor || { name: '', isLocal: true },
        localSupervisor: data.localSupervisor || '',
        examiner: data.examiner || { name: '', isLocal: true },
        worshipDays: data.worshipDays || [],
        rjmDays: data.rjmDays || [],
        schedules: data.schedules || [],
        hasEBI: data.hasEBI || false,
        ebiSchedules: data.ebiSchedules || [],
        rehearsals: (data.rehearsals || []).map((r: any) => ({
          ...r,
          date: r.date?.toDate ? r.date.toDate() : r.date,
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CongregationData;
    });
  },

  async getById(id: string): Promise<CongregationData | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      street: data.street || '',
      number: data.number || '',
      neighborhood: data.neighborhood || '',
      city: data.city || '',
      state: data.state || '',
      admin: data.admin || '',
      regional: data.regional || '',
      elders: data.elders || [],
      officeCooperators: data.officeCooperators || [],
      youthCooperators: data.youthCooperators || [],
      deacons: data.deacons || [],
      regionalSupervisor: data.regionalSupervisor || { name: '', isLocal: true },
      localSupervisor: data.localSupervisor || '',
      examiner: data.examiner || { name: '', isLocal: true },
      worshipDays: data.worshipDays || [],
      rjmDays: data.rjmDays || [],
      schedules: data.schedules || [],
      hasEBI: data.hasEBI || false,
      ebiSchedules: data.ebiSchedules || [],
      rehearsals: (data.rehearsals || []).map((r: any) => ({
        ...r,
        date: r.date?.toDate ? r.date.toDate() : r.date,
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CongregationData;
  },

  async update(id: string, data: Partial<CongregationData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Remove undefined values to avoid Firestore errors
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Converter dates em rehearsals para Timestamp e remover campos undefined
    if (cleanData.rehearsals) {
      cleanData.rehearsals = cleanData.rehearsals.map((r: any) => {
        const cleanRehearsal = Object.entries(r).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        return {
          ...cleanRehearsal,
          date: cleanRehearsal.date instanceof Date ? Timestamp.fromDate(cleanRehearsal.date) : cleanRehearsal.date,
        };
      });
    }
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async getNonLocalElders(): Promise<string[]> {
    const congregations = await this.getAll();
    const eldersSet = new Set<string>();
    
    congregations.forEach(congregation => {
      congregation.elders?.forEach(elder => {
        if (!elder.isLocal && elder.name.trim()) {
          eldersSet.add(elder.name.trim());
        }
      });
    });
    
    return Array.from(eldersSet).sort();
  },

  async getNonLocalDeacons(): Promise<string[]> {
    const congregations = await this.getAll();
    const deaconsSet = new Set<string>();
    
    congregations.forEach(congregation => {
      congregation.deacons?.forEach(deacon => {
        if (!deacon.isLocal && deacon.name.trim()) {
          deaconsSet.add(deacon.name.trim());
        }
      });
    });
    
    return Array.from(deaconsSet).sort();
  },

  async getAllMinisters(): Promise<{ elders: string[], cooperators: string[], deacons: string[], youthCooperators: string[] }> {
    const congregations = await this.getAll();
    const eldersSet = new Set<string>();
    const cooperatorsSet = new Set<string>();
    const deaconsSet = new Set<string>();
    const youthCooperatorsSet = new Set<string>();
    
    congregations.forEach(congregation => {
      congregation.elders?.forEach(elder => {
        if (elder.name.trim()) {
          eldersSet.add(elder.name.trim());
        }
      });
      congregation.officeCooperators?.forEach(cooperator => {
        if (cooperator.name.trim()) {
          cooperatorsSet.add(cooperator.name.trim());
        }
      });
      congregation.deacons?.forEach(deacon => {
        if (deacon.name.trim()) {
          deaconsSet.add(deacon.name.trim());
        }
      });
      congregation.youthCooperators?.forEach(youthCooperator => {
        if (youthCooperator.name.trim()) {
          youthCooperatorsSet.add(youthCooperator.name.trim());
        }
      });
    });
    
    return {
      elders: Array.from(eldersSet).sort(),
      cooperators: Array.from(cooperatorsSet).sort(),
      deacons: Array.from(deaconsSet).sort(),
      youthCooperators: Array.from(youthCooperatorsSet).sort(),
    };
  },
};
