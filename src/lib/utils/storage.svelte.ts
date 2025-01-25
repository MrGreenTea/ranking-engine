import { browser } from '$app/environment';

type StorageKey =
	| 'ranking-items'
	| 'ranking-sorted-items'
	| 'ranking-remaining-items'
	| 'ranking-top-k'
	| 'collaborative-rankings'
	| 'collaborative-sort-by'
	| 'ranking-comparisons-count'
	| 'ranking-estimated-comparisons'
	| 'ranking-comparison-cache';

export class LocalStore<T> {
	value = $state<T>() as T;
	key = '';
	initialValue: T;

	constructor(key: StorageKey, value: T) {
		this.key = key;
		this.initialValue = value;

		if (browser) {
			const item = localStorage.getItem(key);
			if (item) {
				this.value = this.deserialize(item);
			} else {
				this.value = value;
			}
		} else {
			this.value = value;
		}

		$effect(() => {
			localStorage.setItem(this.key, this.serialize(this.value));
		});
	}

	serialize(value: T): string {
		return JSON.stringify(value);
	}

	deserialize(item: string): T {
		return JSON.parse(item);
	}

	reset() {
		this.value = this.initialValue;
	}
}

export function localStore<T>(key: StorageKey, value: T) {
	return new LocalStore(key, value);
}
