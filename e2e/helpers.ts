import { Page } from '@playwright/test';

export async function enterItems(page: Page, items: string[]) {
	for (const item of items) {
		await page.getByPlaceholder('Add an item...').fill(item.toString());
		await page.getByRole('button', { name: 'Add' }).click();
	}
}
