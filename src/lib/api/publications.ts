import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PublicationCategory = "samayik" | "magazine" | "other";

export interface Publication {
  id: string;
  name: string;
  category: PublicationCategory;
  year?: string; // required only when category === "samayik"
  fileUrl: string; // always a URL (direct link or Cloudinary)
  createdAt: Timestamp;
}

/** Shape accepted when creating / updating (omit id & createdAt). */
export type PublicationInput = Omit<Publication, "id" | "createdAt">;

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Fetch all publications, ordered by createdAt descending.
 */
export const getPublications = async (): Promise<Publication[]> => {
  try {
    const ref = collection(db, "publications");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Publication[];
  } catch (error) {
    // Fallback: try without ordering (index may not exist yet)
    const snap = await getDocs(collection(db, "publications"));
    console.error("getPublications:", error);
    const snap2 = await getDocs(collection(db, "publications"));
    const data = snap2.docs.map((d) => ({ id: d.id, ...d.data() })) as Publication[];
    return data.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }
};

/**
 * Create a new publication document in Firestore.
 * Returns the newly created document id.
 */
export const createPublication = async (data: PublicationInput): Promise<string> => {
  const ref = await addDoc(collection(db, "publications"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Update an existing publication document.
 */
export const updatePublication = async (
  id: string,
  data: Partial<PublicationInput>
): Promise<void> => {
  await updateDoc(doc(db, "publications", id), data as Record<string, unknown>);
};

/**
 * Delete a publication document from Firestore.
 * (Does NOT remove the file from Cloudinary.)
 */
export const deletePublication = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "publications", id));
};
