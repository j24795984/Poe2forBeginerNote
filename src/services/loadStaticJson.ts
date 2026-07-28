import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function loadStaticJson<T = any>(filename: string): Promise<T> {
	const content = await readFile(resolve('public/data', filename), 'utf8');
	return JSON.parse(content) as T;
}
