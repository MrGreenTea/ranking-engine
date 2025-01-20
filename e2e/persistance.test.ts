import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { enterItems } from './helpers';

test('reloading the page keeps the list', async ({ page }) => {
	const items = Array.from({ length: 10 }, () => faker.word.noun());

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const actualComparisonText = await page.getByText('Estimated comparisons').textContent();

	await page.goto('/');

	await expect(page.getByRole('listitem')).toContainText(items);
	await expect(page.getByText('Estimated comparisons')).toContainText(actualComparisonText!);
});

test('Clear all button works after entering items', async ({ page }) => {
	const items = Array.from({ length: 10 }, () => faker.word.noun());

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Clear all' }).click();
	await expect(page.getByRole('listitem')).toBeHidden();
});

test('reloading the page keeps the sorted list', async ({ page }) => {
	const items = Array.from({ length: 10 }, () => faker.word.noun());

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByRole('button', { name: 'Start Sorting' }).click();

	// we don't care about the actual order
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		await page.getByTestId('comparison-buttons').getByRole('button').first().click();
	}

	const sortedItems = await page.getByTestId('sorted-item').allInnerTexts();
	const actualComparisonText = await page.getByText('Actual comparisons').textContent();
	await page.goto('/');

	await expect(page.getByRole('listitem')).toContainText(sortedItems);
	await expect(page.getByText('Actual comparisons')).toContainText(actualComparisonText!);
});

test('reloading the page keeps the top k list', async ({ page }) => {
	const items = Array.from({ length: 10 }, () => faker.word.noun());

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	await page.getByPlaceholder('Top K items (optional)').fill('5');
	await page.getByRole('button', { name: 'Start Sorting' }).click();

	// we don't care about the actual order
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		await page.getByTestId('comparison-buttons').getByRole('button').first().click();
	}

	const sortedItems = await page.getByRole('listitem').allInnerTexts();
	const actualComparisonText = await page.getByText('Actual comparisons').textContent();
	await page.goto('/');

	await expect(page.getByRole('listitem')).toContainText(sortedItems);
	await expect(page.getByText('Actual comparisons')).toContainText(actualComparisonText!);
});
