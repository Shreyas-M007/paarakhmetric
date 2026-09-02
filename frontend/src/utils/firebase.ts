import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot, 
  Firestore,
  Unsubscribe
} from 'firebase/firestore';

import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

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
    try {
      storage = getStorage(app);
    } catch {
      storage = null;
    }
    console.log('⚡ Firebase Firestore Database connected successfully.');
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
 * Uploads a packaging photo to Firebase Storage and returns permanent Google CDN URL.
 */
export async function uploadInspectionPhotoToFirebase(
  inspectionId: string | number,
  base64OrBlobUrl: string,
  panelSide: string = 'front'
): Promise<string | null> {
  if (!isFirebaseConfigured() || !storage) return null;
  if (!base64OrBlobUrl || !base64OrBlobUrl.startsWith('data:')) return base64OrBlobUrl;

  try {
    const storageRef = ref(storage, `inspections/${inspectionId}/${panelSide}_${Date.now()}.jpg`);
    await uploadString(storageRef, base64OrBlobUrl, 'data_url');
    const cdnUrl = await getDownloadURL(storageRef);
    return cdnUrl;
  } catch (err) {
    console.warn('Firebase Storage upload error:', err);
    return null;
  }
}

/**
 * Saves or updates an inspection document in Firestore.
 */
export async function saveInspectionToFirebase(inspection: any): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const strId = String(inspection.id);
    const docRef = doc(db, 'inspections', strId);

    // If there is an unsynced base64 image, upload it to Google CDN Storage first
    let finalImageUrl = inspection.image_url;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      const cdnUrl = await uploadInspectionPhotoToFirebase(strId, finalImageUrl, 'front');
      if (cdnUrl) finalImageUrl = cdnUrl;
    }

    const payload = {
      ...inspection,
      id: strId,
      image_url: finalImageUrl,
      updated_at: new Date().toISOString()
    };

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


