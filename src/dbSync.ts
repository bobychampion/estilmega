import { db, handleFirestoreError, OperationType, testConnection } from "./firebase";
export { testConnection };
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, writeBatch } from "firebase/firestore";
import { Album, Photo, Settings, PhotobookOrder } from "./types";
import { mockSettings, mockAlbums, mockPhotos } from "./mockData";

// Firestore collection names
const SETTINGS_COLLECTION = "settings";
const ALBUMS_COLLECTION = "albums";
const PHOTOS_COLLECTION = "photos";
const ORDERS_COLLECTION = "orders";

// Singular document ID for settings
const SETTINGS_DOC_ID = "studio";

/**
 * Loads all data from Firestore and synchronizes with localStorage.
 * If Firestore is empty (first-time setup), seeds default mock data to Firestore.
 * If Firestore is offline or fails, falls back gracefully to existing localStorage or mock data.
 */
export async function syncFromFirestore(): Promise<void> {
  try {
    // 1. Sync Settings
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsDocRef);
    let finalSettings: Settings;

    if (settingsSnap.exists()) {
      finalSettings = settingsSnap.data() as Settings;
    } else {
      // Seed default settings to Firestore
      finalSettings = mockSettings;
      await setDoc(settingsDocRef, finalSettings);
    }
    localStorage.setItem("studio_settings", JSON.stringify(finalSettings));

    // 2. Sync Albums
    const albumsColRef = collection(db, ALBUMS_COLLECTION);
    const albumsSnap = await getDocs(albumsColRef);
    let finalAlbums: Album[] = [];

    if (!albumsSnap.empty) {
      albumsSnap.forEach((d) => {
        finalAlbums.push(d.data() as Album);
      });
      // Sort by created_at descending (or preserve design ordering)
      finalAlbums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Seed default albums to Firestore
      finalAlbums = mockAlbums;
      const batch = writeBatch(db);
      finalAlbums.forEach((album) => {
        const albumRef = doc(db, ALBUMS_COLLECTION, album.id);
        batch.set(albumRef, album);
      });
      await batch.commit();
    }
    localStorage.setItem("studio_albums", JSON.stringify(finalAlbums));

    // 3. Sync Photos
    const photosColRef = collection(db, PHOTOS_COLLECTION);
    const photosSnap = await getDocs(photosColRef);
    let finalPhotos: Photo[] = [];

    if (!photosSnap.empty) {
      photosSnap.forEach((d) => {
        finalPhotos.push(d.data() as Photo);
      });
    } else {
      // Seed default photos to Firestore
      finalPhotos = mockPhotos;
      const batch = writeBatch(db);
      finalPhotos.forEach((photo) => {
        const photoRef = doc(db, PHOTOS_COLLECTION, photo.id);
        batch.set(photoRef, photo);
      });
      await batch.commit();
    }
    localStorage.setItem("studio_photos", JSON.stringify(finalPhotos));

    // 4. Sync Orders
    const ordersColRef = collection(db, ORDERS_COLLECTION);
    const ordersSnap = await getDocs(ordersColRef);
    let finalOrders: PhotobookOrder[] = [];

    if (!ordersSnap.empty) {
      ordersSnap.forEach((d) => {
        finalOrders.push(d.data() as PhotobookOrder);
      });
      finalOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    localStorage.setItem("studio_photobook_orders", JSON.stringify(finalOrders));

    console.log("Synchronized successfully from Cloud Firestore.");
  } catch (error) {
    console.warn("Cloud Firestore synchronization is offline or unavailable. Falling back to secure localStorage:", error);
    
    // Load fallbacks gracefully
    if (!localStorage.getItem("studio_settings")) {
      localStorage.setItem("studio_settings", JSON.stringify(mockSettings));
    }
    if (!localStorage.getItem("studio_albums")) {
      localStorage.setItem("studio_albums", JSON.stringify(mockAlbums));
    }
    if (!localStorage.getItem("studio_photos")) {
      localStorage.setItem("studio_photos", JSON.stringify(mockPhotos));
    }
    if (!localStorage.getItem("studio_photobook_orders")) {
      localStorage.setItem("studio_photobook_orders", JSON.stringify([]));
    }
  }
}

/**
 * Saves/updates a single album in Firestore.
 */
export async function saveAlbumToCloud(album: Album): Promise<void> {
  try {
    const docRef = doc(db, ALBUMS_COLLECTION, album.id);
    await setDoc(docRef, album);
    console.log(`Saved album "${album.title}" to Cloud.`);
  } catch (error) {
    console.warn(`Firestore save offline: album "${album.title}" was saved locally in browser state.`, error);
  }
}

/**
 * Deletes an album from Firestore.
 */
export async function deleteAlbumFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, ALBUMS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`Deleted album "${id}" from Cloud.`);
  } catch (error) {
    console.warn(`Firestore delete offline: album "${id}" was deleted locally.`, error);
  }
}

/**
 * Saves/updates a photo in Firestore.
 */
export async function savePhotoToCloud(photo: Photo): Promise<void> {
  try {
    const docRef = doc(db, PHOTOS_COLLECTION, photo.id);
    await setDoc(docRef, photo);
    console.log(`Saved photo "${photo.id}" to Cloud.`);
  } catch (error) {
    console.warn(`Firestore save offline: photo "${photo.id}" was saved locally.`, error);
  }
}

/**
 * Deletes a photo from Firestore.
 */
export async function deletePhotoFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, PHOTOS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`Deleted photo "${id}" from Cloud.`);
  } catch (error) {
    console.warn(`Firestore delete offline: photo "${id}" was deleted locally.`, error);
  }
}

/**
 * Saves global studio settings to Firestore.
 */
export async function saveSettingsToCloud(settings: Settings): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(docRef, settings);
    console.log("Saved settings to Cloud.");
  } catch (error) {
    console.warn("Firestore save offline: studio settings saved locally.", error);
  }
}

/**
 * Saves/updates a photobook order in Firestore.
 */
export async function saveOrderToCloud(order: PhotobookOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, order);
    console.log(`Saved order "${order.id}" to Cloud.`);
  } catch (error) {
    console.warn(`Firestore save offline: order "${order.id}" saved locally.`, error);
  }
}

/**
 * Deletes an order from Firestore.
 */
export async function deleteOrderFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`Deleted order "${id}" from Cloud.`);
  } catch (error) {
    console.warn(`Firestore delete offline: order "${id}" was deleted locally.`, error);
  }
}
