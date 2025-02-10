import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';

import { enterItems, randomItemList, sortItems } from './helpers';

// In rare cases we would generate a new item that is already in the list,
// which would break the test. This function makes sure we always get a new item.
function uniqueNewItem(items: string[]) {
	let newItem = faker.word.noun();
	while (items.includes(newItem)) {
		newItem = faker.word.noun();
	}
	return { items, newItem };
}

[
	{ items: ['A', 'B', 'C'], newItem: 'D', title: 'Insert last' },
	{ items: ['B', 'C', 'D'], newItem: 'A', title: 'Insert first' },
	{ items: ['A', 'C', 'D'], newItem: 'B', title: 'Insert middle' },
	{
		...uniqueNewItem(randomItemList(3)),
		title: 'Insert random (3 items)'
	},
	{
		...uniqueNewItem(randomItemList(5)),
		title: 'Insert random (5 items)'
	}
].forEach(({ items, newItem, title }) => {
	test(title, async ({ page }) => {
		await page.goto('/');

		// enter randomized items
		await enterItems(page, items);

		await page.getByRole('button', { name: 'Start' }).click();
		await sortItems(page);

		await page.getByPlaceholder('Insert new item').fill(newItem);
		await page.getByRole('button', { exact: true, name: 'Insert' }).click();

		await sortItems(page);

		const sortedItems = [...items, newItem].sort();
		await expect(page.getByRole('listitem')).toContainText(sortedItems);
	});
});
