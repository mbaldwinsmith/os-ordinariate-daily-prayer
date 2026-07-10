const STORAGE_KEY = 'includePrayerBookPrayers';

export function getPrayerBookPreference(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  return storage.getItem(STORAGE_KEY) !== 'false';
}

export function setPrayerBookPreference(enabled: boolean, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, String(enabled));
}

export { STORAGE_KEY as PRAYER_BOOK_STORAGE_KEY };
