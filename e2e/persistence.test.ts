import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';

import { enterItems, randomItemList, sortItems } from './helpers';

test('reloading the page keeps the list', async ({ page }) => {
	const items = randomItemList(10);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const actualComparisonText = await page.getByText('comparisons').textContent();

	await page.reload();

	await expect(page.getByRole('listitem')).toContainText(items.reverse());
	await expect(page.getByText('comparisons')).toContainText(actualComparisonText!);
});

test('Clear all button works after entering items', async ({ page }) => {
	const items = randomItemList(10);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Clear all' }).click();
	// Confirming the dialog
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByRole('listitem')).toBeHidden();
});

test('reloading the page keeps the sorted list', async ({ page }) => {
	const items = randomItemList(5);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Start' }).click();

	await sortItems(page);

	const sortedItems = await page.getByRole('listitem').allTextContents();
	const actualComparisonText = await page.getByText(/Took \d+ comparisons/).textContent();
	await page.reload();

	await expect(page.getByRole('listitem')).toContainText(sortedItems);
	await expect(page.getByText(/Took \d+ comparisons/)).toContainText(actualComparisonText!);
});

test('reloading the page keeps the top k list', async ({ page }) => {
	const items = randomItemList(5);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByLabel('Top X items only').fill('2');
	await page.getByRole('button', { name: 'Start' }).click();

	await sortItems(page);

	const sortedItems = await page.getByRole('listitem').allTextContents();
	const actualComparisonText = await page.getByText(/Took \d+ comparisons/).textContent();
	await page.reload();

	await expect(page.getByRole('listitem')).toContainText(sortedItems);
	await expect(page.getByText(/Took \d+ comparisons/)).toContainText(actualComparisonText!);
});

test('reloading the page after inserting an item keeps the list', async ({ page }) => {
	const items = randomItemList(3);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Start' }).click();

	await sortItems(page);

	const newItem = faker.word.noun();
	await page.getByPlaceholder('Insert new item').fill(newItem);
	await page.getByRole('button', { exact: true, name: 'Insert' }).click();

	// we don't care about the actual order
	await sortItems(page);

	const sortedItems = await page.getByRole('listitem').allTextContents();
	const actualComparisonText = await page.getByText(/Took \d+ comparisons/).textContent();
	await page.reload();

	await expect(page.getByRole('listitem')).toContainText(sortedItems);
	await expect(page.getByText(/Took \d+ comparisons/)).toContainText(actualComparisonText!);
});
