import { estimateMergeSortComparisons, mergeSort } from './sorting';

/* Asynchronous compare function just like in Array.sort */
type CompareFunction<T> = (a: T, b: T) => Promise<number>;

export function estimateTopKComparisons(n: number, k: number): number {
	if (n <= k) return estimateMergeSortComparisons(n);
	// For top-k:
	// 1. First k items: k * log(k) for initial heap
	// 2. Remaining n-k items: each needs 1 comparison with smallest + log(k) if larger
	// We assume ~half of remaining items will be larger than smallest in heap
	const initialHeapComparisons = k * Math.log2(k);
	const remainingItemsComparisons = n - k + ((n - k) / 2) * Math.log2(k);
	return Math.ceil(initialHeapComparisons + remainingItemsComparisons);
}

export async function findTopK<T>(
	arr: T[],
	k: number,
	compareItems: CompareFunction<T>
): Promise<[T[], T[]]> {
	if (arr.length <= k) {
		return [await mergeSort(arr, compareItems), []];
	}

	// Initialize heap by just sorting
	const [initialHeap, remaining] = [arr.slice(0, k), arr.slice(k)];
	let heap = await mergeSort(initialHeap, compareItems);

	// Process remaining items
	for (const currentItem of remaining) {
		// Compare with the biggest item in heap (which is at the end)
		const lastItem = heap[heap.length - 1];
		const comparison = await compareItems(currentItem, lastItem);

		// currentItem is smaller than biggest (last) item in heap
		if (comparison < 0) {
			// replace heap with new item included
			// removes last item in heap
			heap = await mergeSort([...heap.slice(0, -1), currentItem], compareItems);
		}
	}

	const remainingArray = arr.filter((item) => !heap.includes(item));
	return [heap, remainingArray];
}
