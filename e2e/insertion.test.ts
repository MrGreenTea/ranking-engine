import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { randomItemList, enterItems, sortItems } from './helpers';

test('Add item after sorting', async ({ page }) => {
	const items = randomItemList(3);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Start Sorting' }).click();
	await sortItems(page);

	const newItem = faker.word.noun();
	await page.getByPlaceholder('Insert new item').fill(newItem);
	await page.getByRole('button', { name: 'Insert', exact: true }).click();

	await sortItems(page);

	const sortedItems = [...items, newItem].sort();
	await expect(page.getByRole('listitem')).toContainText([...sortedItems]);
});
