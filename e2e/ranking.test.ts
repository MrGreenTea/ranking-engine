import { expect, test } from '@playwright/test';

// copied from https://stackoverflow.com/a/2450976
function shuffle<T>(array: T[]) {
	// Fisher-Yates shuffle
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

test('Ranks correctly', async ({ page }) => {
	const sortedItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const items = [...sortedItems];
	shuffle(items);

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
		const button1Number = Number(await button1.textContent());
		const button2Number = Number(await button2.textContent());

		if (button1Number < button2Number) {
			await button1.click();
		} else {
			await button2.click();
		}
	}

	await expect(page.getByRole('listitem')).toContainText(
		sortedItems.map((item) => item.toString())
	);
});
