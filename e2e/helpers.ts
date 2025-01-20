import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/*
 * Returns an array of random unique words.
 * @param length: the number of words to generate
 */
export function randomItemList(length: number) {
	const result = new Set<string>();
	while (result.size < length) {
		result.add(faker.word.noun());
	}
	return Array.from(result);
}

export async function enterItems(page: Page, items: string[]) {
	for (const item of items) {
		await page.getByPlaceholder('Add an item...').fill(item.toString());
		await page.getByRole('button', { name: 'Add' }).click();
	}
}

/*
 * Sorts the items using the ranking engine.
 * if sortedItems is provided the final order will be that.
 * Otherwise the order will be alphabetical
 */
export async function sortItems(page: Page) {
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		const button1 = await page.getByTestId('comparison-buttons').getByRole('button').first();
		const button2 = await page.getByTestId('comparison-buttons').getByRole('button').last();
		const button1Content = await button1.textContent();
		const button2Content = await button2.textContent();

		await (button1Content! < button2Content! ? button1 : button2).click();
	}
}
