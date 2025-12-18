import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SavedList } from '@/types';

const COLLECTION_NAME = 'saved-lists';

const savedListConverter = {
  toFirestore: (list: SavedList) => {
    return {
      title: list.title,
      startDate: list.startDate,
      endDate: list.endDate,
      filterType: list.filterType,
      filterCongregation: list.filterCongregation,
      avisos: list.avisos,
      items: list.items.map(item => ({
        ...item,
        date: Timestamp.fromDate(item.date),
      })),
      createdAt: list.createdAt ? Timestamp.fromDate(list.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any): SavedList => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      filterType: data.filterType,
      filterCongregation: data.filterCongregation,
      avisos: data.avisos || '',
      items: data.items.map((item: any) => ({
        ...item,
        date: item.date.toDate(),
      })),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  },
};

export const savedListService = {
  async create(list: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const listData = {
      ...list,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), savedListConverter.toFirestore(listData as SavedList));
    return docRef.id;
  },

  async getAll(): Promise<SavedList[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => savedListConverter.fromFirestore(doc));
  },

  async update(id: string, list: Partial<SavedList>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...list, updatedAt: Timestamp.now() };
    
    if (list.items) {
      updateData.items = list.items.map(item => ({
        ...item,
        date: Timestamp.fromDate(item.date),
      }));
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },
};
