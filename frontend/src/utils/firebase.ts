import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  getDocs,
  onSnapshot, 
  Firestore,
  Unsubscribe
} from 'firebase/firestore';


let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const DEFAULT_FIREBASE_STORAGE_KEY = 'paarakhmetric_firebase_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDsoMG_h0zqdQ7z34JmxZypCwlCEdkd_6U",
  authDomain: "paarakhmetric.firebaseapp.com",
  projectId: "paarakhmetric",
  storageBucket: "paarakhmetric.firebasestorage.app",
  messagingSenderId: "67374134757",
  appId: "1:67374134757:web:10e31e39b6631f62ffeb0c",
  measurementId: "G-S5GJDTKYSC"
};

export function getStoredFirebaseConfig(): any {
  try {
    const raw = localStorage.getItem(DEFAULT_FIREBASE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return DEFAULT_FIREBASE_CONFIG;
}


export function saveStoredFirebaseConfig(config: any): void {
  try {
    localStorage.setItem(DEFAULT_FIREBASE_STORAGE_KEY, JSON.stringify(config));
    initFirebase(config);
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
  }
}

export function initFirebase(config?: any): boolean {
  try {
    const activeConfig = config || getStoredFirebaseConfig();
    if (!activeConfig || !activeConfig.apiKey || !activeConfig.projectId) {
      return false;
    }

    if (!getApps().length) {
      app = initializeApp(activeConfig);
    } else {
      app = getApp();
    }

    db = getFirestore(app);
    return true;
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    return false;
  }
}

export function isFirebaseConfigured(): boolean {
  if (db) return true;
  return initFirebase();
}

/**
 * Real-time continuous listener for inspections across all connected devices.
 * Updates state within < 250ms when any phone or laptop creates, edits, or deletes a scan.
 */
export function subscribeToInspections(onUpdate: (inspections: any[]) => void): Unsubscribe | null {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const inspectionsCol = collection(db, 'inspections');
    const unsub = onSnapshot(inspectionsCol, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          id: String(data.id || docSnap.id)
        });
      });
      // Sort newest first
      list.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      onUpdate(list);
    }, (error) => {
      console.warn('Firestore subscription notice:', error);
    });
    return unsub;
  } catch (e) {
    console.warn('Firestore subscription error:', e);
    return null;
  }
}


/**
 * Deeply sanitizes an object for Firestore by removing undefined properties
 * and converting invalid values so setDoc never throws an error.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
}

/**
 * Saves or updates an inspection document in Firestore.
 */
export async function saveInspectionToFirebase(inspection: any): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const strId = String(inspection.id);
    const docRef = doc(db, 'inspections', strId);
    const payload = sanitizeForFirestore({
      ...inspection,
      id: strId,
      updated_at: new Date().toISOString()
    });

    await setDoc(docRef, payload, { merge: true });
    return true;

  } catch (err) {
    console.error('Firestore save error:', err);
    return false;
  }
}


/**
 * Deletes an inspection document from Firestore across all devices.
 */
export async function deleteInspectionFromFirebase(id: string | number): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const strId = String(id);
    const docRef = doc(db, 'inspections', strId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Firestore delete error:', err);
    return false;
  }
}

/**
 * Fetches all inspection documents directly from Firestore.
 */
export async function getAllInspectionsFromFirebase(): Promise<any[]> {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const inspectionsCol = collection(db, 'inspections');
    const snapshot = await getDocs(inspectionsCol);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: String(data.id || docSnap.id)
      });
    });
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return list;
  } catch (err) {
    console.warn('Firestore fetch error:', err);
    return [];
  }
}

/**
 * Permanently clears all inspection documents from Firestore across all devices.
 */
export async function clearAllInspectionsFromFirebase(): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const inspectionsCol = collection(db, 'inspections');
    const snapshot = await getDocs(inspectionsCol);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'inspections', docSnap.id));
    }
  } catch (err) {
    console.warn('Firestore clear error:', err);
  }
}

/**
 * Saves or updates an officer profile in Firestore across all devices.
 */
export async function saveUserProfileToFirebase(userData: any): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  try {
    const username = (userData.username || '').toLowerCase().trim();
    if (!username) return false;

    const userDocRef = doc(db, 'users', username);
    const payload: Record<string, any> = {
      username,
      name: userData.name || userData.full_name || '',
      full_name: userData.name || userData.full_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      jurisdiction: userData.jurisdiction || userData.region || '',
      region: userData.region || userData.jurisdiction || '',
      role: userData.role || 'officer',
      designation: userData.designation || 'Legal Metrology Officer',
      badge_number: userData.badge_number || '',
      updated_at: new Date().toISOString()
    };

    if (userData.password) {
      payload.password = userData.password;
    }

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore saveUserProfile error:', err);
    return false;
  }
}

/**
 * Fetches an officer profile from Firestore.
 */
export async function getUserProfileFromFirebase(username: string): Promise<any | null> {
  if (!isFirebaseConfigured() || !db) return null;
  try {
    const cleanUsername = (username || '').toLowerCase().trim();
    if (!cleanUsername) return null;

    const userDocRef = doc(db, 'users', cleanUsername);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('Firestore getUserProfile error:', err);
    return null;
  }
}

/**
 * Real-time continuous listener for officer profile changes across all devices.
 */
export function subscribeToUserProfile(username: string, onUpdate: (user: any) => void): Unsubscribe | null {
  if (!isFirebaseConfigured() || !db) return null;
  try {
    const cleanUsername = (username || '').toLowerCase().trim();
    if (!cleanUsername) return null;

    const userDocRef = doc(db, 'users', cleanUsername);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          ...data,
          name: data.full_name || data.name || data.username
        });
      }
    }, (err) => {
      console.warn('Firestore user subscription notice:', err);
    });
    return unsub;
  } catch (err) {
    console.warn('Firestore user subscription error:', err);
    return null;
  }
}



