import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SavedList } from '@/types';

const COLLECTION_NAME = 'saved-lists';

const savedListConverter = {
  toFirestore: (list: SavedList) => {
    const data: Record<string, unknown> = {
      title: list.title,
      startDate: list.startDate || '',
      endDate: list.endDate || '',
      avisos: list.avisos || '',
      items: list.items.map(item => {
        // Remove undefined values from items
        const cleanItem: Record<string, unknown> = {
          date: Timestamp.fromDate(item.date),
          type: item.type,
          congregationName: item.congregationName,
          city: item.city,
        };
        
        if (item.time !== undefined && item.time !== null) {
          cleanItem.time = item.time;
        }
        if (item.details !== undefined && item.details !== null) {
          cleanItem.details = item.details;
        }
        if (item.responsavel !== undefined && item.responsavel !== null) {
          cleanItem.responsavel = item.responsavel;
        }
        
        return cleanItem;
      }),
      createdAt: list.createdAt ? Timestamp.fromDate(list.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Only add optional fields if they have values and are not 'all' (default filter value)
    if (list.filterType && list.filterType !== 'all') {
      data.filterType = list.filterType;
    }
    if (list.filterCongregation && list.filterCongregation !== 'all') {
      data.filterCongregation = list.filterCongregation;
    }
    if (list.avisosMinisterio) {
      data.avisosMinisterio = list.avisosMinisterio;
    }
    
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>): SavedList => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      filterType: data.filterType,
      filterCongregation: data.filterCongregation,
      avisos: data.avisos || '',
      avisosMinisterio: data.avisosMinisterio || '',
      items: data.items.map((item: { date: { toDate: () => Date }; [key: string]: unknown }) => ({
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
    const updateData: Record<string, unknown> = { ...list, updatedAt: Timestamp.now() };
    
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
