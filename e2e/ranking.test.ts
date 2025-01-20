import { expect, test } from '@playwright/test';
import { enterItems, randomItemList, sortItems } from './helpers';

test.describe.configure({ mode: 'parallel' });

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
		const items = randomItemList(i);

		await page.goto('/');

		await enterItems(page, items);

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		await sortItems(page);

		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();
		await expect(page.getByRole('listitem')).toContainText(sortedItems);
	});
});

// test top 3, 5 and 10 items
[3, 5, 10].forEach((i) => {
	test(`Top ${i} items`, async ({ page }) => {
		const items = randomItemList(10 + i);

		await page.goto('/');

		// enter randomized items
		await enterItems(page, items);

		await page.getByPlaceholder('Top K items (optional)').fill(i.toString());

		await page.getByRole('button', { name: 'Start Sorting' }).click();
		await sortItems(page);

		// we sort the items alphabetically to better understand the output
		// this is not necessary but helps us to verify the output
		const sortedItems = [...items].sort();
		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems.slice(0, i));
	});
});

test('Never ask the same comparison twice', async ({ page }) => {
	const items = randomItemList(5);

	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const seenPairs: [string, string][] = [];

	await page.getByRole('button', { name: 'Start Sorting' }).click();

	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		const buttonTexts = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.allInnerTexts();

		const [button1, button2] = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.all();

		const [button1Content, button2Content] = buttonTexts.map((t) => t.trim());

		const pair = buttonTexts.sort() as [string, string];
		expect(seenPairs).not.toContainEqual(pair);
		seenPairs.push(pair);
		console.log(seenPairs);

		await (button1Content! < button2Content! ? button1 : button2).click();
	}
});

/* reproduces a bug where the same comparison is asked twice.
	It depends on the very specific order of the items.
	Therefore we have this special ranking array that gives the expected order.
*/
test('Never ask the same comparison twice (top-k)', async ({ page }) => {
	const items = randomItemList(4);
	const ranking = [items[2], items[0], items[3], items[1], ...items.slice(4)];
	console.log({ input: items, expected: ranking });
	await page.goto('/');

	// enter randomized items
	await enterItems(page, items);

	const seenPairs: [string, string][] = [];

	await page.getByPlaceholder('Top K items (optional)').fill('3');
	await page.getByRole('button', { name: 'Start Sorting' }).click();

	while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
		const buttonTexts = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.allInnerTexts();

		const [button1, button2] = await page
			.getByTestId('comparison-buttons')
			.getByRole('button')
			.all();

		const [button1Content, button2Content] = buttonTexts.map((t) => t.trim());

		const pair = buttonTexts.sort() as [string, string];
		expect(seenPairs).not.toContainEqual(pair);
		seenPairs.push(pair);
		console.log(seenPairs);

		const button1Index = ranking.indexOf(button1Content!);
		const button2Index = ranking.indexOf(button2Content!);
		await (button1Index < button2Index ? button1 : button2).click();
	}
});

/* Reproduce a bug where adding items would not deduplicate them before sorting. */
[
	['b', 'a', 'b'],
	['a', 'b', 'c', 'a'],
	['a', 'a', 'b', 'a'],
	['a', 'b', 'a', 'c']
].forEach((items) => {
	test(`Adding the same item twice does not cause comparison with itself (${items.join(', ')})`, async ({
		page
	}) => {
		await page.goto('/');
		await enterItems(page, items);

		const deuplicatedItems = [...new Set(items)];
		await expect(page.getByRole('listitem')).toContainText(deuplicatedItems);

		await page.getByRole('button', { name: 'Start Sorting' }).click();

		while (await page.getByRole('heading', { name: 'Compare items' }).isVisible()) {
			const button1 = await page.getByTestId('comparison-buttons').getByRole('button').first();
			const button2 = await page.getByTestId('comparison-buttons').getByRole('button').last();
			const button1Content = await button1.textContent();
			const button2Content = await button2.textContent();

			expect(button1Content).not.toEqual(button2Content);

			if (button1Content! < button2Content!) {
				await button1.click();
			} else {
				await button2.click();
			}
		}

		// deduplicated and sorted
		const sortedItems = [...deuplicatedItems].sort();
		await expect(page.getByTestId('sorted-item')).toContainText(sortedItems);
	});
});
