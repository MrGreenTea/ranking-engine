import { expect } from 'vitest';
import { mergeSort } from '$lib/sorting';
import { test, fc } from '@fast-check/vitest';

test.prop({ items: fc.array(fc.integer()) })('should sort numbers', async ({ items }) => {
	const compare = (a: number, b: number) => a - b;

	const sortedItems = items.toSorted(compare);
	const mergeSortedItems = await mergeSort(items, async (a, b) => compare(a, b));

	expect(mergeSortedItems).toEqual(sortedItems);
});

test.prop({ items: fc.array(fc.string()) })('should sort strings', async ({ items }) => {
	const compare = (a: string, b: string) => a.localeCompare(b);

	// we sort ascending, javascript sorts descending.
	const sortedItems = items.toSorted(compare);
	const mergeSortedItems = await mergeSort(items, async (a, b) => compare(a, b));

	expect(mergeSortedItems).toEqual(sortedItems);
});
