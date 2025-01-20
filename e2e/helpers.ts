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

export async function sortItems(
	page: Page,
	{
		key = (item: string) => item,
		beforeClick = () => {},
		beforeComparison = () => {}
	}: {
		key?: (item: string) => string | number;
		beforeClick?: (choice: string) => void;
		beforeComparison?: (item1: string, item2: string) => void;
	} = {}
) {
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		const [button1Content, button2Content] = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.allInnerTexts();

		// if one of the buttons is not visible, we are done
		if (button1Content == null || button2Content == null) {
			break;
		}

		beforeComparison(button1Content, button2Content);
		if (key(button1Content!) < key(button2Content!)) {
			beforeClick(button1Content);
			await page.getByTestId('comparison-buttons').getByRole('button').first().click();
		} else {
			beforeClick(button2Content);
			await page.getByTestId('comparison-buttons').getByRole('button').last().click();
		}
	}
}
