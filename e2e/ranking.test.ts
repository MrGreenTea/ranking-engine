import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';

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
		const items = Array.from({ length: i }, () => faker.word.noun());
		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();

		await page.goto('/');

		// enter randomized items
		for (const item of items) {
			await page.getByPlaceholder('Add an item...').fill(item.toString());
			await page.getByRole('button', { name: 'Add' }).click();
		}

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
			const button1 = await page.getByTestId('comparison-buttons').getByRole('button').first();
			const button2 = await page.getByTestId('comparison-buttons').getByRole('button').last();
			const button1Content = await button1.textContent();
			const button2Content = await button2.textContent();

			await (button1Content! < button2Content! ? button1 : button2).click();
		}

		await expect(page.getByRole('listitem')).toContainText(sortedItems);
	});
});

// test top 3, 5 and 10 items
[3, 5, 10].forEach((i) => {
	test(`Top ${i} items`, async ({ page }) => {
		const items = Array.from({ length: 10 + i }, () => faker.word.noun());
		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();

		await page.goto('/');

		// enter randomized items
		for (const item of items) {
			await page.getByPlaceholder('Add an item...').fill(item.toString());
			await page.getByRole('button', { name: 'Add' }).click();
		}

		await page.getByPlaceholder('Top K items (optional)').fill(i.toString());

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
			const button1 = await page.getByTestId('comparison-buttons').getByRole('button').first();
			const button2 = await page.getByTestId('comparison-buttons').getByRole('button').last();
			const button1Content = await button1.textContent();
			const button2Content = await button2.textContent();

			await (button1Content! < button2Content! ? button1 : button2).click();
		}

		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems.slice(0, i));
	});
});
