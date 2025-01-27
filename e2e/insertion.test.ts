import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';

import { enterItems, randomItemList, sortItems } from './helpers';

[
	{ items: ['A', 'B', 'C'], newItem: 'D', title: 'Insert last' },
	{ items: ['B', 'C', 'D'], newItem: 'A', title: 'Insert first' },
	{ items: ['A', 'C', 'D'], newItem: 'B', title: 'Insert middle' },
	{ items: randomItemList(3), newItem: faker.word.noun(), title: 'Insert random (3 items)' },
	{ items: randomItemList(5), newItem: faker.word.noun(), title: 'Insert random (5 items)' }
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
