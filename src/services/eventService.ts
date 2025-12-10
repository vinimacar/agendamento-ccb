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
import { Event } from '@/types';

const COLLECTION_NAME = 'events';

export const eventService = {
  async create(event: Omit<Event, 'id' | 'createdAt'>): Promise<string> {
    // Remove campos undefined (Firestore não aceita undefined)
    const cleanedEvent = Object.fromEntries(
      Object.entries(event).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cleanedEvent,
      date: Timestamp.fromDate(event.date instanceof Date ? event.date : new Date(event.date)),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(): Promise<Event[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Event[];
  },

  async getById(id: string): Promise<Event | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Event;
  },

  async update(id: string, event: Partial<Omit<Event, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Remove campos undefined (Firestore não aceita undefined)
    const cleanedEvent = Object.fromEntries(
      Object.entries(event).filter(([_, value]) => value !== undefined)
    );
    
    const updateData: any = { ...cleanedEvent };
    if (event.date) {
      updateData.date = Timestamp.fromDate(event.date instanceof Date ? event.date : new Date(event.date));
    }
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};
