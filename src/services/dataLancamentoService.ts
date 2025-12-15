import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BatismoData, SantaCeiaData, EnsaioData } from '@/types';

// Batismos
export const batismoDataService = {
  async create(data: Omit<BatismoData, 'id'>): Promise<string> {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const docRef = await addDoc(collection(db, 'batismo-data'), {
      ...cleanData,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
    return docRef.id;
  },

  async getAll(): Promise<BatismoData[]> {
    const q = query(collection(db, 'batismo-data'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        irmaos: data.irmaos || 0,
        irmas: data.irmas || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BatismoData;
    });
  },

  async getByYear(year: number): Promise<BatismoData[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const q = query(
      collection(db, 'batismo-data'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        irmaos: data.irmaos || 0,
        irmas: data.irmas || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BatismoData;
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'batismo-data', id);
    await deleteDoc(docRef);
  },
};

// Santa Ceia
export const santaCeiaDataService = {
  async create(data: Omit<SantaCeiaData, 'id'>): Promise<string> {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const docRef = await addDoc(collection(db, 'santa-ceia-data'), {
      ...cleanData,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
    return docRef.id;
  },

  async getAll(): Promise<SantaCeiaData[]> {
    const q = query(collection(db, 'santa-ceia-data'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        irmaos: data.irmaos || 0,
        irmas: data.irmas || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SantaCeiaData;
    });
  },

  async getByYear(year: number): Promise<SantaCeiaData[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const q = query(
      collection(db, 'santa-ceia-data'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        irmaos: data.irmaos || 0,
        irmas: data.irmas || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SantaCeiaData;
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'santa-ceia-data', id);
    await deleteDoc(docRef);
  },
};

// Ensaios
export const ensaioDataService = {
  async create(data: Omit<EnsaioData, 'id'>): Promise<string> {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const docRef = await addDoc(collection(db, 'ensaio-data'), {
      ...cleanData,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
    return docRef.id;
  },

  async getAll(): Promise<EnsaioData[]> {
    const q = query(collection(db, 'ensaio-data'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        type: data.type || 'local',
        instruments: data.instruments || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EnsaioData;
    });
  },

  async getByYear(year: number): Promise<EnsaioData[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const q = query(
      collection(db, 'ensaio-data'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        date: data.date?.toDate() || new Date(),
        type: data.type || 'local',
        instruments: data.instruments || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EnsaioData;
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'ensaio-data', id);
    await deleteDoc(docRef);
  },
};
