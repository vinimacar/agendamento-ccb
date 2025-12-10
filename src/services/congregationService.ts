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

export interface PersonEntry {
  name: string;
  isLocal: boolean;
}

export interface RehearsalEntry {
  type: 'Local' | 'Regional' | 'GEM' | 'Geral';
  day: string;
  time: string;
  repeats: boolean;
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
  rehearsals: RehearsalEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'congregations';

export const congregationService = {
  async create(data: Omit<CongregationData, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
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
        rehearsals: data.rehearsals || [],
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
      rehearsals: data.rehearsals || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CongregationData;
  },

  async update(id: string, data: Partial<CongregationData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
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
};
