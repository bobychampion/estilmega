import { supabase, testConnection } from "./supabase";
export { testConnection };
import { Album, Photo, Settings, PhotobookOrder } from "./types";
import { mockSettings, mockAlbums, mockPhotos } from "./mockData";

const SETTINGS_TABLE = "settings";
const ALBUMS_TABLE = "albums";
const PHOTOS_TABLE = "photos";
const ORDERS_TABLE = "orders";

const SETTINGS_ROW_ID = "studio";

/**
 * Loads all data from Supabase and synchronizes with localStorage.
 * If Supabase is empty (first-time setup), seeds default mock data.
 * If Supabase is offline or fails, falls back gracefully to existing localStorage or mock data.
 */
export async function syncFromCloud(): Promise<void> {
  try {
    // 1. Sync Settings
    const { data: settingsRow } = await supabase
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    let finalSettings: Settings;

    if (settingsRow) {
      finalSettings = settingsRow as Settings;
    } else {
      finalSettings = mockSettings;
      await supabase.from(SETTINGS_TABLE).upsert({ ...finalSettings, id: SETTINGS_ROW_ID });
    }
    localStorage.setItem("studio_settings", JSON.stringify(finalSettings));

    // 2. Sync Albums
    const { data: albumRows } = await supabase
      .from(ALBUMS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    let finalAlbums: Album[] = [];

    if (albumRows && albumRows.length > 0) {
      finalAlbums = albumRows as Album[];
    } else {
      finalAlbums = mockAlbums;
      await supabase.from(ALBUMS_TABLE).upsert(finalAlbums);
    }
    localStorage.setItem("studio_albums", JSON.stringify(finalAlbums));

    // 3. Sync Photos
    const { data: photoRows } = await supabase.from(PHOTOS_TABLE).select("*");
    let finalPhotos: Photo[] = [];

    if (photoRows && photoRows.length > 0) {
      finalPhotos = photoRows as Photo[];
    } else {
      finalPhotos = mockPhotos;
      await supabase.from(PHOTOS_TABLE).upsert(finalPhotos);
    }
    localStorage.setItem("studio_photos", JSON.stringify(finalPhotos));

    // 4. Sync Orders
    const { data: orderRows } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    const finalOrders: PhotobookOrder[] = (orderRows as PhotobookOrder[]) || [];
    localStorage.setItem("studio_photobook_orders", JSON.stringify(finalOrders));

    console.log("Synchronized successfully from Supabase.");
  } catch (error) {
    console.warn("Supabase synchronization is offline or unavailable. Falling back to secure localStorage:", error);

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
 * Saves/updates a single album in Supabase.
 */
export async function saveAlbumToCloud(album: Album): Promise<void> {
  const { error } = await supabase.from(ALBUMS_TABLE).upsert(album);
  if (error) {
    console.warn(`Supabase save offline: album "${album.title}" was saved locally in browser state.`, error);
  } else {
    console.log(`Saved album "${album.title}" to Cloud.`);
  }
}

/**
 * Deletes an album from Supabase.
 */
export async function deleteAlbumFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from(ALBUMS_TABLE).delete().eq("id", id);
  if (error) {
    console.warn(`Supabase delete offline: album "${id}" was deleted locally.`, error);
  } else {
    console.log(`Deleted album "${id}" from Cloud.`);
  }
}

/**
 * Saves/updates a photo in Supabase.
 */
export async function savePhotoToCloud(photo: Photo): Promise<void> {
  const { error } = await supabase.from(PHOTOS_TABLE).upsert(photo);
  if (error) {
    console.warn(`Supabase save offline: photo "${photo.id}" was saved locally.`, error);
  } else {
    console.log(`Saved photo "${photo.id}" to Cloud.`);
  }
}

/**
 * Deletes a photo from Supabase.
 */
export async function deletePhotoFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from(PHOTOS_TABLE).delete().eq("id", id);
  if (error) {
    console.warn(`Supabase delete offline: photo "${id}" was deleted locally.`, error);
  } else {
    console.log(`Deleted photo "${id}" from Cloud.`);
  }
}

/**
 * Saves global studio settings to Supabase.
 */
export async function saveSettingsToCloud(settings: Settings): Promise<void> {
  const { error } = await supabase.from(SETTINGS_TABLE).upsert({ ...settings, id: SETTINGS_ROW_ID });
  if (error) {
    console.warn("Supabase save offline: studio settings saved locally.", error);
  } else {
    console.log("Saved settings to Cloud.");
  }
}

/**
 * Saves/updates a photobook order in Supabase.
 */
export async function saveOrderToCloud(order: PhotobookOrder): Promise<void> {
  const { error } = await supabase.from(ORDERS_TABLE).upsert(order);
  if (error) {
    console.warn(`Supabase save offline: order "${order.id}" saved locally.`, error);
  } else {
    console.log(`Saved order "${order.id}" to Cloud.`);
  }
}

/**
 * Deletes an order from Supabase.
 */
export async function deleteOrderFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from(ORDERS_TABLE).delete().eq("id", id);
  if (error) {
    console.warn(`Supabase delete offline: order "${id}" was deleted locally.`, error);
  } else {
    console.log(`Deleted order "${id}" from Cloud.`);
  }
}
