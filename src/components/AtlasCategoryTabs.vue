<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCategoryTabs } from '../composables/useCategoryTabs';
import { requestSiteScroll } from '../services/siteScroll';

type ContentItem = { id: string; text: string };
type ContentSection = { id: string; title: string; description?: string; bullets?: ContentItem[]; steps?: ContentItem[]; table?: { headers: string[]; rows: string[][] } };
type AtlasCategory = { id: string; slug: string; name: string; summary: string; sections: ContentSection[]; leagueMechanicIds?: string[] };
type LeagueMechanic = { id: string; name: string; summary: string };
type AtlasData = { id: string; atlas: { id: string; categories: AtlasCategory[] }; leagueMechanics: LeagueMechanic[] };
const props = defineProps<{ initialData: AtlasData }>();
const atlasData = ref<AtlasData>(props.initialData);
const error = ref('');
const detailPanel = ref<HTMLElement>();
const categoryNav = ref<HTMLElement>();
const leagueMechanicsCard = ref<HTMLElement>();
const leagueMechanicsViewport = ref<HTMLElement>();
const leagueMechanicsTrack = ref<HTMLElement>();
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
const mechanicElements = new Map<string, HTMLElement>();
let leagueMechanicsTween: gsap.core.Tween | undefined;
let leagueMechanicsTrigger: ScrollTrigger | undefined;
let leagueMechanicsSetupFrame = 0;
const { selectedId, displayedId, leavingId, displayedItem: selectedCategory, select: selectCategory, initialize, dispose } = useCategoryTabs({
	items: () => atlasData.value?.atlas.categories ?? [],
	panel: detailPanel,
	historyStateKey: 'atlasCategory',
});

const selectedMechanics = computed(() => {
	if (!atlasData.value || !selectedCategory.value?.leagueMechanicIds) return [];
	const mechanics = new Map(atlasData.value.leagueMechanics.map((mechanic) => [mechanic.id, mechanic]));
	return selectedCategory.value.leagueMechanicIds.map((id) => mechanics.get(id)).filter((mechanic): mechanic is LeagueMechanic => Boolean(mechanic));
});

function scrollToMechanic(id: string) {
	const target = mechanicElements.get(id);
	if (!target) return;
	const viewport = leagueMechanicsViewport.value;
	const track = leagueMechanicsTrack.value;
	if (leagueMechanicsTrigger && viewport && track) {
		const overflowDistance = Math.max(0, track.scrollHeight - viewport.clientHeight);
		const targetOffset = Math.min(target.offsetTop, overflowDistance);
		const card = leagueMechanicsCard.value;
		const nav = categoryNav.value;
		const pinSpacer = card?.parentElement?.classList.contains('pin-spacer') ? card.parentElement : card;
		const stickyTop = nav ? Number.parseFloat(getComputedStyle(nav).top) || 0 : 0;
		const pinStart = pinSpacer ? window.scrollY + pinSpacer.getBoundingClientRect().top - stickyTop : leagueMechanicsTrigger.start;
		requestSiteScroll(pinStart + targetOffset, 'auto');
		return;
	}
	const menuHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-menu-height')) || 0;
	requestSiteScroll(Math.max(0, target.getBoundingClientRect().top + window.scrollY - menuHeight - 24), 'auto');
}

function disposeLeagueMechanicsScroll() {
	if (leagueMechanicsSetupFrame) cancelAnimationFrame(leagueMechanicsSetupFrame);
	leagueMechanicsSetupFrame = 0;
	leagueMechanicsTrigger?.kill(true);
	leagueMechanicsTween?.kill();
	leagueMechanicsTrigger = undefined;
	leagueMechanicsTween = undefined;
	const track = leagueMechanicsTrack.value;
	if (track) gsap.set(track, { clearProps: 'transform' });
}

function createPinnedOverflowTween({ trigger, stage, nav, viewport, track }: {
	trigger: HTMLElement;
	stage: HTMLElement;
	nav: HTMLElement;
	viewport: HTMLElement;
	track: HTMLElement;
}) {
	const overflowDistance = () => Math.max(0, track.scrollHeight - viewport.clientHeight);
	if (overflowDistance() <= 1) return;
	return gsap.to(track, {
		y: () => -overflowDistance(),
		ease: 'none',
		scrollTrigger: {
			trigger,
			start: () => `top ${Number.parseFloat(getComputedStyle(nav).top) || 0}px`,
			end: () => `+=${overflowDistance()}`,
			pin: stage,
			pinType: 'transform',
			pinSpacing: true,
			scrub: true,
			anticipatePin: 1,
			invalidateOnRefresh: true,
		},
	});
}

async function setupLeagueMechanicsScroll() {
	disposeLeagueMechanicsScroll();
	await nextTick();
	leagueMechanicsSetupFrame = requestAnimationFrame(() => {
		leagueMechanicsSetupFrame = 0;
		const nav = categoryNav.value;
		const scrollStage = detailPanel.value;
		const card = leagueMechanicsCard.value;
		const viewport = leagueMechanicsViewport.value;
		const track = leagueMechanicsTrack.value;
		if (!nav || !scrollStage || !card || !viewport || !track) return;
		if (getComputedStyle(nav).position !== 'sticky' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		gsap.registerPlugin(ScrollTrigger);
		leagueMechanicsTween = createPinnedOverflowTween({ trigger: card, stage: scrollStage, nav, viewport, track });
		if (!leagueMechanicsTween) return;
		leagueMechanicsTrigger = leagueMechanicsTween.scrollTrigger;
		ScrollTrigger.refresh();
	});
}

watch(displayedId, setupLeagueMechanicsScroll, { flush: 'post' });
onMounted(async () => {
	try {
		await initialize();
		await setupLeagueMechanicsScroll();
	} catch (cause) { error.value = cause instanceof Error ? cause.message : '無法讀取 atlas.json。'; }
});
onUnmounted(() => {
	disposeLeagueMechanicsScroll();
	dispose();
});
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法讀取 atlas.json：{{ error }}</p>
	<div v-else-if="selectedCategory" class="atlas-shell">
		<div class="atlas-workspace">
			<nav ref="categoryNav" class="atlas-category-nav" aria-label="輿圖分類"><ul class="atlas-category-nav-list m-0 list-none p-0">
				<li v-for="category in atlasData.atlas.categories" :key="category.id"><button class="atlas-category-button" :class="{ 'atlas-accent-selected': category.id === selectedId, 'atlas-accent-leaving': category.id === leavingId }" type="button" :aria-pressed="category.id === selectedId" @click="selectCategory(category.id)"><span>{{ category.name }}</span><span class="font-english-body text-xs opacity-60">0{{ atlasData.atlas.categories.indexOf(category) + 1 }}</span></button></li>
			</ul></nav>
			<section ref="detailPanel" class="atlas-detail atlas-detail-motion" aria-live="polite">
				<header class="atlas-intel-copy mb-7 grid gap-3 px-1 md:mb-9"><p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">ATLAS INTEL</p><h2 class="font-english-body text-3xl font-bold text-stone-100 [text-wrap:pretty] md:text-4xl">{{ selectedCategory.name }}</h2><p class="max-w-3xl text-base leading-8 text-stone-100 md:text-lg">{{ selectedCategory.summary }}</p></header>
				<ul class="m-0 grid list-none gap-7 p-0 md:gap-8">
					<li v-for="section in selectedCategory.sections" :key="section.id" class="atlas-content-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><article><h3 class="atlas-accent-text font-english-body text-2xl font-semibold tracking-[-.02em] md:text-3xl">{{ section.title }}</h3><p v-if="section.description" class="mt-4 max-w-4xl leading-8 text-stone-300">{{ section.description }}</p><ul v-if="section.bullets" class="atlas-accent-border-35 mt-6 grid gap-3 border-l pl-5 text-stone-300 md:max-w-4xl"><li v-for="item in section.bullets" :key="item.id" class="leading-7">{{ item.text }}</li></ul><ol v-if="section.steps" class="mt-6 grid gap-4 md:max-w-4xl"><li v-for="(step, index) in section.steps" :key="step.id" class="grid grid-cols-[2rem_1fr] gap-3 leading-7 text-stone-300"><span class="atlas-accent-text font-english-body text-lg font-bold">0{{ index + 1 }}</span><span>{{ step.text }}</span></li></ol><div v-if="section.table" class="atlas-data-grid mt-6 text-sm" :style="{ '--atlas-grid-columns': section.table.headers.length }" role="table"><div class="atlas-data-grid-row atlas-data-grid-header" role="row"><div v-for="header in section.table.headers" :key="header" role="columnheader">{{ header }}</div></div><div v-for="(row, rowIndex) in section.table.rows" :key="rowIndex" class="atlas-data-grid-row" role="row"><div v-for="(cell, cellIndex) in row" :key="cellIndex" role="cell">{{ cell }}</div></div></div></article></li>
					<li v-if="selectedMechanics.length" ref="leagueMechanicsCard" class="atlas-content-card atlas-league-mechanics-card rounded-[8px] border border-stone-100/15 px-6 py-8 shadow-xl shadow-black/25 md:px-10 md:py-10"><span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span><section class="atlas-league-mechanics-panel" aria-labelledby="league-mechanics-heading"><h3 id="league-mechanics-heading" class="atlas-accent-text font-english-body text-2xl font-semibold">目前聯盟機制</h3><nav class="content-quick-nav mt-6" aria-label="聯盟機制快速導覽"><ul class="content-quick-nav-list m-0 list-none p-0"><li v-for="mechanic in selectedMechanics" :key="mechanic.id"><button class="content-quick-nav-button" type="button" @click="scrollToMechanic(mechanic.id)">{{ mechanic.name }}</button></li></ul></nav><div ref="leagueMechanicsViewport" class="atlas-league-mechanic-list mt-6"><div ref="leagueMechanicsTrack" class="atlas-league-mechanic-track"><article v-for="mechanic in selectedMechanics" :id="`league-mechanic-${mechanic.id}`" :key="mechanic.id" :ref="(element) => { if (element) mechanicElements.set(mechanic.id, element as HTMLElement); else mechanicElements.delete(mechanic.id); }" class="atlas-league-mechanic px-5 py-5 md:px-6"><h4 class="atlas-accent-text font-english-body text-xl font-semibold">{{ mechanic.name }}</h4><p class="mt-3 leading-7 text-stone-300">{{ mechanic.summary }}</p></article></div></div></section></li>
				</ul>
			</section>
		</div>
	</div>
</template>
