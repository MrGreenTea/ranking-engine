import { browser } from '$app/environment';

type StorageKey =
	| 'collaborative-rankings'
	| 'collaborative-sort-by'
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

export function localStore<T>(key: StorageKey, value: T) {
	return new LocalStore(key, value);
}
