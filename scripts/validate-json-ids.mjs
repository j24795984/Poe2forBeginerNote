import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDirectory = join(process.cwd(), 'public', 'data');
const files = readdirSync(dataDirectory).filter((file) => file.endsWith('.json'));
let hasErrors = false;

function collectIds(value, ids) {
	if (Array.isArray(value)) {
		value.forEach((item) => collectIds(item, ids));
		return;
	}
	if (!value || typeof value !== 'object') return;
	if (typeof value.id === 'string') ids.push(value.id);
	Object.entries(value)
		.filter(([key]) => key !== 'idRegistry')
		.forEach(([, item]) => collectIds(item, ids));
}

for (const file of files) {
	const document = JSON.parse(readFileSync(join(dataDirectory, file), 'utf8'));
	const ids = [];
	collectIds(document, ids);
	const retiredIds = document.idRegistry?.retiredIds ?? [];
	const allIds = [...ids, ...retiredIds];
	const duplicates = [...new Set(allIds.filter((id, index) => allIds.indexOf(id) !== index))];

	if (!document.idRegistry || !Number.isInteger(document.idRegistry.nextSequence)) {
		console.error(`${file}: missing idRegistry.nextSequence`);
		hasErrors = true;
	}
	if (!Array.isArray(retiredIds)) {
		console.error(`${file}: idRegistry.retiredIds must be an array`);
		hasErrors = true;
	}
	if (duplicates.length) {
		console.error(`${file}: duplicate or reused IDs: ${duplicates.join(', ')}`);
		hasErrors = true;
	}
	const sequences = allIds
		.map((id) => Number(id.match(/-(\d+)$/)?.[1]))
		.filter((sequence) => Number.isInteger(sequence));
	if (sequences.length && document.idRegistry.nextSequence <= Math.max(...sequences)) {
		console.error(`${file}: idRegistry.nextSequence must be greater than every allocated ID sequence`);
		hasErrors = true;
	}
}

if (hasErrors) process.exit(1);
console.log(`Validated ${files.length} JSON data file(s).`);
