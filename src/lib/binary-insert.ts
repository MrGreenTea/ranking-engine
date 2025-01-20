type CompareFunction<T> = (a: T, b: T) => Promise<number>;

export async function binaryInsert<T>(
	item: T,
	list: T[],
	compareItems: CompareFunction<T>
): Promise<number> {
	if (!list.length) {
		list.push(item);
		return 0;
	}

	let left = 0;
	let right = list.length - 1;

	while (left <= right) {
		const mid = Math.floor((left + right) / 2);

		// If the new item should come before the middle item
		const comparison = await compareItems(item, list[mid]);
		if (comparison < 0) {
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}

	// Insert at the found position
	list.splice(left, 0, item);
	return left;
}
