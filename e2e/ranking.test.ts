import { expect, test } from '@playwright/test';
import { enterItems, randomItemList, sortItems } from './helpers';

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

/* Reproduce a bug where adding items would not deduplicate them before sorting. */
[
	['a', 'b', 'c', 'a'],
	['a', 'a', 'b', 'a'],
	['a', 'b', 'a', 'c']
].forEach((items) => {
	test(`Adding the same item twice does to cause comparison with itself (${items.join(', ')})`, async ({
		page
	}) => {
		await page.goto('/');
		await enterItems(page, items);

		const deuplicatedItems = [...new Set(items)];
		await expect(page.getByRole('listitem')).toContainText(deuplicatedItems);

		await page.getByRole('button', { name: 'Start Sorting' }).click();

		while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
			const button1 = await page.getByTestId('comparison-buttons').getByRole('button').first();
			const button2 = await page.getByTestId('comparison-buttons').getByRole('button').last();
			const button1Content = await button1.textContent();
			const button2Content = await button2.textContent();

			expect(button1Content).not.toEqual(button2Content);

			await button1.click();
		}

		// deduplicated and sorted
		const sortedItems = [...deuplicatedItems].sort();
		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems);
	});
});
