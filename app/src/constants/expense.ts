export const categories = [
	{ name: 'Accommodation', emoji: '🏠' },
	{ name: 'Activities', emoji: '🎭' },
	{ name: 'Food & Drinks', emoji: '🍔' },
	{ name: 'Shopping', emoji: '🛍️' },
	{ name: 'Transportation', emoji: '🚗' },
	{ name: 'Other', emoji: '❓' },
];

export const categoryNameEmojiMap = new Map(
	categories.map((cat) => [cat.name, cat.emoji]),
);
