import { binaryInsert } from '$lib/binary-insert';
import { fc, test } from '@fast-check/vitest';
import { expect } from 'vitest';

test.prop({ items: fc.array(fc.integer()), new: fc.integer() })(
	'should insert numbers',
	async ({ items, new: newItem }) => {
		const compare = (a: number, b: number) => a - b;

		const sortedItems = items.toSorted(compare);
		const expectedResult = [...sortedItems, newItem].toSorted(compare);

		await binaryInsert(newItem, sortedItems, async (a, b) => compare(a, b));

		expect(sortedItems).toEqual(expectedResult);
	}
);

test.prop({ items: fc.array(fc.string()), new: fc.string() })(
	'should insert strings',
	async ({ items, new: newItem }) => {
		const compare = (a: string, b: string) => a.localeCompare(b);

		// we sort ascending, javascript sorts descending.
		const sortedItems = items.toSorted(compare);
		const expectedResult = [...sortedItems, newItem].toSorted(compare);
		await binaryInsert(newItem, sortedItems, async (a, b) => compare(a, b));

		expect(sortedItems).toEqual(expectedResult);
	}
);
