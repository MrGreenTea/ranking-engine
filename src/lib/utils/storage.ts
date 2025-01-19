type StorageKey = 'ranking-items' | 'ranking-sorted-items' | 'collaborative-rankings' | 'collaborative-sort-by';

export function loadFromStorage<T>(key: StorageKey, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;

	const stored = window.localStorage.getItem(key);
	if (!stored) return defaultValue;

	try {
		return JSON.parse(stored) as T;
	} catch {
		return defaultValue;
	}
}

export function saveToStorage<T>(key: StorageKey, value: T): void {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStorage(keys: StorageKey[]): void {
	if (typeof window === 'undefined') return;

	keys.forEach((key) => window.localStorage.removeItem(key));
}
