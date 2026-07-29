<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type LocalizedName = { zh_tw: string | null; en: string };
type Price = { value_d: number; min_d?: number; max_d?: number; currency: string };
type CurrencyItem = {
	id: string;
	name: LocalizedName;
	category: 'currency';
	price: Price;
	value_tier: ValueTier;
	source_url: string;
	note_zh_tw?: string;
	requires_manual_check: boolean;
};
type UniqueItem = {
	id: string;
	name: LocalizedName;
	category: string;
	price: Price;
	value_tier: ValueTier;
	poe2db_url: string;
	important_factors?: string[];
	requires_manual_check: boolean;
};
type MechanicItem = {
	id: string;
	name: LocalizedName;
	category: string;
	item_role?: string;
	price: Price;
	value_tier: ValueTier;
	requires_manual_check: boolean;
};
type ValueTier = 'baseline' | 'valuable' | 'high_value' | 'very_high_value' | 'jackpot';
type ValuableItem = {
	key: string;
	group: 'currency' | 'unique' | 'fragment';
	subcategory: string;
	name: string;
	englishName: string;
	url: string;
	dropArea: string;
	boss: string;
	value: number;
	valueLabel: string;
	note: string;
	tier: ValueTier;
};
type ValuableItemsData = {
	currency: { items: CurrencyItem[]; scope: { checked_at: string } };
	uniques: { items: UniqueItem[]; scope: { checked_at: string } };
	fragments: { items: MechanicItem[]; scope: { checked_at: string } };
};

const props = defineProps<{ initialData: ValuableItemsData }>();

const categoryOptions = [
	{ id: 'all', label: '全部' },
	{ id: 'currency', label: '通貨' },
	{ id: 'unique', label: '傳奇裝備與珠寶' },
	{ id: 'fragment', label: '碎片與機制物品' },
] as const;
const tierOptions: { id: 'all' | ValueTier; label: string }[] = [
	{ id: 'all', label: '所有價值' },
	{ id: 'jackpot', label: '100 D 以上' },
	{ id: 'very_high_value', label: '20–99 D' },
	{ id: 'high_value', label: '5–19 D' },
	{ id: 'valuable', label: '1–4 D' },
	{ id: 'baseline', label: '1 D 基準' },
];
const categoryMeta: Record<string, { label: string; area: string; note: string }> = {
	fragments: { label: '終局碎片', area: '終局內容', note: '終局入場物、危機碎片或聖物鑰匙；使用前建議先確認對應遭遇與難度。' },
	ritual: { label: '祭祀', area: '祭祀', note: '由祭祀機制取得；部分預兆需在符合條件時由背包自動觸發。' },
	essences: { label: '精髓', area: '精髓遭遇', note: '由精髓機制取得，用於定向製作裝備。' },
	breach: { label: '裂痕', area: '裂痕', note: '由裂痕機制取得；祭品與催化劑用途不同，使用前請查看物品說明。' },
	delirium: { label: '譫妄', area: '譫妄', note: '由譫妄機制取得，用於相關終局內容或製作。' },
	expedition: { label: '探險', area: '探險', note: '由探險機制取得；礦石與特殊材料可用於其對應製作流程。' },
	runes: { label: '符文', area: '符文／符文鍛造', note: '用於符文相關製作；高價詞綴材料在使用前建議再次查價。' },
	soul_cores: { label: '靈魂核心', area: '烏爾托克／靈魂核心內容', note: '嵌入裝備提供固定效果；鑲嵌前先確認是否能回收或替換。' },
	idols: { label: '雕像', area: '偶像相關內容', note: '由對應聯盟機制取得；價值會受類型與市場需求影響。' },
	uncut_gems: { label: '未切割寶石', area: '全域／指定等級內容', note: '可切割為對應等級的技能、輔助或精魂寶石。' },
	abyss: { label: '深淵', area: '深淵', note: '由深淵機制取得；珠寶與特殊物品的詞綴差異會顯著影響價格。' },
	gems: { label: '特殊寶石', area: '對應終局機制', note: '寶石等級、品質與腐化結果會影響實際價值。' },
	atziris_temple: { label: '阿茲里神殿', area: '阿茲里神殿', note: '由阿茲里神殿相關內容取得，用於神殿製作或進程。' },
};
const factorLabels: Record<string, string> = {
	allocated_passive_count: '配置的天賦數',
	charm_slots: '護符欄位數',
	corruption: '腐化結果',
	damage_per_ailment_roll: '每種異常狀態傷害數值',
	effect_roll: '效果數值',
	elemental_resistance_roll: '元素抗性數值',
	legacy_rolls: '舊版數值',
	corrupted_magic_jewel_synergy: '腐化魔法珠寶搭配',
};

const selectedCategory = ref<(typeof categoryOptions)[number]['id']>('all');
const selectedTier = ref<'all' | ValueTier>('all');
const selectedSource = ref('all');
const query = ref('');

function itemName(name: LocalizedName) {
	return name.zh_tw || name.en;
}

function itemUrl(englishName: string) {
	const slug = englishName
		.normalize('NFKD')
		.replace(/[’']/g, '')
		.trim()
		.replace(/[\s-]+/g, '_');
	return `https://poe2db.tw/tw/${encodeURIComponent(slug)}`;
}

function bossFor(item: MechanicItem) {
	const name = item.name.en.toLowerCase();
	const bossNames: [string, string][] = [
		['trialmaster', '試煉大師'],
		['zarokh', '時間之神札洛克'],
		['xesht', '裂痕領主薛特'],
		['arbiter', '灰燼仲裁者'],
		['olroth', '奧爾羅斯'],
	];
	return bossNames.find(([keyword]) => name.includes(keyword))?.[1] ?? '無';
}

function priceLabel(price: Price) {
	if (price.min_d != null && price.max_d != null && price.min_d !== price.max_d) {
		return `約 ${price.min_d.toLocaleString()}–${price.max_d.toLocaleString()} D`;
	}
	return `約 ${price.value_d.toLocaleString()} D`;
}

const items = computed<ValuableItem[]>(() => {
	const currency = props.initialData.currency.items.map((item) => ({
		key: `currency-${item.id}`,
		group: 'currency' as const,
		subcategory: 'currency',
		name: itemName(item.name),
		englishName: item.name.en,
		url: item.source_url,
		dropArea: '無',
		boss: '無',
		value: item.price.value_d,
		valueLabel: priceLabel(item.price),
		note: item.note_zh_tw || (item.requires_manual_check ? '供給或成交量有限，交易前請重新查價。' : '一般通貨掉落，亦可透過玩家交易取得。'),
		tier: item.value_tier,
	}));
	const uniques = props.initialData.uniques.items.map((item) => {
		const factors = item.important_factors?.map((factor) => factorLabels[factor] || factor).join('、');
		return {
			key: `unique-${item.id}`,
			group: 'unique' as const,
			subcategory: item.category,
			name: itemName(item.name),
			englishName: item.name.en,
			url: (item.poe2db_url || itemUrl(item.name.en)).replace('/us/', '/tw/'),
			dropArea: '無',
			boss: '無',
			value: item.price.value_d,
			valueLabel: priceLabel(item.price),
			note: factors ? `價格關鍵：${factors}。` : item.requires_manual_check ? '成交量有限，詞綴或版本可能造成大幅價差。' : '實際價格會受詞綴與腐化結果影響。',
			tier: item.value_tier,
		};
	});
	const fragments = props.initialData.fragments.items.map((item) => {
		const meta = categoryMeta[item.category] || { label: item.category, area: '無', note: '無' };
		return {
			key: `fragment-${item.id}`,
			group: 'fragment' as const,
			subcategory: item.category,
			name: itemName(item.name),
			englishName: item.name.en,
			url: itemUrl(item.name.en),
			dropArea: meta.area,
			boss: bossFor(item),
			value: item.price.value_d,
			valueLabel: priceLabel(item.price),
			note: item.requires_manual_check ? `${meta.note} 低交易量品項，交易前請重新查價。` : meta.note,
			tier: item.value_tier,
		};
	});
	return [...currency, ...uniques, ...fragments].sort((a, b) => b.value - a.value);
});

const sourceOptions = computed(() => {
	if (selectedCategory.value !== 'fragment') return [];
	return Object.entries(categoryMeta)
		.filter(([id]) => items.value.some((item) => item.subcategory === id))
		.map(([id, meta]) => ({ id, label: meta.label }));
});

const counts = computed(() => ({
	all: items.value.length,
	currency: items.value.filter((item) => item.group === 'currency').length,
	unique: items.value.filter((item) => item.group === 'unique').length,
	fragment: items.value.filter((item) => item.group === 'fragment').length,
}));

const filteredItems = computed(() => {
	const normalizedQuery = query.value.trim().toLocaleLowerCase();
	return items.value.filter((item) => {
		if (selectedCategory.value !== 'all' && item.group !== selectedCategory.value) return false;
		if (selectedTier.value !== 'all' && item.tier !== selectedTier.value) return false;
		if (selectedSource.value !== 'all' && item.subcategory !== selectedSource.value) return false;
		if (!normalizedQuery) return true;
		return `${item.name} ${item.englishName} ${item.dropArea} ${item.boss}`.toLocaleLowerCase().includes(normalizedQuery);
	});
});

const checkedAt = computed(() => props.initialData.currency.scope.checked_at);

watch(selectedCategory, () => {
	selectedSource.value = 'all';
});

watch(filteredItems, () => {
	if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('site-content-resize'));
});
</script>

<template>
	<div class="valuable-items-shell">
		<header class="valuable-items-intro">
			<div>
				<p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">VALUABLE ITEM INDEX</p>
				<h2>先看價值，再決定要不要撿</h2>
				<p>價格以美服市場的神聖石（D）粗估，會隨版本、詞綴與供需變動；高價物品交易前請再次查價。</p>
			</div>
			<p class="valuable-items-updated">資料日期 <time :datetime="checkedAt">{{ checkedAt }}</time></p>
		</header>

		<nav class="valuable-items-nav" aria-label="高價值物品分類及篩選">
			<div class="valuable-items-category-list" role="group" aria-label="物品分類">
				<button
					v-for="option in categoryOptions"
					:key="option.id"
					type="button"
					:class="{ 'is-active': selectedCategory === option.id }"
					:aria-pressed="selectedCategory === option.id"
					@click="selectedCategory = option.id"
				>
					<span>{{ option.label }}</span>
					<span aria-hidden="true">{{ counts[option.id] }}</span>
				</button>
			</div>

			<div class="valuable-items-filters">
				<label class="valuable-items-search">
					<span class="material-symbols-outlined" aria-hidden="true">search</span>
					<span class="sr-only">搜尋物品</span>
					<input v-model="query" type="search" placeholder="搜尋物品、區域或 Boss" />
				</label>
				<label>
					<span>價值</span>
					<select v-model="selectedTier">
						<option v-for="option in tierOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
					</select>
				</label>
				<label v-if="sourceOptions.length">
					<span>機制</span>
					<select v-model="selectedSource">
						<option value="all">所有機制</option>
						<option v-for="option in sourceOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
					</select>
				</label>
			</div>
		</nav>

		<div class="valuable-items-result-meta" aria-live="polite">
			<p>顯示 <strong>{{ filteredItems.length }}</strong> 件物品</p>
			<p>價格僅供快速辨識，不代表實際成交價。</p>
		</div>

		<div v-if="filteredItems.length" class="valuable-items-grid" role="table" aria-label="高價值物品列表">
			<div class="valuable-items-grid-header" role="row">
				<div role="columnheader">物品名稱</div>
				<div role="columnheader">掉落區域</div>
				<div role="columnheader">相關 BOSS</div>
				<div role="columnheader">價值</div>
				<div role="columnheader">補充</div>
			</div>
			<article v-for="item in filteredItems" :key="item.key" class="valuable-items-grid-row" role="row">
				<div role="cell" data-label="物品名稱">
					<a :href="item.url" target="_blank" rel="noreferrer">
						<span>{{ item.name }}</span>
						<small v-if="item.name !== item.englishName">{{ item.englishName }}</small>
						<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
					</a>
				</div>
				<div role="cell" data-label="掉落區域">{{ item.dropArea }}</div>
				<div role="cell" data-label="相關 BOSS">{{ item.boss }}</div>
				<div class="valuable-items-price" role="cell" data-label="價值">{{ item.valueLabel }}</div>
				<div role="cell" data-label="補充">{{ item.note }}</div>
			</article>
		</div>
		<div v-else class="valuable-items-empty" role="status">
			<span class="material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
			<p>沒有符合目前篩選條件的物品。</p>
			<button type="button" @click="selectedCategory = 'all'; selectedTier = 'all'; selectedSource = 'all'; query = ''">清除篩選</button>
		</div>
	</div>
</template>
