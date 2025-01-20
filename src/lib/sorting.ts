export function estimateMergeSortComparisons(n: number): number {
	if (n <= 1) return 0;
	// Expected comparisons for merge sort is n * log2(n)
	return Math.ceil(n * Math.log2(n));
}

type CompareFunction<T> = (a: T, b: T) => Promise<number>;

async function mergeArrays<T>(left: T[], right: T[], compare: CompareFunction<T>): Promise<T[]> {
	const result: T[] = [];
	let leftIndex = 0;
	let rightIndex = 0;

	while (leftIndex < left.length && rightIndex < right.length) {
		const item1 = left[leftIndex];
		const item2 = right[rightIndex];

		// if a < b the result is negative, if a > b the result is positive.
		// 0 will not happen because the user always has to choose one of the items.
		const comparison = await compare(item1, item2);

		if (comparison < 0) {
			result.push(item1);
			leftIndex++;
		} else {
			result.push(item2);
			rightIndex++;
		}
	}

	return [...result, ...left.slice(leftIndex), ...right.slice(rightIndex)];
}

export async function mergeSort<T>(arr: T[], compare: CompareFunction<T>): Promise<T[]> {
	if (arr.length <= 1) return arr;

	const mid = Math.floor(arr.length / 2);
	const left = arr.slice(0, mid);
	const right = arr.slice(mid);

	const sortedLeft = await mergeSort(left, compare);
	const sortedRight = await mergeSort(right, compare);

	return mergeArrays(sortedLeft, sortedRight, compare);
}
