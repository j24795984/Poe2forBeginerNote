<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useCategoryTabs } from '../composables/useCategoryTabs';

type LinkSource = { name: string; url: string };
type RichTextPart = { text: string; emphasis?: boolean };
type ManagementStageKey = 'campaign' | 'earlyAtlas' | 'midAtlas' | 'lateAtlas' | 'graduation';
type ManagementUsage = string | string[];
type ManagementStageCondition = { recommendedWhen: string; avoidWhen: string };
type ManagementMethodRow = {
	method: string;
	campaign: ManagementUsage;
	earlyAtlas: ManagementUsage;
	midAtlas: ManagementUsage;
	lateAtlas: ManagementUsage;
	graduation: ManagementUsage;
	recommendedWhen: string;
	avoidWhen: string;
	stageConditions: Record<ManagementStageKey, ManagementStageCondition>;
};
type CoreDifferenceGuide = {
	title: string;
	introduction: RichTextPart[];
	sections: { id: string; title: string; paragraphs: RichTextPart[][] }[];
	comparison: {
		title: string;
		columns: [string, string, string];
		rows: { stage: string; target: string; compromise: string }[];
	};
	closingNote: string;
};
type ProcessAndFundingGuide = {
	title: string;
	fundingManagement: {
		title: string;
		columns: [string, string, string, string];
		rows: { stage: string; target: string; recommendedTarget: string; stopCondition: string }[];
		note: string;
	};
	methodStages: {
		title: string;
		columns: [string, string, string, string];
		stageOptions: { id: ManagementStageKey; label: string }[];
		rows: ManagementMethodRow[];
	};
	resourcePrinciples: {
		title: string;
		introduction: string;
		items: { stage: string; guidance: string }[];
		closingNote: string;
	};
};
type ProgressionStage = {
	id: string;
	code: string;
	name: string;
	progress: string;
	positioning: string;
	fundingNote?: string;
	investment: string;
	effectiveMods: string;
	target: string;
	qualification: string[];
	acquisition: string[];
	nextStep: string;
};
type ProgressionData = {
	title: string;
	summary: string;
	coreDifferenceGuide: CoreDifferenceGuide;
	processAndFundingGuide: ProcessAndFundingGuide;
	principles: { title: string; description: string }[];
	evaluationDimensions: { title: string; description: string }[];
	equipmentTags: { label: string; description: string }[];
	upgradeOrder: string[];
	stages: ProgressionStage[];
	sources: LinkSource[];
};
type CraftingMethod = {
	id: string;
	name: string;
	navigation: { slug: string; name: string; englishName: string };
	description: string;
	stageIds: string[];
	investment: string;
	risk: string;
	materials: string[];
	startConditions: string[];
	steps: string[];
	successResult: string;
	stopWhen: string;
};
type CraftingMethodGroup = {
	id: string;
	navigation: { slug: string; name: string; englishName: string };
	summary: string;
	stageIds: string[];
	methodIds: string[];
	decisionGuide: { title: string; description: string }[];
};
type CraftingFlow = {
	id: string;
	name: string;
	stageId: string;
	goal: string;
	investment: string;
	risk: string;
	coreRule?: string;
	budgetNotice?: string;
	steps: { title: string; description: string }[];
	fractureOutcomes?: { result: string; action: string; tone: string }[];
};
type MethodsData = {
	title: string;
	pricePolicy: string;
	methodGroups: CraftingMethodGroup[];
	methods: CraftingMethod[];
	advancedFlows: CraftingFlow[];
	preflightChecklist: { group: string; items: string[] }[];
	sources: LinkSource[];
};

const props = defineProps<{ progression: ProgressionData; methods: MethodsData }>();
const basicGroup = computed(() => props.methods.methodGroups.find((group) => group.id === 'crafting-group-basic'));
const basicMethods = computed(() => {
	const ids = new Set(basicGroup.value?.methodIds ?? []);
	return props.methods.methods.filter((method) => ids.has(method.id));
});
const categories = computed(() => [
	{ id: 'progression', slug: 'progression', name: '裝備製作通則', englishName: 'PRINCIPLES', summary: '理解各階段對基底、詞綴品質與妥協程度的差異，再決定合理的製作方向。' },
	{ id: 'workflow-funding', slug: 'workflow-funding', name: '製作流程與資金管理', englishName: 'MANAGEMENT', summary: '依進度選擇值得投入的裝備與製作方式，並在風險超過實際提升前停手。' },
	...(basicGroup.value ? [{
		id: basicGroup.value.id,
		slug: basicGroup.value.navigation.slug,
		name: basicGroup.value.navigation.name,
		englishName: basicGroup.value.navigation.englishName,
		summary: basicGroup.value.summary,
	}] : []),
	...props.methods.methods.filter((method) => !basicGroup.value?.methodIds.includes(method.id)).map((method) => ({
		id: method.id,
		slug: method.navigation.slug,
		name: method.navigation.name,
		englishName: method.navigation.englishName,
		summary: `${method.name}：${method.successResult}`,
	})),
]);

const detailPanel = ref<HTMLElement>();
const methodStageGrid = ref<HTMLElement>();
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
const error = ref('');
const hoveredCategoryIndex = ref<number | null>(null);
const selectedManagementStage = ref<ManagementStageKey>('campaign');
const displayedManagementStage = ref<ManagementStageKey>('campaign');
let activeManagementStageAnimation: Animation | undefined;
let managementStageSelection = 0;
const stageMap = computed(() => new Map(props.progression.stages.map((stage) => [stage.id, stage])));
const endgameFlow = computed(() => props.methods.advancedFlows.find((flow) => flow.id === 'crafting-flow-endgame'));
const highBudgetFlow = computed(() => props.methods.advancedFlows.find((flow) => flow.id === 'crafting-flow-high-budget'));
const allSources = computed(() => {
	const unique = new Map<string, LinkSource>();
	for (const source of [...props.progression.sources, ...props.methods.sources]) unique.set(source.url, source);
	return [...unique.values()];
});
const { selectedId, displayedId, displayedItem: selectedCategory, select: selectCategory, initialize, dispose } = useCategoryTabs({ items: () => categories.value, panel: detailPanel, historyStateKey: 'craftingCategory' });
const selectedMethod = computed(() => props.methods.methods.find((method) => method.id === displayedId.value));
const displayedManagementStageLabel = computed(() => props.progression.processAndFundingGuide.methodStages.stageOptions.find((stage) => stage.id === displayedManagementStage.value)?.label ?? '章節');
const activeCategoryIndex = computed(() => Math.max(0, categories.value.findIndex((category) => category.id === selectedId.value)));
const categoryIndicatorIndex = computed(() => hoveredCategoryIndex.value ?? activeCategoryIndex.value);
const categoryIndicatorStyle = computed(() => ({
	left: `${((categoryIndicatorIndex.value + 0.5) / categories.value.length) * 100}%`,
	width: `${100 / categories.value.length}%`,
}));

function stageLabels(ids: string[]) {
	return ids.map((id) => stageMap.value.get(id)).filter((stage): stage is ProgressionStage => Boolean(stage));
}

function isDiscouragedUsage(value: ManagementUsage) {
	const text = Array.isArray(value) ? value.join('') : value;
	return text.includes('不建議') || text.includes('不使用');
}

function methodStageUsage(row: ManagementMethodRow) {
	return row[displayedManagementStage.value];
}

function methodStageCondition(row: ManagementMethodRow) {
	return row.stageConditions[displayedManagementStage.value];
}

async function selectManagementStage(stageId: ManagementStageKey) {
	if (selectedManagementStage.value === stageId && displayedManagementStage.value === stageId) return;

	selectedManagementStage.value = stageId;
	const grid = methodStageGrid.value;
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const selection = ++managementStageSelection;
	activeManagementStageAnimation?.cancel();

	if (!grid || reduceMotion) {
		displayedManagementStage.value = stageId;
		return;
	}

	const currentStyle = getComputedStyle(grid);
	const exitAnimation = grid.animate(
		[
			{ opacity: currentStyle.opacity, transform: currentStyle.transform },
			{ opacity: 0, transform: 'translateY(-5px)' },
		],
		{ duration: 180, easing: 'ease-out', fill: 'forwards' },
	);
	activeManagementStageAnimation = exitAnimation;

	try {
		await exitAnimation.finished;
	} catch {
		return;
	}
	if (selection !== managementStageSelection) return;

	displayedManagementStage.value = stageId;
	await nextTick();
	if (selection !== managementStageSelection) return;
	exitAnimation.cancel();

	activeManagementStageAnimation = grid.animate(
		[
			{ opacity: 0, transform: 'translateY(7px)' },
			{ opacity: 1, transform: 'translateY(0)' },
		],
		{ duration: 300, easing: 'cubic-bezier(.22, 1, .36, 1)' },
	);
	try {
		await activeManagementStageAnimation.finished;
	} catch {
		return;
	}
	if (selection === managementStageSelection) activeManagementStageAnimation = undefined;
}

onMounted(async () => {
	try {
		if (['#basic-magic', '#essence'].includes(window.location.hash) && basicGroup.value) {
			const url = new URL(window.location.href);
			url.hash = basicGroup.value.navigation.slug;
			history.replaceState({ craftingCategory: basicGroup.value.navigation.slug }, '', `${url.pathname}${url.search}${url.hash}`);
		}
		await initialize();
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : '無法載入做裝資料。';
	}
});
onUnmounted(() => {
	activeManagementStageAnimation?.cancel();
	dispose();
});
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法載入做裝資料：{{ error }}</p>
	<div v-else class="atlas-shell crafting-shell">
		<div class="atlas-workspace">
			<nav class="campaign-chapter-nav crafting-category-nav" aria-label="做裝分類" @mouseleave="hoveredCategoryIndex = null">
				<ul class="campaign-chapter-list crafting-category-list">
					<li v-for="(category, index) in categories" :key="category.id">
						<button
							class="campaign-chapter-tab"
							:class="{ 'campaign-chapter-tab-active': category.id === selectedId }"
							type="button"
							:aria-pressed="category.id === selectedId"
							@mouseenter="hoveredCategoryIndex = index"
							@focus="hoveredCategoryIndex = index"
							@blur="hoveredCategoryIndex = null"
							@click="selectCategory(category.id)"
						>
							<span class="campaign-chapter-meta">{{ category.englishName }}</span>
							<span class="campaign-chapter-name">{{ category.name }}</span>
						</button>
					</li>
					<li class="campaign-chapter-indicator" :style="categoryIndicatorStyle" aria-hidden="true"></li>
				</ul>
			</nav>

			<section v-if="selectedCategory" ref="detailPanel" class="atlas-detail atlas-detail-motion" aria-live="polite">
				<header class="atlas-intel-copy grid gap-3 px-1">
					<p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">CRAFT INTEL</p>
					<h2 class="font-english-body text-3xl font-bold text-stone-100 [text-wrap:pretty] md:text-4xl">{{ selectedCategory.name }}</h2>
					<p class="max-w-4xl text-base leading-8 text-stone-100 md:text-lg">{{ selectedCategory.summary }}</p>
				</header>

				<div v-if="displayedId === 'progression'" class="grid gap-7 md:gap-8">
					<article class="atlas-content-card crafting-difference-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] crafting-difference-layout">
							<header class="crafting-difference-lead">
								<p class="font-english-decorative">CRAFTING PROGRESSION</p>
								<h3>{{ progression.coreDifferenceGuide.title }}</h3>
								<p class="crafting-rich-text"><template v-for="(part, index) in progression.coreDifferenceGuide.introduction" :key="index"><strong v-if="part.emphasis">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p>
							</header>

							<ol class="crafting-difference-sections m-0 list-none p-0">
								<li v-for="(section, sectionIndex) in progression.coreDifferenceGuide.sections" :key="section.id" class="crafting-difference-section">
									<span aria-hidden="true">{{ String(sectionIndex + 1).padStart(2, '0') }}</span>
									<div>
										<h4>{{ section.title }}</h4>
										<p v-for="(paragraph, paragraphIndex) in section.paragraphs" :key="paragraphIndex" class="crafting-rich-text"><template v-for="(part, partIndex) in paragraph" :key="partIndex"><strong v-if="part.emphasis">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p>
									</div>
								</li>
							</ol>

							<section class="crafting-difference-comparison">
								<h4>{{ progression.coreDifferenceGuide.comparison.title }}</h4>
								<div class="crafting-difference-table-wrap">
									<table>
										<thead><tr><th v-for="column in progression.coreDifferenceGuide.comparison.columns" :key="column" scope="col">{{ column }}</th></tr></thead>
										<tbody><tr v-for="row in progression.coreDifferenceGuide.comparison.rows" :key="row.stage"><th scope="row">{{ row.stage }}</th><td>{{ row.target }}</td><td>{{ row.compromise }}</td></tr></tbody>
									</table>
								</div>
							</section>

							<aside class="crafting-difference-note"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>{{ progression.coreDifferenceGuide.closingNote }}</p></aside>
						</div>
					</article>
				</div>

				<div v-else-if="displayedId === 'workflow-funding'" class="grid gap-7 md:gap-8">
					<article class="atlas-content-card crafting-management-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] crafting-management-layout">
							<section class="crafting-management-section">
								<header><span>01</span><h4>{{ progression.processAndFundingGuide.fundingManagement.title }}</h4></header>
								<div class="crafting-data-grid crafting-funding-grid" role="table" :aria-label="progression.processAndFundingGuide.fundingManagement.title">
									<div class="crafting-data-grid-row crafting-data-grid-header" role="row"><div v-for="column in progression.processAndFundingGuide.fundingManagement.columns" :key="column" role="columnheader">{{ column }}</div></div>
									<div v-for="row in progression.processAndFundingGuide.fundingManagement.rows" :key="row.stage" class="crafting-data-grid-row" role="row">
										<div role="rowheader"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.fundingManagement.columns[0] }}</span><strong>{{ row.stage }}</strong></div>
										<div role="cell"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.fundingManagement.columns[1] }}</span><span>{{ row.target }}</span></div>
										<div role="cell"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.fundingManagement.columns[2] }}</span><span>{{ row.recommendedTarget }}</span></div>
										<div role="cell"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.fundingManagement.columns[3] }}</span><span>{{ row.stopCondition }}</span></div>
									</div>
								</div>
								<aside class="crafting-difference-note"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>{{ progression.processAndFundingGuide.fundingManagement.note }}</p></aside>
							</section>

							<section class="crafting-management-section crafting-resource-principles">
								<header><span>02</span><h4>{{ progression.processAndFundingGuide.resourcePrinciples.title }}</h4></header>
								<p>{{ progression.processAndFundingGuide.resourcePrinciples.introduction }}</p>
								<ul class="m-0 list-none p-0"><li v-for="item in progression.processAndFundingGuide.resourcePrinciples.items" :key="item.stage"><strong>{{ item.stage }}</strong><span>{{ item.guidance }}</span></li></ul>
								<aside class="crafting-difference-note"><span class="material-symbols-outlined" aria-hidden="true">shield</span><p>{{ progression.processAndFundingGuide.resourcePrinciples.closingNote }}</p></aside>
							</section>

							<section class="crafting-management-section">
								<header><span>03</span><h4>{{ progression.processAndFundingGuide.methodStages.title }}</h4></header>
								<nav class="crafting-management-stage-tabs" aria-label="選擇製作階段">
									<button v-for="stage in progression.processAndFundingGuide.methodStages.stageOptions" :key="stage.id" type="button" :class="{ 'is-active': selectedManagementStage === stage.id }" :aria-pressed="selectedManagementStage === stage.id" @click="selectManagementStage(stage.id)">{{ stage.label }}</button>
								</nav>
								<div ref="methodStageGrid" class="crafting-data-grid crafting-method-stage-grid" role="table" :aria-label="progression.processAndFundingGuide.methodStages.title">
									<div class="crafting-data-grid-row crafting-data-grid-header" role="row"><div v-for="(column, index) in progression.processAndFundingGuide.methodStages.columns" :key="column" role="columnheader">{{ index === 1 ? `${displayedManagementStageLabel}・${column}` : column }}</div></div>
									<div v-for="row in progression.processAndFundingGuide.methodStages.rows" :key="row.method" class="crafting-data-grid-row" role="row">
										<div role="rowheader"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.methodStages.columns[0] }}</span><strong>{{ row.method }}</strong></div>
										<div role="cell" :class="{ 'is-muted': isDiscouragedUsage(methodStageUsage(row)) }">
											<span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.methodStages.columns[1] }}</span>
											<ul v-if="Array.isArray(methodStageUsage(row))" class="m-0"><li v-for="item in methodStageUsage(row)" :key="item">{{ item }}</li></ul><span v-else>{{ methodStageUsage(row) }}</span>
										</div>
										<div role="cell"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.methodStages.columns[2] }}</span><span>{{ methodStageCondition(row).recommendedWhen }}</span></div>
										<div role="cell"><span class="crafting-data-grid-label">{{ progression.processAndFundingGuide.methodStages.columns[3] }}</span><span>{{ methodStageCondition(row).avoidWhen }}</span></div>
									</div>
								</div>
							</section>
						</div>
					</article>
				</div>

				<div v-else-if="displayedId === 'crafting-group-basic' && basicGroup" class="crafting-basic-page grid gap-7 md:gap-8">
					<article class="atlas-content-card crafting-basic-overview rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] grid gap-8">
							<header class="crafting-lead">
								<div class="crafting-method-title-row">
									<div><p>低成本・逐步確認</p><h3>先決定從哪一種裝備開始點</h3></div>
									<div class="crafting-stage-tags"><span v-for="stage in stageLabels(basicGroup.stageIds)" :key="stage.id">{{ stage.code }} {{ stage.name }}</span></div>
								</div>
								<p>基礎做裝不是把通貨一次用完，而是每次新增詞綴後重新判斷：目前結果是否值得保留，以及下一顆通貨是否比直接換裝更划算。</p>
								<a href="https://poe2db.tw/tw/Economy" target="_blank" rel="noreferrer">查詢台服通貨交易價格 <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></a>
							</header>
							<ol class="crafting-basic-decision-list m-0 list-none p-0" aria-label="基礎做裝起手判斷">
								<li v-for="(item, index) in basicGroup.decisionGuide" :key="item.title">
									<span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
									<div><h4>{{ item.title }}</h4><p>{{ item.description }}</p></div>
								</li>
							</ol>
						</div>
					</article>

					<article v-for="(method, methodIndex) in basicMethods" :id="method.navigation.slug" :key="method.id" class="atlas-content-card crafting-methods-card crafting-basic-method-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] grid gap-8">
							<header class="crafting-lead">
								<div class="crafting-method-title-row">
									<div><p>{{ String(methodIndex + 1).padStart(2, '0') }}・{{ method.investment }}成本・{{ method.risk }}風險</p><h3>{{ method.name }}</h3></div>
									<div class="crafting-stage-tags"><span v-for="stage in stageLabels(method.stageIds)" :key="stage.id">{{ stage.code }} {{ stage.name }}</span></div>
								</div>
								<p>{{ method.description }}</p>
							</header>
							<div class="crafting-method-detail crafting-method-page-detail">
								<div class="crafting-method-columns"><section><h4>開始條件</h4><ul><li v-for="item in method.startConditions" :key="item">{{ item }}</li></ul></section><section><h4>使用通貨</h4><ul><li v-for="item in method.materials" :key="item">{{ item }}</li></ul></section></div>
								<section class="crafting-method-steps"><h4>點裝流程</h4><ol><li v-for="step in method.steps" :key="step">{{ step }}</li></ol></section>
								<div class="crafting-result-grid"><section><h4>完成標準</h4><p>{{ method.successResult }}</p></section><section><h4>停手條件</h4><p>{{ method.stopWhen }}</p></section></div>
							</div>
						</div>
					</article>
				</div>

				<div v-else-if="selectedMethod" class="grid gap-7 md:gap-8">
					<article class="atlas-content-card crafting-methods-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] grid gap-8">
							<header class="crafting-lead">
								<div class="crafting-method-title-row"><div><p>{{ selectedMethod.investment }}成本・{{ selectedMethod.risk }}風險</p><h3>{{ selectedMethod.name }}</h3></div><div class="crafting-stage-tags"><span v-for="stage in stageLabels(selectedMethod.stageIds)" :key="stage.id">{{ stage.code }} {{ stage.name }}</span></div></div>
								<p>{{ selectedMethod.description }}</p>
								<a href="https://poe2db.tw/tw/Economy" target="_blank" rel="noreferrer">查詢台服通貨交易價格 <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></a>
							</header>
							<div class="crafting-method-detail crafting-method-page-detail">
								<div class="crafting-method-columns"><section><h4>開始條件</h4><ul><li v-for="item in selectedMethod.startConditions" :key="item">{{ item }}</li></ul></section><section><h4>材料</h4><ul><li v-for="item in selectedMethod.materials" :key="item">{{ item }}</li></ul></section></div>
								<section class="crafting-method-steps"><h4>操作步驟</h4><ol><li v-for="step in selectedMethod.steps" :key="step">{{ step }}</li></ol></section>
								<div class="crafting-result-grid"><section><h4>成功結果</h4><p>{{ selectedMethod.successResult }}</p></section><section><h4>停手條件</h4><p>{{ selectedMethod.stopWhen }}</p></section></div>
							</div>
						</div>
					</article>

					<header v-if="selectedMethod.id === 'crafting-method-side-control'" class="crafting-advanced-flow-heading"><p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">ADVANCED FLOW</p><h3>進階完整流程</h3><p>分側製作會串聯破裂、定向補詞與最終加工；以下保留後期裝與高價裝的完整決策流程。</p></header>

					<article v-if="selectedMethod.id === 'crafting-method-side-control' && endgameFlow" class="atlas-content-card crafting-flow-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] grid gap-8"><header class="crafting-flow-header"><div><p>{{ endgameFlow.investment }}成本・{{ endgameFlow.risk }}</p><h3>{{ endgameFlow.name }}</h3></div><p>{{ endgameFlow.goal }}</p></header><ol class="crafting-flow-steps"><li v-for="(step, index) in endgameFlow.steps" :key="step.title"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><h4>{{ step.title }}</h4><p>{{ step.description }}</p></div></li></ol></div>
					</article>

					<article v-if="selectedMethod.id === 'crafting-method-side-control' && highBudgetFlow" class="atlas-content-card crafting-flow-card crafting-high-budget-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
						<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
						<div class="relative z-[1] grid gap-8">
							<header class="crafting-flow-header"><div><p>{{ highBudgetFlow.investment }}成本・{{ highBudgetFlow.risk }}</p><h3>{{ highBudgetFlow.name }}</h3></div><p>{{ highBudgetFlow.goal }}</p></header>
							<div class="crafting-high-budget-notice">
								<p>{{ highBudgetFlow.coreRule }}</p>
								<strong v-if="highBudgetFlow.budgetNotice">{{ highBudgetFlow.budgetNotice }}</strong>
							</div>
							<ol class="crafting-flow-steps"><li v-for="(step, index) in highBudgetFlow.steps" :key="step.title"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><h4>{{ step.title }}</h4><p>{{ step.description }}</p></div></li></ol>
							<section class="crafting-outcomes"><h3>破裂結果處理</h3><div><article v-for="outcome in highBudgetFlow.fractureOutcomes" :key="outcome.result" :data-tone="outcome.tone"><h4>{{ outcome.result }}</h4><p>{{ outcome.action }}</p></article></div></section>
						</div>
					</article>
					<article v-if="selectedMethod.id === 'crafting-method-side-control'" class="atlas-content-card crafting-checklist-card rounded-[8px] border border-stone-100/15 p-6 md:p-8"><div class="relative z-[1]"><header><h3>高價製作前檢查表</h3><p>任何一組未確認，都不應開始投入高價材料。</p></header><div><section v-for="group in methods.preflightChecklist" :key="group.group"><h4>{{ group.group }}</h4><ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul></section></div></div></article>
				</div>

				<footer class="crafting-source-footer"><p>遊戲機制與市場成本可能隨版本調整；製作前請重新確認詞綴池、材料效果與台服價格。</p><div><a v-for="source in allSources" :key="source.url" :href="source.url" target="_blank" rel="noreferrer">{{ source.name }} <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></a></div></footer>
			</section>
		</div>
	</div>
</template>
