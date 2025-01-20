import { expect, test } from '@playwright/test';
import { enterItems, randomItemList, sortItems } from './helpers';

test.describe.configure({ mode: 'parallel' });

/**
 * @description
 *
 * Verifies that the ranking engine correctly reorders items based on the
 * user's input.
 *
 * This test generates a list of 10 random words,
 * enters them into the ranking engine,
 * and then verifies that the output is sorted correctly.
 * We use alphabetical order as ranking.
 */

// ranks 2, 3, 5, 10 items correctly
[2, 3, 5, 10].forEach((i) => {
	test(`Ranks ${i} items correctly`, async ({ page }) => {
		const items = randomItemList(i);

		await page.goto('/');

		await enterItems(page, items);

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		await sortItems(page);

		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();
		await expect(page.getByRole('listitem')).toContainText(sortedItems);
	});
});

// test top 3, 5 and 10 items
[3, 5, 10].forEach((i) => {
	test(`Top ${i} items`, async ({ page }) => {
		const items = randomItemList(10 + i);

		await page.goto('/');

		// enter randomized items
		await enterItems(page, items);

		await page.getByPlaceholder('Top K items (optional)').fill(i.toString());

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		await sortItems(page);

		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();
		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems.slice(0, i));
	});
});

test('Never ask the same comparison twice', async ({ page }) => {
	const items = randomItemList(4);
	const ranking = [items[2], items[0], items[3], items[1]];

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const seenPairs: [string, string][] = [];

	await page.getByRole('button', { name: 'Start Sorting' }).click();

	await sortItems(page, {
		key: (item: string) => ranking.indexOf(item),
		beforeComparison: (i1, i2) => {
			const pair = [i1, i2].sort() as [string, string];
			expect(seenPairs).not.toContainEqual(pair);
			seenPairs.push(pair);
		}
	});
});

/* reproduces a bug where the same comparison is asked twice.
	It depends on the very specific order of the items.
	Therefore we have this special ranking array that gives the expected order.
*/
test('Never ask the same comparison twice (top-k)', async ({ page }) => {
	const items = randomItemList(4);
	const ranking = [items[2], items[0], items[3], items[1]];
	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const seenPairs: [string, string][] = [];

	await page.getByPlaceholder('Top K items (optional)').fill('3');
	await page.getByRole('button', { name: 'Start Sorting' }).click();

	await sortItems(page, {
		key: (item: string) => ranking.indexOf(item),
		beforeComparison: (i1, i2) => {
			const pair = [i1, i2].sort() as [string, string];
			expect(seenPairs).not.toContainEqual(pair);
			seenPairs.push(pair);
		}
	});
});

/* Reproduce a bug where adding items would not deduplicate them before sorting. */
[
	['b', 'a', 'b'],
	['a', 'b', 'c', 'a'],
	['a', 'a', 'b', 'a'],
	['a', 'b', 'a', 'c']
].forEach((items) => {
	test(`Adding the same item twice does not cause comparison with itself (${items.join(', ')})`, async ({
		page
	}) => {
		await page.goto('/');
		await enterItems(page, items);

		const deuplicatedItems = [...new Set(items)];
		await expect(page.getByRole('listitem')).toContainText(deuplicatedItems);

		await page.getByRole('button', { name: 'Start Sorting' }).click();

		await sortItems(page, {
			beforeComparison: (button1Content, button2Content) => {
				expect(button1Content).not.toEqual(button2Content);
			}
		});

		// deduplicated and sorted
		const sortedItems = [...deuplicatedItems].sort();
		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems);
	});
});
