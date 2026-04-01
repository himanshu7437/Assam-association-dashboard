import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

export interface Album {
  id: string;
  title: string;
  coverImage: string;
  itemCount: number;
  date: string;
  media: MediaItem[];
  createdAt?: Timestamp;
}

export interface MembershipSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  membershipType?: string;
  occupation?: string;
  status?: string;
  createdAt: Timestamp;
}

export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status?: string;
  createdAt: Timestamp;
}

/**
 * Fetch all gallery albums from Firestore
 */
export const getAlbums = async (): Promise<Album[]> => {
  try {
    const albumsRef = collection(db, "albums");
    const q = query(albumsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Album[];
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all membership submissions from Firestore
 */
export const getMemberships = async (): Promise<MembershipSubmission[]> => {
  try {
    const membershipsRef = collection(db, "membership_applications");
    const querySnapshot = await getDocs(membershipsRef);
    
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MembershipSubmission[];

    // Sort in-memory to handle potential missing createdAt fields
    return data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all contact submissions from Firestore
 */
export const getContacts = async (): Promise<ContactSubmission[]> => {
  try {
    const contactsRef = collection(db, "contacts");
    const querySnapshot = await getDocs(contactsRef);
    
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContactSubmission[];

    // Sort in-memory
    return data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a document from a collection
 */
export const deleteDashboardItem = async (collectionName: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    throw error;
  }
};
