import { browser } from '$app/environment';

type ApplicationStorageKey = 'lists' | 'selected-list';

type StorageKey =
	| 'collaborative-rankings'
	| 'collaborative-sort-by'
	| 'matrix-rankings'
	| 'ranking-comparison-cache'
	| 'ranking-comparisons-count'
	| 'ranking-estimated-comparisons'
	| 'ranking-items'
	| 'ranking-remaining-items'
	| 'ranking-sorted-items'
	| 'ranking-top-k';

export class LocalStore<T> {
	initialValue: T;
	key = '';
	value = $state<T>() as T;

	constructor(namespace: string, key: string, value: T) {
		this.key = key;
		this.initialValue = value;

		if (browser) {
			const item = localStorage.getItem(`${namespace}-${key}`);
			if (item) {
				this.value = this.deserialize(item);
			} else {
				this.value = value;
			}
		} else {
			this.value = value;
		}

		$effect(() => {
			localStorage.setItem(`${namespace}-${this.key}`, this.serialize(this.value));
		});
	}

	deserialize(item: string): T {
		return JSON.parse(item);
	}

	reset() {
		this.value = this.initialValue;
	}

	serialize(value: T): string {
		return JSON.stringify(value);
	}
}

export function applicationStore<T>(key: ApplicationStorageKey, value: T) {
	return new LocalStore('', key, value);
}

export function localStore<T>(namespace: string, key: StorageKey, value: T) {
	return new LocalStore(namespace, key, value);
}
