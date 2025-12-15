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
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ReforcoSchedule } from '@/types';

const COLLECTION_NAME = 'reforco-schedules';

export const reforcoService = {
  async create(data: Omit<ReforcoSchedule, 'id'>): Promise<string> {
    // Remove undefined values to avoid Firestore errors
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cleanData,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
    return docRef.id;
  },

  async getAll(): Promise<ReforcoSchedule[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        type: data.type || 'culto-oficial',
        date: data.date?.toDate() || new Date(),
        time: data.time || '',
        responsibleName: data.responsibleName || '',
        isFromOutside: data.isFromOutside || false,
        outsideLocation: data.outsideLocation,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ReforcoSchedule;
    });
  },

  async getByMonth(year: number, month: number): Promise<ReforcoSchedule[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const q = query(
      collection(db, COLLECTION_NAME),
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
        type: data.type || 'culto-oficial',
        date: data.date?.toDate() || new Date(),
        time: data.time || '',
        responsibleName: data.responsibleName || '',
        isFromOutside: data.isFromOutside || false,
        outsideLocation: data.outsideLocation,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ReforcoSchedule;
    });
  },

  async getByCongregationAndMonth(congregationId: string, year: number, month: number): Promise<ReforcoSchedule[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('congregationId', '==', congregationId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        congregationId: data.congregationId || '',
        congregationName: data.congregationName || '',
        type: data.type || 'culto-oficial',
        date: data.date?.toDate() || new Date(),
        time: data.time || '',
        responsibleName: data.responsibleName || '',
        isFromOutside: data.isFromOutside || false,
        outsideLocation: data.outsideLocation,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ReforcoSchedule;
    });
  },

  async getById(id: string): Promise<ReforcoSchedule | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      congregationId: data.congregationId || '',
      congregationName: data.congregationName || '',
      type: data.type || 'culto-oficial',
      date: data.date?.toDate() || new Date(),
      time: data.time || '',
      responsibleName: data.responsibleName || '',
      isFromOutside: data.isFromOutside || false,
      outsideLocation: data.outsideLocation,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ReforcoSchedule;
  },

  async update(id: string, data: Partial<ReforcoSchedule>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Remove undefined values to avoid Firestore errors
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};
