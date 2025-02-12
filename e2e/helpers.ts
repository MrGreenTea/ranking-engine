import { faker } from '@faker-js/faker';
import { expect, Page } from '@playwright/test';

export async function enterItems(page: Page, items: string[]) {
	for (const item of items) {
		await page.getByPlaceholder('Add an item').fill(item.toString());
		await page.getByRole('button', { exact: true, name: 'Add' }).click();
		// also makes sure we wait for it to be added
		await expect(page.getByRole('listitem').getByText(item, { exact: true })).toBeVisible();
	}
}

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

/*
 * Sorts the items using the ranking engine.
 * if sortedItems is provided the final order will be that.
 * Otherwise the order will be alphabetical
 */

export async function sortItems(
	page: Page,
	{
		beforeClick = () => {},
		beforeComparison = () => {},
		key = (item: string) => item
	}: {
		beforeClick?: (choice: string) => void;
		beforeComparison?: (item1: string, item2: string) => void;
		key?: (item: string) => number | string;
	} = {}
) {
	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		await expect(page.getByTestId('comparison-buttons').getByRole('button')).toHaveCount(2);
		const [button1Content, button2Content] = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			// because of the animation multiple texts will be visible
			// instead of waiting for the animation to finish
			// we assume the last text is the most recent one
			.locator('span:last-child')
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
