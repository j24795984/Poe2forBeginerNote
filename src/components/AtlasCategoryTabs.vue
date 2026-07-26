<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { loadPublicJson } from '../services/dataService';

type ContentItem = { id: string; text: string };
type ContentSection = { id: string; title: string; description?: string; bullets?: ContentItem[]; steps?: ContentItem[]; table?: { headers: string[]; rows: string[][] } };
type AtlasCategory = { id: string; slug: string; name: string; summary: string; sections: ContentSection[]; leagueMechanicIds?: string[] };
type LeagueMechanic = { id: string; name: string; summary: string };
type AtlasData = { id: string; atlas: { id: string; categories: AtlasCategory[] }; leagueMechanics: LeagueMechanic[] };
type GsapTween = { kill: () => void };
type Gsap = { to: (target: Element, vars: Record<string, unknown>) => GsapTween; fromTo: (target: Element, from: Record<string, unknown>, to: Record<string, unknown>) => GsapTween };

const atlasData = ref<AtlasData>();
const selectedId = ref('');
const displayedId = ref('');
const error = ref('');
const detailPanel = ref<HTMLElement>();
const isChanging = ref(false);
const leavingId = ref('');
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
let activeTransition: GsapTween | undefined;
let selectionMotionTimer: number | undefined;

const selectedCategory = computed(() => atlasData.value?.atlas.categories.find((category) => category.id === displayedId.value));
const selectedMechanics = computed(() => {
	if (!atlasData.value || !selectedCategory.value?.leagueMechanicIds) return [];
	const mechanics = new Map(atlasData.value.leagueMechanics.map((mechanic) => [mechanic.id, mechanic]));
	return selectedCategory.value.leagueMechanicIds.map((id) => mechanics.get(id)).filter((mechanic): mechanic is LeagueMechanic => Boolean(mechanic));
});

function refreshScrollbar() { window.dispatchEvent(new Event('site-content-resize')); }
function scrollBehavior(): ScrollBehavior { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
function scrollToPosition(top: number) {
	const detail = { top, behavior: scrollBehavior(), handled: false };
	window.dispatchEvent(new CustomEvent('site-scroll-to', { detail }));
	if (!detail.handled) window.scrollTo({ top, behavior: detail.behavior });
}
function scrollToPageTop() { scrollToPosition(0); }
function scrollToMechanic(id: string) {
	const target = document.getElementById(`league-mechanic-${id}`);
	if (!target) return;
	const menuHeight = document.querySelector<HTMLElement>('[data-top-menu]')?.offsetHeight ?? 0;
	scrollToPosition(Math.max(0, target.getBoundingClientRect().top + window.scrollY - menuHeight - 24));
}
function setSelectedCategory(id: string) {
	if (id === selectedId.value) return;
	const previousId = selectedId.value;
	leavingId.value = previousId;
	selectedId.value = id;
	if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
	selectionMotionTimer = window.setTimeout(() => { if (leavingId.value === previousId) leavingId.value = ''; }, 460);
}
function getRouteCategory() { return atlasData.value?.atlas.categories.find((category) => category.slug === window.location.hash.slice(1)); }
function updateCategoryRoute(id: string) {
	const category = atlasData.value?.atlas.categories.find((item) => item.id === id);
	if (!category || window.location.hash === `#${category.slug}`) return;
	const url = new URL(window.location.href);
	url.hash = category.slug;
	history.pushState({ atlasCategory: category.slug }, '', `${url.pathname}${url.search}${url.hash}`);
}
function selectCategory(id: string, options: { updateRoute?: boolean; scrollToTop?: boolean } = {}) {
	const { updateRoute = true, scrollToTop = true } = options;
	if (updateRoute) updateCategoryRoute(id);
	if (scrollToTop) scrollToPageTop();
	if (isChanging.value || id === selectedId.value) return;
	const browserWindow = window as typeof window & { gsap?: Gsap };
	const panel = detailPanel.value;
	if (!panel || !browserWindow.gsap) {
		setSelectedCategory(id);
		displayedId.value = id;
		nextTick().then(refreshScrollbar);
		return;
	}
	isChanging.value = true;
	setSelectedCategory(id);
	activeTransition?.kill();
	activeTransition = browserWindow.gsap.to(panel, {
		opacity: 0, filter: 'blur(14px)', y: -10, duration: 0.42, ease: 'power2.in', overwrite: 'auto',
		onComplete: async () => {
			displayedId.value = id;
			await nextTick();
			refreshScrollbar();
			activeTransition = browserWindow.gsap?.fromTo(panel, { opacity: 0, filter: 'blur(6px)', y: 24 }, {
				opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.62, ease: 'power3.out', overwrite: 'auto', clearProps: 'filter,transform', onComplete: () => { isChanging.value = false; }
			});
		}
	});
}
function syncCategoryFromRoute() {
	const category = getRouteCategory() ?? atlasData.value?.atlas.categories[0];
	if (category) selectCategory(category.id, { updateRoute: false });
}
onMounted(async () => {
	try {
		atlasData.value = await loadPublicJson<AtlasData>('data/atlas.json');
		selectedId.value = getRouteCategory()?.id ?? atlasData.value.atlas.categories[0]?.id ?? '';
		displayedId.value = selectedId.value;
		await nextTick();
		refreshScrollbar();
		window.addEventListener('popstate', syncCategoryFromRoute);
		window.addEventListener('hashchange', syncCategoryFromRoute);
	} catch (cause) { error.value = cause instanceof Error ? cause.message : '無法讀取 atlas.json。'; }
});
onUnmounted(() => {
	activeTransition?.kill();
	if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
	window.removeEventListener('popstate', syncCategoryFromRoute);
	window.removeEventListener('hashchange', syncCategoryFromRoute);
});
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法讀取 atlas.json：{{ error }}</p>
	<p v-else-if="!atlasData" class="atlas-accent-border-20 border bg-black/35 p-5 text-stone-300">正在載入輿圖資料。</p>
	<div v-else-if="selectedCategory" class="atlas-shell">
		<div class="atlas-workspace">
			<nav class="atlas-category-nav" aria-label="輿圖分類"><ul class="atlas-category-nav-list m-0 list-none p-0">
				<li v-for="category in atlasData.atlas.categories" :key="category.id"><button class="atlas-accent-button atlas-category-button group flex min-h-14 w-full cursor-pointer items-center justify-between rounded-[8px] border border-stone-200/20 bg-black/45 px-4 py-3 text-left text-sm font-semibold text-stone-200 transition focus-visible:outline-2 focus-visible:outline-offset-2" :class="{ 'atlas-accent-selected text-stone-950': category.id === selectedId, 'atlas-accent-leaving': category.id === leavingId, 'hover:bg-stone-900/80 hover:text-stone-100': category.id !== selectedId && category.id !== leavingId }" type="button" :aria-pressed="category.id === selectedId" @click="selectCategory(category.id)"><span>{{ category.name }}</span><span class="font-english-body text-xs opacity-60">0{{ atlasData.atlas.categories.indexOf(category) + 1 }}</span></button></li>
			</ul></nav>
			<section ref="detailPanel" class="atlas-detail atlas-detail-motion" aria-live="polite">
				<header class="atlas-intel-copy mb-7 grid gap-3 px-1 md:mb-9"><p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">ATLAS INTEL</p><h2 class="font-english-body text-3xl font-bold text-stone-100 [text-wrap:pretty] md:text-4xl">{{ selectedCategory.name }}</h2><p class="max-w-3xl text-base leading-8 text-stone-100 md:text-lg">{{ selectedCategory.summary }}</p></header>
				<ul class="m-0 grid list-none gap-7 p-0 md:gap-8">
					<li v-for="section in selectedCategory.sections" :key="section.id" class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><article><h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">{{ section.title }}</h3><p v-if="section.description" class="mt-4 max-w-4xl leading-8 text-stone-300">{{ section.description }}</p><ul v-if="section.bullets" class="atlas-accent-border-35 mt-6 grid gap-3 border-l pl-5 text-stone-300 md:max-w-4xl"><li v-for="item in section.bullets" :key="item.id" class="leading-7">{{ item.text }}</li></ul><ol v-if="section.steps" class="mt-6 grid gap-4 md:max-w-4xl"><li v-for="(step, index) in section.steps" :key="step.id" class="grid grid-cols-[2rem_1fr] gap-3 leading-7 text-stone-300"><span class="atlas-accent-text font-english-body text-lg font-bold">0{{ index + 1 }}</span><span>{{ step.text }}</span></li></ol><div v-if="section.table" class="mt-6 overflow-x-auto"><table class="w-full min-w-[38rem] border-collapse text-left text-sm"><thead class="atlas-accent-text font-english-body"><tr><th v-for="header in section.table.headers" :key="header" scope="col" class="atlas-accent-border-20 border bg-stone-900 px-4 py-3 font-semibold">{{ header }}</th></tr></thead><tbody><tr v-for="(row, rowIndex) in section.table.rows" :key="rowIndex" class="odd:bg-stone-900/45"><td v-for="(cell, cellIndex) in row" :key="cellIndex" class="border border-stone-100/10 px-4 py-4 align-top leading-6 text-stone-300">{{ cell }}</td></tr></tbody></table></div></article></li>
					<li v-if="selectedMechanics.length" class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><section aria-labelledby="league-mechanics-heading"><h3 id="league-mechanics-heading" class="atlas-accent-text font-english-body text-2xl font-semibold">目前聯盟機制</h3><nav class="atlas-league-nav mt-6" aria-label="聯盟機制快速導覽"><ul class="atlas-league-nav-list m-0 list-none p-0"><li v-for="mechanic in selectedMechanics" :key="mechanic.id"><button class="atlas-league-nav-button" type="button" @click="scrollToMechanic(mechanic.id)">{{ mechanic.name }}</button></li></ul></nav><div class="atlas-league-mechanic-list mt-6"><article v-for="mechanic in selectedMechanics" :id="`league-mechanic-${mechanic.id}`" :key="mechanic.id" class="atlas-league-mechanic px-5 py-5 md:px-6"><h4 class="atlas-accent-text font-english-body text-xl font-semibold">{{ mechanic.name }}</h4><p class="mt-3 leading-7 text-stone-300">{{ mechanic.summary }}</p></article></div></section></li>
				</ul>
			</section>
		</div>
	</div>
</template>
