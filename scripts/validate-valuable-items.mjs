import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const filename = resolve(process.cwd(), 'public/data/special-high-value-drops.json');
const document = JSON.parse(await readFile(filename, 'utf8'));
const errors = [];
const typeIds = new Set((document.types ?? []).map((type) => type.id));

for (const item of document.items ?? []) {
  if (!typeIds.has(item.typeId)) errors.push(`${item.id} 引用不存在的 typeId：${item.typeId}`);
  if (typeof item.acquisition?.summary !== 'string' || !item.acquisition.summary.trim()) {
    errors.push(`${item.id} 缺少 acquisition.summary。`);
  }
  if (item.acquisition?.detail) {
    if (typeof item.acquisition.detail.title !== 'string' || !item.acquisition.detail.title.trim()) {
      errors.push(`${item.id} 的 acquisition.detail.title 無效。`);
    }
    if (typeof item.acquisition.detail.html !== 'string' || !item.acquisition.detail.html.trim()) {
      errors.push(`${item.id} 的 acquisition.detail.html 無效。`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  const detailCount = document.items.filter((item) => item.acquisition.detail).length;
  console.log(`Valuable-item data valid: ${document.items.length} items, ${detailCount} detailed entries.`);
}
