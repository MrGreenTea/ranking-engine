import { expect } from 'vitest';
import { findTopK } from '$lib/top-k-selection';
import { test, fc } from '@fast-check/vitest';

test.prop({ items: fc.array(fc.integer()) })('should sort numbers', async ({ items }) => {
	const compare = (a: number, b: number) => a - b;

	const [topItems] = await findTopK(items, 3, async (a, b) => compare(a, b));

	const sortedItems = items.toSorted(compare);
	expect(topItems).toEqual(sortedItems.slice(0, 3));
});

test.prop({ items: fc.array(fc.string()) })('should sort strings', async ({ items }) => {
	const compare = (a: string, b: string) => a.localeCompare(b);

	// we sort ascending, javascript sorts descending.
	const sortedItems = items.toSorted(compare);
	const [topItems] = await findTopK(items, 3, async (a, b) => compare(a, b));

	expect(topItems).toEqual(sortedItems.slice(0, 3));
});
