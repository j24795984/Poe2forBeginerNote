import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataDirectory = resolve(process.cwd(), 'public/data');
const [progression, methods] = await Promise.all([
	readFile(resolve(dataDirectory, 'crafting-progression.json'), 'utf8').then(JSON.parse),
	readFile(resolve(dataDirectory, 'crafting-methods.json'), 'utf8').then(JSON.parse),
]);
const errors = [];
const stageIds = new Set((progression.stages ?? []).map((stage) => stage.id));
const methodSlugs = new Set();
const coreGuide = progression.coreDifferenceGuide;
const managementGuide = progression.processAndFundingGuide;

if (!coreGuide || typeof coreGuide.title !== 'string' || !coreGuide.title.trim()) {
	errors.push('裝備成長缺少 coreDifferenceGuide');
} else {
	if (!Array.isArray(coreGuide.introduction) || !coreGuide.introduction.length) errors.push('裝備成長缺少導言');
	if (!Array.isArray(coreGuide.sections) || coreGuide.sections.length !== 5) errors.push('裝備成長必須包含 5 個階段');
	if (!Array.isArray(coreGuide.comparison?.columns) || coreGuide.comparison.columns.length !== 3) errors.push('階段對照必須包含 3 個欄位');
	if (!Array.isArray(coreGuide.comparison?.rows) || coreGuide.comparison.rows.length !== 5) errors.push('階段對照必須包含 5 筆資料');
}

if (!managementGuide || typeof managementGuide.title !== 'string' || !managementGuide.title.trim()) {
	errors.push('裝備成長缺少 processAndFundingGuide');
} else {
	if (!Array.isArray(managementGuide.fundingManagement?.columns) || managementGuide.fundingManagement.columns.length !== 4) errors.push('資金與製作管理表必須包含 4 個欄位');
	if (!Array.isArray(managementGuide.fundingManagement?.rows) || managementGuide.fundingManagement.rows.length !== 5) errors.push('資金與製作管理表必須包含 5 筆資料');
	if (!Array.isArray(managementGuide.methodStages?.columns) || managementGuide.methodStages.columns.length !== 4) errors.push('製作方式階段表必須包含 4 個欄位');
	if (!Array.isArray(managementGuide.methodStages?.rows) || managementGuide.methodStages.rows.length !== 10) errors.push('製作方式階段表必須包含 10 筆資料');
	if (!Array.isArray(managementGuide.methodStages?.stageOptions) || managementGuide.methodStages.stageOptions.length !== 5) errors.push('製作方式階段表必須包含 5 個階段分頁');
	for (const row of managementGuide.methodStages?.rows ?? []) {
		for (const stage of managementGuide.methodStages?.stageOptions ?? []) {
			const condition = row.stageConditions?.[stage.id];
			if (!condition?.recommendedWhen || !condition?.avoidWhen) errors.push(`${row.method} 缺少 ${stage.id} 的投入條件`);
		}
	}
	if (!Array.isArray(managementGuide.resourcePrinciples?.items) || managementGuide.resourcePrinciples.items.length !== 4) errors.push('資源投入原則必須包含 4 個階段');
}

if (progression.dataVersion !== methods.dataVersion) {
	errors.push(`dataVersion 不一致：${progression.dataVersion} / ${methods.dataVersion}`);
}

for (const stage of progression.stages ?? []) {
	for (const field of ['code', 'name', 'progress', 'target', 'nextStep']) {
		if (typeof stage[field] !== 'string' || !stage[field].trim()) errors.push(`${stage.id} 缺少 ${field}`);
	}
}

for (const method of methods.methods ?? []) {
	if (typeof method.description !== 'string' || !method.description.trim()) errors.push(`${method.id} 缺少 description`);
	const navigation = method.navigation;
	if (!navigation || !navigation.slug || !navigation.name || !navigation.englishName) {
		errors.push(`${method.id} 缺少 navigation 路由資料`);
	} else if (methodSlugs.has(navigation.slug)) {
		errors.push(`${method.id} 使用重複的 navigation.slug：${navigation.slug}`);
	} else {
		methodSlugs.add(navigation.slug);
	}
	for (const stageId of method.stageIds ?? []) {
		if (!stageIds.has(stageId)) errors.push(`${method.id} 引用不存在的階段：${stageId}`);
	}
	if (!Array.isArray(method.steps) || !method.steps.length) errors.push(`${method.id} 缺少操作步驟`);
}

for (const stageId of stageIds) {
	if (!(methods.methods ?? []).some((method) => method.stageIds?.includes(stageId))) {
		errors.push(`${stageId} 沒有任何建議製作方法`);
	}
}

for (const flow of methods.advancedFlows ?? []) {
	if (!stageIds.has(flow.stageId)) errors.push(`${flow.id} 引用不存在的階段：${flow.stageId}`);
	if (!Array.isArray(flow.steps) || !flow.steps.length) errors.push(`${flow.id} 缺少詳細步驟`);
}

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exitCode = 1;
} else {
	console.log(`Crafting data valid: ${progression.stages.length} stages, ${methods.methods.length} methods, ${methods.advancedFlows.length} advanced flows.`);
}
