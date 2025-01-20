import { Page, expect } from '@playwright/test';
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
		await page.getByPlaceholder('Add an item').fill(item.toString());
		await page.getByRole('button', { name: 'Add', exact: true }).click();
		// also makes sure we wait for it to be added
		await expect(page.getByRole('listitem').getByText(item, { exact: true })).toBeVisible();
	}
}

/*
 * Sorts the items using the ranking engine.
 * if sortedItems is provided the final order will be that.
 * Otherwise the order will be alphabetical
 */

export async function sortItems(page: Page) {
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		const [button1, button2] = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.all();
		const [button1Content, button2Content] = await Promise.all([
			button1.innerText(),
			button2.innerText()
		]);

		await (button1Content! < button2Content! ? button1 : button2).click();
	}
}
