import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CustomEventType {
  id: string;
  name: string;
  label: string;
  createdAt: Date;
}

const COLLECTION_NAME = 'customEventTypes';

export const eventTypeService = {
  async getAll(): Promise<CustomEventType[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        label: data.label,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  },

  async create(data: { name: string; label: string }): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: data.name,
      label: data.label,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },
};
