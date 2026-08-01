import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const files = {
  view: resolve(root, 'public/data/atlas.json'),
  entities: resolve(root, 'public/data/atlas-entities.json'),
  relations: resolve(root, 'public/data/atlas-relations.json'),
};

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const [view, entities, relationDocument] = await Promise.all([
  readJson(files.view),
  readJson(files.entities),
  readJson(files.relations),
]);

const errors = [];
const versions = new Set([view.dataVersion, entities.dataVersion, relationDocument.dataVersion]);
if (versions.size !== 1 || versions.has(undefined)) {
  errors.push('atlas.json、atlas-entities.json、atlas-relations.json 的 dataVersion 必須一致。');
}

const entityCollections = ['sources', 'items', 'bosses', 'locations', 'mechanics', 'mapStates', 'biomes'];
const entityIds = new Set();
for (const collection of entityCollections) {
  for (const entity of entities[collection] ?? []) {
    if (!entity.id) errors.push(`${collection} 含有缺少 id 的資料。`);
    else if (entityIds.has(entity.id)) errors.push(`實體 id 重複：${entity.id}`);
    else entityIds.add(entity.id);
  }
}

for (const collection of entityCollections.filter((name) => name !== 'sources')) {
  for (const entity of entities[collection] ?? []) {
    for (const sourceId of entity.sourceIds ?? []) {
      if (!entityIds.has(sourceId)) errors.push(`${entity.id} 引用不存在的來源：${sourceId}`);
    }
  }
}

const relations = relationDocument.relations ?? [];
const relationIds = new Set();
const ignoredIdFields = new Set(['id']);
const checkReferences = (value, context, key = '') => {
  if (Array.isArray(value)) {
    if (key.endsWith('Ids')) {
      for (const id of value) if (!entityIds.has(id)) errors.push(`${context} 引用不存在的實體：${id}`);
    } else {
      for (const child of value) checkReferences(child, context);
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [childKey, childValue] of Object.entries(value)) {
    if (!ignoredIdFields.has(childKey) && childKey.endsWith('Id') && typeof childValue === 'string' && !entityIds.has(childValue)) {
      errors.push(`${context} 引用不存在的實體：${childValue}`);
    } else {
      checkReferences(childValue, context, childKey);
    }
  }
};

for (const relation of relations) {
  if (!relation.id) errors.push('relations 含有缺少 id 的資料。');
  else if (relationIds.has(relation.id)) errors.push(`關聯 id 重複：${relation.id}`);
  else relationIds.add(relation.id);
  checkReferences(relation, relation.id ?? '未知關聯');
}

const references = view.referenceViews;
if (references?.entityDocument !== 'atlas-entities.json') errors.push('atlas.json 的 entityDocument 指向錯誤。');
if (references?.relationDocument !== 'atlas-relations.json') errors.push('atlas.json 的 relationDocument 指向錯誤。');
for (const group of references?.groups ?? []) {
  for (const id of group.entityIds ?? []) if (!entityIds.has(id)) errors.push(`${group.id} 引用不存在的實體：${id}`);
  for (const id of group.relationIds ?? []) if (!relationIds.has(id)) errors.push(`${group.id} 引用不存在的關聯：${id}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Atlas relational data valid: ${entityIds.size} entities, ${relationIds.size} relations, ${references.groups.length} views.`);
}
