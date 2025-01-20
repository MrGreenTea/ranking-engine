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
