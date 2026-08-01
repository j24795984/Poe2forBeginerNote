import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataDirectory = resolve(process.cwd(), 'public/data');
const readJson = async (filename) => JSON.parse(await readFile(resolve(dataDirectory, filename), 'utf8'));
const [view, entities, relationDocument] = await Promise.all([
  readJson('campaign.json'),
  readJson('campaign-entities.json'),
  readJson('campaign-relations.json'),
]);

const errors = [];
const versions = new Set([view.dataVersion, entities.dataVersion, relationDocument.dataVersion]);
if (versions.size !== 1 || versions.has(undefined)) {
  errors.push('campaign.json、campaign-entities.json、campaign-relations.json 的 dataVersion 必須一致。');
}

const collections = ['sources', 'chapters', 'chapterSegments', 'mapSurfaces', 'quests', 'rewards'];
const entityIds = new Set();
for (const collection of collections) {
  for (const entity of entities[collection] ?? []) {
    if (!entity.id) errors.push(`${collection} 含有缺少 id 的資料。`);
    else if (entityIds.has(entity.id)) errors.push(`實體 id 重複：${entity.id}`);
    else entityIds.add(entity.id);
  }
}

const checkEntityReference = (id, context) => {
  if (!entityIds.has(id)) errors.push(`${context} 引用不存在的實體：${id}`);
};
for (const collection of collections) {
  for (const entity of entities[collection] ?? []) {
    if (entity.chapterId) checkEntityReference(entity.chapterId, entity.id);
    if (entity.segmentId) checkEntityReference(entity.segmentId, entity.id);
    for (const sourceId of entity.sourceIds ?? []) checkEntityReference(sourceId, entity.id);
  }
}

const relationIds = new Set();
for (const relation of relationDocument.relations ?? []) {
  if (!relation.id) errors.push('relations 含有缺少 id 的資料。');
  else if (relationIds.has(relation.id)) errors.push(`關聯 id 重複：${relation.id}`);
  else relationIds.add(relation.id);
  for (const [key, value] of Object.entries(relation)) {
    if (key !== 'id' && key.endsWith('Id') && typeof value === 'string') checkEntityReference(value, relation.id);
    if (key.endsWith('Ids') && Array.isArray(value)) value.forEach((id) => checkEntityReference(id, relation.id));
  }
}

if (view.referenceViews?.entityDocument !== 'campaign-entities.json') errors.push('campaign.json 的 entityDocument 指向錯誤。');
if (view.referenceViews?.relationDocument !== 'campaign-relations.json') errors.push('campaign.json 的 relationDocument 指向錯誤。');
for (const group of view.referenceViews?.groups ?? []) checkEntityReference(group.rootEntityId, group.id);

const relatedRewardIds = new Set(
  relationDocument.relations.filter((relation) => relation.type === 'containsReward').map((relation) => relation.rewardId),
);
for (const reward of entities.rewards ?? []) {
  if (!relatedRewardIds.has(reward.id)) errors.push(`獎勵缺少 containsReward 關聯：${reward.id}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Campaign relational data valid: ${entityIds.size} entities, ${relationIds.size} relations, ${view.referenceViews.groups.length} views.`);
}
