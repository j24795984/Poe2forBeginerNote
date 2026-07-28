<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useCategoryTabs } from '../composables/useCategoryTabs';
import { requestSiteScrollToElement } from '../services/siteScroll';

const categories = [
	{ id: 'campaign', slug: 'campaign', name: '拓荒', summary: '先建立能穩定推進的角色底盤，再依流派需求補足傷害與防禦。' },
	{ id: 'build-list', slug: 'build-list', name: '常見流派', summary: '常見流派將依角色定位與核心機制整理。' },
] as const;

type AffixPair = { major?: string[]; minor?: string[] };
type EquipmentAffix = { id: string; name: string; prefix?: AffixPair; suffix?: AffixPair };
type BuildsData = { id: string; equipmentGroups: { id: string; name: string; items: EquipmentAffix[] }[] };

const props = defineProps<{ initialData: BuildsData }>();
const detailPanel = ref<HTMLElement>();
const equipmentArticle = ref<HTMLElement>();
const defenseArticle = ref<HTMLElement>();
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
const buildsData = ref<BuildsData>(props.initialData);
const error = ref('');
const equipmentAffixes = computed(() => buildsData.value?.equipmentGroups.flatMap((group) => group.items) ?? []);
const { selectedId, displayedId, leavingId, displayedItem: selectedCategory, select: selectCategory, initialize, dispose } = useCategoryTabs({ items: () => categories, panel: detailPanel, historyStateKey: 'buildsCategory' });

function scrollToArticle(article: HTMLElement | undefined) {
	if (!article) return;
	const menuHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-menu-height')) || 0;
	requestSiteScrollToElement(article, menuHeight + 24);
}

onMounted(async () => {
	try {
		await initialize();
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : '無法載入拓荒與流派資料。';
	}
});
onUnmounted(dispose);
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法載入拓荒與流派資料：{{ error }}</p>
	<div v-else class="atlas-shell">
		<div class="atlas-workspace">
			<nav class="atlas-category-nav" aria-label="拓荒與流派分類">
				<ul class="atlas-category-nav-list m-0 list-none p-0">
					<li v-for="category in categories" :key="category.id">
						<button class="atlas-category-button" :class="{ 'atlas-accent-selected': category.id === selectedId, 'atlas-accent-leaving': category.id === leavingId }" type="button" :aria-pressed="category.id === selectedId" @click="selectCategory(category.id)"><span>{{ category.name }}</span><span class="font-english-body text-xs opacity-60">0{{ categories.indexOf(category) + 1 }}</span></button>
					</li>
				</ul>
			</nav>

			<section v-if="selectedCategory" ref="detailPanel" class="atlas-detail atlas-detail-motion" aria-live="polite">
				<header class="atlas-intel-copy grid gap-3 px-1"><p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">BUILD INTEL</p><h2 class="font-english-body text-3xl font-bold text-stone-100 [text-wrap:pretty] md:text-4xl">{{ selectedCategory.name }}</h2><p class="max-w-3xl text-base leading-8 text-stone-100 md:text-lg">{{ selectedCategory.summary }}</p></header>

				<div v-if="displayedId === 'campaign'" class="grid gap-7 md:gap-8">
					<article class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><div class="relative z-[1] grid gap-7 md:gap-8"><nav class="content-quick-nav px-1" aria-label="拓荒內容快速導覽"><ul class="content-quick-nav-list m-0 list-none p-0"><li><button class="content-quick-nav-button" type="button" @click="scrollToArticle(defenseArticle)">核心防禦機制</button></li><li><button class="content-quick-nav-button" type="button" @click="scrollToArticle(equipmentArticle)">裝備詞綴選擇【泛用】</button></li></ul></nav><section ref="defenseArticle"><header><h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">核心防禦機制</h3></header><div class="mt-7 grid gap-6"><section class="builds-defense-section"><h4>生命容量</h4><p>不管防禦面如何，沒有生命就無法承受傷害。</p><p>核心分為三大類：</p><ul><li><strong>複合流派：</strong>能量護頓加生命。</li><li><strong>生命流派：</strong>生命詞為主（通常是攻擊相關流派）。</li><li><strong>ES 流派：</strong>能量護頓為主（通常法系相關流派）。</li></ul></section><section class="builds-defense-section"><h4>防禦機制</h4><p>通常會複合兩種或以上的防禦機制。</p><div class="grid gap-5 md:grid-cols-3"><section class="builds-defense-group"><h5>敏捷系統</h5><p>依靠閃避機率躲避傷害。</p><ul><li>閃避</li><li>偏斜（部分詞墜可以讓護甲也可以轉偏斜）</li></ul></section><section class="builds-defense-group"><h5>力量系統</h5><p>依據護甲值，進行傷害減傷。</p><ul><li>護甲</li></ul></section><section class="builds-defense-group"><h5>智力系統</h5><p>能量護頓、魔力承受。</p><p>注意：ES 系統沒有減傷或是躲避傷害，因此傷害會「全吃」，必須配合其他防禦機制。</p></section></div></section><section class="builds-defense-section"><h4>抗性</h4><p>火焰、冰冷、閃電、渾沌。</p></section></div></section><section ref="equipmentArticle"><header><h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">裝備詞綴選擇【泛用】</h3><div class="builds-copy mt-4"><p>依據流派以及需要的詞墜挑選裝備。優先配置有特定詞墜（流派必須）的裝備，其餘的部分再補防禦（防禦機制、抗性）以及能力值等。</p><p>能力值可以由「沒有能力值限制」的裝備（飾品、腰帶）補，或是能力值需求較低的裝備補；否則可能會遇到裝備沒辦法穿的情況發生。</p></div></header><ul class="builds-affix-list mt-10 md:mt-12"><li v-for="equipment in equipmentAffixes" :key="equipment.id" class="builds-affix-item"><p class="builds-affix-equipment">{{ equipment.name }}</p><div class="builds-affix-grid grid"><section v-for="affix in [{ label: '前墜', values: equipment.prefix }, { label: '後墜', values: equipment.suffix }]" :key="affix.label" class="builds-affix-type"><p class="builds-affix-type-label">{{ affix.label }}</p><div class="builds-affix-group"><p>主要</p><ul v-if="affix.values?.major"><li v-for="value in affix.values.major" :key="value">{{ value }}</li></ul><span v-else>—</span></div><div class="builds-affix-group"><p>次要</p><ul v-if="affix.values?.minor"><li v-for="value in affix.values.minor" :key="value">{{ value }}</li></ul><span v-else>—</span></div></section></div></li></ul><div class="builds-empty-headings mt-8 grid gap-4 border-t border-stone-100/15 pt-6"><h4 class="atlas-accent-text font-english-body text-xl font-semibold">傷害</h4><h4 class="atlas-accent-text font-english-body text-xl font-semibold">防禦</h4></div></section></div></article>
				</div>

				<article v-else class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><div><h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">常見流派</h3></div></article>
			</section>
		</div>
	</div>
</template>
