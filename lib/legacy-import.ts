import { collection, doc, getDoc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Before accounts existed, everything lived in top-level collections
// (classes, schedule/main, planner/week, noSchoolDays) shared by the one
// person using the app. These helpers copy that data into a signed-in
// user's own space (users/{uid}/...). The old copy is left untouched.
//
// Once the Firestore rules from firestore.rules are published, those old
// top-level paths can't be read anymore, so hasLegacyData() just returns
// false and the import option disappears.

export async function hasLegacyData(): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDocs(query(collection(db, "classes"), limit(1)));
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function importLegacyData(uid: string): Promise<{ classes: number; daysOff: number }> {
  if (!db) throw new Error("Firebase isn't configured.");
  const [classesSnap, scheduleSnap, plannerSnap, daysOffSnap] = await Promise.all([
    getDocs(collection(db, "classes")),
    getDoc(doc(db, "schedule", "main")),
    getDoc(doc(db, "planner", "week")),
    getDocs(collection(db, "noSchoolDays")),
  ]);

  const batch = writeBatch(db);
  classesSnap.docs.forEach((d) => batch.set(doc(db!, "users", uid, "classes", d.id), d.data()));
  if (scheduleSnap.exists()) batch.set(doc(db, "users", uid, "schedule", "main"), scheduleSnap.data());
  if (plannerSnap.exists()) batch.set(doc(db, "users", uid, "planner", "week"), plannerSnap.data());
  daysOffSnap.docs.forEach((d) => batch.set(doc(db!, "users", uid, "noSchoolDays", d.id), d.data()));
  await batch.commit();

  return { classes: classesSnap.size, daysOff: daysOffSnap.size };
}
