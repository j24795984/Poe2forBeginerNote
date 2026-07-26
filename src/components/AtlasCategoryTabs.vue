<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { loadPublicJson } from '../services/dataService';

type ContentItem = { id: string; text: string };
type ContentSection = {
	id: string;
	title: string;
	description?: string;
	bullets?: ContentItem[];
	steps?: ContentItem[];
	table?: { headers: string[]; rows: string[][] };
};
type AtlasCategory = { id: string; name: string; summary: string; sections: ContentSection[]; leagueMechanicIds?: string[] };
type LeagueMechanic = { id: string; name: string; summary: string };
type AtlasData = { id: string; atlas: { id: string; categories: AtlasCategory[] }; leagueMechanics: LeagueMechanic[] };
type GsapTween = { kill: () => void };
type Gsap = {
	registerPlugin: (plugin: unknown) => void;
	fromTo: (target: Element | string, from: Record<string, unknown>, to: Record<string, unknown>) => GsapTween;
	to: (target: Element, vars: Record<string, unknown>) => GsapTween;
};

const atlasData = ref<AtlasData>();
const selectedId = ref('');
const displayedId = ref('');
const error = ref('');
const atlasRoot = ref<HTMLElement>();
const detailPanel = ref<HTMLElement>();
const isChanging = ref(false);
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
let activeTransition: GsapTween | undefined;
const leavingId = ref('');
let selectionMotionTimer: number | undefined;
const selectedCategory = computed(() => atlasData.value?.atlas.categories.find((category) => category.id === displayedId.value));
const selectedMechanics = computed(() => {
	if (!atlasData.value || !selectedCategory.value?.leagueMechanicIds) return [];
	const mechanicsById = new Map(atlasData.value.leagueMechanics.map((mechanic) => [mechanic.id, mechanic]));
	return selectedCategory.value.leagueMechanicIds.map((id) => mechanicsById.get(id)).filter((mechanic): mechanic is LeagueMechanic => Boolean(mechanic));
});

function refreshScrollbar() {
	window.dispatchEvent(new Event('site-content-resize'));
}

function scrollToPageTop() {
	window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function setSelectedCategory(id: string) {
	const previousId = selectedId.value;
	leavingId.value = previousId;
	selectedId.value = id;
	if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
	selectionMotionTimer = window.setTimeout(() => {
		if (leavingId.value === previousId) leavingId.value = '';
	}, 460);
}

function selectCategory(id: string) {
	if (id === selectedId.value || isChanging.value) return;
	scrollToPageTop();
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
		opacity: 0,
		filter: 'blur(14px)',
		y: -10,
		duration: 0.42,
		ease: 'power2.in',
		overwrite: 'auto',
		onComplete: async () => {
			displayedId.value = id;
			await nextTick();
			refreshScrollbar();
			activeTransition = browserWindow.gsap?.fromTo(panel, { opacity: 0, filter: 'blur(6px)', y: 24 }, {
				opacity: 1,
				filter: 'blur(0px)',
				y: 0,
				duration: 0.62,
				ease: 'power3.out',
				overwrite: 'auto',
				clearProps: 'filter,transform',
				onComplete: () => { isChanging.value = false; }
			});
		}
	});
}

onMounted(async () => {
	try {
		atlasData.value = await loadPublicJson<AtlasData>('data/atlas.json');
		selectedId.value = atlasData.value.atlas.categories[0]?.id ?? '';
		displayedId.value = selectedId.value;
		await nextTick();
		refreshScrollbar();
		const browserWindow = window as typeof window & { gsap?: Gsap; ScrollTrigger?: unknown };
		if (browserWindow.gsap) {
			if (browserWindow.ScrollTrigger) browserWindow.gsap.registerPlugin(browserWindow.ScrollTrigger);
			browserWindow.gsap.fromTo('.atlas-motion-hero', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' });
			browserWindow.gsap.fromTo('.atlas-scroll-reveal', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.14, ease: 'power2.out', scrollTrigger: { trigger: '#atlas-content', start: 'top 78%' } });
		}
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : '無法讀取輿圖資料。';
	}
});

onUnmounted(() => {
	activeTransition?.kill();
	if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
});
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法讀取 atlas.json：{{ error }}</p>
	<p v-else-if="!atlasData" class="atlas-accent-border-20 border bg-black/35 p-5 text-stone-300">載入輿圖資料中…</p>
	<div v-else-if="selectedCategory" ref="atlasRoot" class="atlas-shell">
		<div class="atlas-workspace">
		<nav class="atlas-category-nav" aria-label="輿圖分類">
			<ul class="atlas-category-nav-list m-0 list-none p-0">
				<li v-for="category in atlasData.atlas.categories" :key="category.id">
					<button class="atlas-accent-button atlas-category-button group flex min-h-14 w-full cursor-pointer items-center justify-between rounded-[8px] border border-stone-200/20 bg-black/45 px-4 py-3 text-left text-sm font-semibold text-stone-200 transition focus-visible:outline-2 focus-visible:outline-offset-2" :class="{ 'atlas-accent-selected text-stone-950': category.id === selectedId, 'atlas-accent-leaving': category.id === leavingId, 'hover:bg-stone-900/80 hover:text-stone-100': category.id !== selectedId && category.id !== leavingId }" type="button" :aria-pressed="category.id === selectedId" @click="selectCategory(category.id)">
						<span>{{ category.name }}</span><span class="font-english-body text-xs opacity-60">0{{ atlasData.atlas.categories.indexOf(category) + 1 }}</span>
					</button>
				</li>
			</ul>
		</nav>

		<section ref="detailPanel" class="atlas-detail atlas-detail-motion" aria-live="polite">
			<header class="atlas-intel-copy mb-7 grid gap-3 px-1 md:mb-9">
				<p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">ATLAS INTEL</p>
				<h2 class="font-english-body text-3xl font-bold text-stone-100 [text-wrap:pretty] md:text-4xl">{{ selectedCategory.name }}</h2>
				<p class="max-w-3xl text-base leading-8 text-stone-100 md:text-lg">{{ selectedCategory.summary }}</p>
			</header>

			<ul class="m-0 grid list-none gap-7 p-0 md:gap-8">
				<li v-for="section in selectedCategory.sections" :key="section.id" class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
				<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
				<article>
					<h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">{{ section.title }}</h3>
				<p v-if="section.description" class="mt-4 max-w-4xl leading-8 text-stone-300">{{ section.description }}</p>
				<ul v-if="section.bullets" class="atlas-accent-border-35 mt-6 grid gap-3 border-l pl-5 text-stone-300 md:max-w-4xl"><li v-for="item in section.bullets" :key="item.id" class="leading-7">{{ item.text }}</li></ul>
					<ol v-if="section.steps" class="mt-6 grid gap-4 md:max-w-4xl"><li v-for="(step, index) in section.steps" :key="step.id" class="grid grid-cols-[2rem_1fr] gap-3 leading-7 text-stone-300"><span class="atlas-accent-text font-english-body text-lg font-bold">0{{ index + 1 }}</span><span>{{ step.text }}</span></li></ol>
					<div v-if="section.table" class="mt-6 overflow-x-auto"><table class="w-full min-w-[38rem] border-collapse text-left text-sm"><thead class="atlas-accent-text font-english-body"><tr><th v-for="header in section.table.headers" :key="header" scope="col" class="atlas-accent-border-20 border bg-stone-900 px-4 py-3 font-semibold">{{ header }}</th></tr></thead><tbody><tr v-for="(row, rowIndex) in section.table.rows" :key="rowIndex" class="odd:bg-stone-900/45"><td v-for="(cell, cellIndex) in row" :key="cellIndex" class="border border-stone-100/10 px-4 py-4 align-top leading-6 text-stone-300">{{ cell }}</td></tr></tbody></table></div>
				</article>
				</li>

				<li v-if="selectedMechanics.length" class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10">
				<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
			<section aria-labelledby="league-mechanics-heading">
					<h3 id="league-mechanics-heading" class="atlas-accent-text font-english-body text-2xl font-semibold">目前聯盟機制</h3>
					<ul class="mt-6 grid gap-px border border-stone-100/10 bg-stone-100/10 md:grid-cols-2"><li v-for="mechanic in selectedMechanics" :key="mechanic.id" class="bg-black/30 px-5 py-4 text-stone-300"><strong class="atlas-accent-text font-english-body">{{ mechanic.name }}</strong><span> — {{ mechanic.summary }}</span></li></ul>
			</section>
				</li>
			</ul>
		</section>
		</div>
	</div>
</template>
