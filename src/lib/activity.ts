import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type ActivityType = "booking" | "notice" | "document" | "message" | "system";
export type ActivityStatus = "success" | "warning" | "info" | "error";

export interface ActivityLog {
  type: ActivityType;
  user: string;
  action: string;
  status: ActivityStatus;
  createdAt: any;
}

export const logActivity = async (
  type: ActivityType,
  user: string,
  action: string,
  status: ActivityStatus = "info"
) => {
  try {
    await addDoc(collection(db, "activities"), {
      type,
      user,
      action,
      status,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
