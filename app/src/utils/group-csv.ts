import dayjs from 'dayjs';

type Rows<T> = Record<string, T>;

interface GroupTables {
	members: Rows<{ name: string; joinedAt: number }>;
	expenses: Rows<{
		amount: number;
		currency: string;
		category: string;
		notes: string;
		paidOn: number;
		paidByMemberId: string;
	}>;
	splits: Rows<{ expenseId: string; memberId: string; amount: number }>;
}

function csvCell(value: string | number) {
	let text = String(value);
	if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
		text = `'${text}`;
	}
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildTransactionsCsv({
	members,
	expenses,
	splits,
}: GroupTables): string {
	const orderedMembers = Object.entries(members).sort(
		([, a], [, z]) => a.joinedAt - z.joinedAt,
	);

	const splitAmounts = new Map<string, number>();
	for (const { expenseId, memberId, amount } of Object.values(splits)) {
		const key = `${expenseId}:${memberId}`;
		splitAmounts.set(key, (splitAmounts.get(key) ?? 0) + amount);
	}

	const rows = Object.entries(expenses)
		.sort(([, a], [, z]) => a.paidOn - z.paidOn)
		.map(([id, expense]) => [
			dayjs(expense.paidOn).format('YYYY-MM-DD'),
			expense.category,
			expense.notes,
			expense.amount,
			expense.currency,
			members[expense.paidByMemberId]?.name ?? '',
			...orderedMembers.map(
				([memberId]) => splitAmounts.get(`${id}:${memberId}`) ?? '',
			),
		]);

	const header = [
		'Date',
		'Category',
		'Notes',
		'Amount',
		'Currency',
		'Paid by',
		...orderedMembers.map(([, member]) => member.name),
	];

	return [header, ...rows]
		.map((row) => row.map((value) => csvCell(value)).join(','))
		.join('\r\n');
}

export function downloadCsv(csv: string, fileName: string): void {
	const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}
