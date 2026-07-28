<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useCategoryTabs } from '../composables/useCategoryTabs';
import { loadPublicJson } from '../services/dataService';

type CampaignMap = { id: string; name: string; image: string; alt: string };
type CampaignQuest = {
	id: string;
	slug: string;
	name: string;
	type: 'main' | 'side';
	typeLabel: string;
	locations: string[];
	objective: string;
	rewards: string[];
};
type CampaignChapter = {
	id: string;
	slug: string;
	name: string;
	englishName: string;
	status: 'complete' | 'pending';
	summary: string;
	maps: CampaignMap[];
	quests: CampaignQuest[];
};
type CampaignData = {
	id: string;
	sources: { quests: string; act1: string };
	chapters: CampaignChapter[];
};

const campaignData = ref<CampaignData>();
const error = ref('');
const detailPanel = ref<HTMLElement>();
const chapterTrack = ref<HTMLElement>();
const chapterIndicator = ref<HTMLElement>();
const mapControls = ref<HTMLFieldSetElement>();
const mapIndicator = ref<HTMLElement>();
const activeMapIndex = ref(0);
const hoveredMapIndex = ref<number | null>(null);
const hoveredChapterIndex = ref<number | null>(null);
const cardOrnamentUrl = `${import.meta.env.BASE_URL}images/atlas-card-ornament.webp`;
const assetBase = import.meta.env.BASE_URL;
const indicatorBaseExtensionRatio = .08;
const indicatorExtensionPerUnit = .09;
const indicatorContractionRatio = .045;
const indicatorDuration = 748;
let chapterIndicatorAnimation: Animation | undefined;
let mapIndicatorAnimation: Animation | undefined;

const { selectedId, displayedItem: selectedChapter, select: selectChapter, initialize, dispose } = useCategoryTabs({
	items: () => campaignData.value?.chapters ?? [],
	panel: detailPanel,
	historyStateKey: 'campaignChapter',
});

const mainQuestCount = computed(() => selectedChapter.value?.quests.filter((quest) => quest.type === 'main').length ?? 0);
const sideQuestCount = computed(() => selectedChapter.value?.quests.filter((quest) => quest.type === 'side').length ?? 0);
const activeChapterIndex = computed(() => Math.max(0, campaignData.value?.chapters.findIndex((chapter) => chapter.id === selectedId.value) ?? 0));
const chapterIndicatorIndex = computed(() => hoveredChapterIndex.value ?? activeChapterIndex.value);
const currentMap = computed(() => selectedChapter.value?.maps[activeMapIndex.value]);
const mapIndicatorIndex = computed(() => hoveredMapIndex.value ?? activeMapIndex.value);
const mapSurfaceLabels = ['地表', '地底'];

function setIndicatorGeometry(indicator: HTMLElement, container: HTMLElement, index: number, count: number) {
	const itemWidth = container.getBoundingClientRect().width / Math.max(count, 1);
	indicator.style.left = `${(index + .5) * itemWidth}px`;
	indicator.style.width = `${itemWidth}px`;
}

function smootherstep(value: number) {
	const progress = Math.min(Math.max(value, 0), 1);
	return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}

function animateIndicator(
	indicator: HTMLElement | undefined,
	container: HTMLElement | undefined,
	index: number,
	count: number,
	movementUnits: number,
	currentAnimation: Animation | undefined,
	setCurrentAnimation: (animation: Animation | undefined) => void,
) {
	if (!indicator || !container) return;

	const containerRect = container.getBoundingClientRect();
	const indicatorRect = indicator.getBoundingClientRect();
	const itemWidth = containerRect.width / Math.max(count, 1);
	const currentLeft = indicatorRect.left - containerRect.left;
	const currentWidth = indicatorRect.width || itemWidth;
	const currentCenter = currentLeft + currentWidth / 2;
	const targetCenter = (index + .5) * itemWidth;
	const distance = targetCenter - currentCenter;

	currentAnimation?.cancel();
	indicator.style.left = `${currentCenter}px`;
	indicator.style.width = `${currentWidth}px`;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < .5) {
		setIndicatorGeometry(indicator, container, index, count);
		setCurrentAnimation(undefined);
		return;
	}

	const direction = Math.sign(distance);
	const extensionRatio = indicatorBaseExtensionRatio + Math.max(movementUnits, 1) * indicatorExtensionPerUnit;
	const extensionAmount = itemWidth * extensionRatio;
	const maximumWidth = itemWidth + extensionAmount;
	const positionOvershoot = Math.min(2, Math.abs(distance) * .02);
	const keyframes: Keyframe[] = [];

	for (let step = 0; step <= 30; step += 1) {
		const time = step / 30;
		const movementProgress = smootherstep(time / .88);
		let center = currentCenter + distance * movementProgress;
		let width: number;

		if (time < .44) {
			const extensionProgress = smootherstep(time / .44);
			width = currentWidth + (maximumWidth - currentWidth) * extensionProgress;
		} else if (time < .78) {
			const contractionProgress = smootherstep((time - .44) / .34);
			width = maximumWidth + (itemWidth - maximumWidth) * contractionProgress;
		} else {
			const settleProgress = (time - .78) / .22;
			const decay = Math.exp(-1.8 * settleProgress);
			width = itemWidth - itemWidth * indicatorContractionRatio * Math.sin(2 * Math.PI * settleProgress) * decay;
			center += direction * positionOvershoot * Math.sin(Math.PI * settleProgress) * Math.exp(-2 * settleProgress);
		}

		keyframes.push({
			left: `${center}px`,
			width: `${Math.max(width, itemWidth * .8)}px`,
			offset: time,
		});
	}

	const animation = indicator.animate(keyframes, {
		duration: indicatorDuration,
		easing: 'linear',
		fill: 'forwards',
	});

	setCurrentAnimation(animation);
	animation.onfinish = () => {
		setIndicatorGeometry(indicator, container, index, count);
		animation.cancel();
		setCurrentAnimation(undefined);
	};
}

function syncIndicators() {
	if (chapterIndicator.value && chapterTrack.value) {
		chapterIndicatorAnimation?.cancel();
		chapterIndicatorAnimation = undefined;
		setIndicatorGeometry(chapterIndicator.value, chapterTrack.value, chapterIndicatorIndex.value, campaignData.value?.chapters.length ?? 1);
	}
	if (mapIndicator.value && mapControls.value) {
		mapIndicatorAnimation?.cancel();
		mapIndicatorAnimation = undefined;
		setIndicatorGeometry(mapIndicator.value, mapControls.value, mapIndicatorIndex.value, selectedChapter.value?.maps.length ?? 1);
	}
}

watch(chapterIndicatorIndex, async (next, previous) => {
	await nextTick();
	animateIndicator(
		chapterIndicator.value,
		chapterTrack.value,
		next,
		campaignData.value?.chapters.length ?? 1,
		Math.abs(next - previous),
		chapterIndicatorAnimation,
		(animation) => { chapterIndicatorAnimation = animation; },
	);
}, { flush: 'post' });

watch(mapIndicatorIndex, async (next, previous) => {
	await nextTick();
	animateIndicator(
		mapIndicator.value,
		mapControls.value,
		next,
		selectedChapter.value?.maps.length ?? 1,
		Math.abs(next - previous),
		mapIndicatorAnimation,
		(animation) => { mapIndicatorAnimation = animation; },
	);
}, { flush: 'post' });

function selectCampaignChapter(id: string) {
	activeMapIndex.value = 0;
	hoveredMapIndex.value = null;
	hoveredChapterIndex.value = null;
	selectChapter(id);
}

onMounted(async () => {
	try {
		campaignData.value = await loadPublicJson<CampaignData>('data/campaign.json');
		await initialize();
		await nextTick();
		syncIndicators();
		window.addEventListener('resize', syncIndicators);
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : '無法載入主線資料。';
	}
});

onUnmounted(() => {
	chapterIndicatorAnimation?.cancel();
	mapIndicatorAnimation?.cancel();
	window.removeEventListener('resize', syncIndicators);
	dispose();
});
</script>

<template>
	<p v-if="error" class="border border-red-300/40 bg-red-950/45 p-5 text-red-100" role="alert">無法載入主線資料：{{ error }}</p>
	<p v-else-if="!campaignData" class="atlas-accent-border-20 border bg-black/35 p-5 text-stone-300">正在載入主線資料。</p>
	<div v-else class="campaign-shell">
		<nav class="campaign-chapter-nav" aria-label="主線章節" @mouseleave="hoveredChapterIndex = null">
			<ul
				ref="chapterTrack"
				class="campaign-chapter-list"
			>
				<li v-for="(chapter, index) in campaignData.chapters" :key="chapter.id">
					<button
						class="campaign-chapter-tab"
						:class="{ 'campaign-chapter-tab-active': chapter.id === selectedId }"
						type="button"
						:aria-pressed="chapter.id === selectedId"
						@mouseenter="hoveredChapterIndex = index"
						@focus="hoveredChapterIndex = index"
						@blur="hoveredChapterIndex = null"
						@click="selectCampaignChapter(chapter.id)"
					>
						<span class="campaign-chapter-meta">{{ chapter.englishName }}</span>
						<span class="campaign-chapter-name">{{ chapter.name }}</span>
					</button>
				</li>
				<li ref="chapterIndicator" class="campaign-chapter-indicator" aria-hidden="true"></li>
			</ul>
		</nav>

		<section v-if="selectedChapter" ref="detailPanel" class="campaign-detail atlas-detail-motion" aria-live="polite">
				<article v-if="selectedChapter.status === 'pending'" class="atlas-content-card campaign-pending-card rounded-[8px] border border-stone-100/15 px-6 py-10 shadow-xl shadow-black/25 md:px-10 md:py-14">
					<span class="atlas-content-card-ornament" :style="{ '--atlas-card-ornament': `url('${cardOrnamentUrl}')` }" aria-hidden="true"></span>
					<div class="relative z-[1]">
						<p class="atlas-accent-text font-english-body text-sm font-semibold">AWAITING CONFIRMATION</p>
						<h3 class="mt-3 text-2xl font-semibold text-stone-100">等待第一章版型確認</h3>
						<p class="mt-4 max-w-2xl leading-8 text-stone-300">此章節分類與 JSON 欄位已建立。確認第一章的資訊密度與呈現方式後，再依相同模式補齊任務與地圖。</p>
					</div>
				</article>

				<div v-else class="grid gap-8">
					<section class="campaign-map-section">
						<fieldset
							ref="mapControls"
							class="campaign-map-controls"
							aria-label="地圖區域"
							@mouseleave="hoveredMapIndex = null"
						>
							<legend class="sr-only">選擇地圖區域</legend>
							<label
								v-for="(map, index) in selectedChapter.maps"
								:key="map.id"
								class="campaign-map-radio"
								:class="{ 'campaign-map-radio-active': activeMapIndex === index }"
								@mouseenter="hoveredMapIndex = index"
							>
								<input
									v-model="activeMapIndex"
									type="radio"
									name="campaign-map-surface"
									:value="index"
									@focus="hoveredMapIndex = index"
									@blur="hoveredMapIndex = null"
								/>
								<span>{{ mapSurfaceLabels[index] ?? map.name }}</span>
							</label>
							<span ref="mapIndicator" class="campaign-map-indicator" aria-hidden="true"></span>
						</fieldset>

						<div class="campaign-map-stage">
							<Transition name="campaign-map-switch" mode="out-in">
								<figure v-if="currentMap" :key="currentMap.id" class="campaign-map-figure">
									<img :src="`${assetBase}${currentMap.image}`" :alt="currentMap.alt" loading="eager" />
									<figcaption>{{ currentMap.name }}</figcaption>
								</figure>
							</Transition>
						</div>
					</section>

					<section class="campaign-quests-section">
						<header class="campaign-quest-header">
							<div>
								<p class="atlas-accent-bright-text font-english-decorative text-xs font-semibold">QUEST INDEX</p>
								<h3 class="mt-2 font-english-body text-2xl font-semibold text-stone-100 md:text-3xl">第一章全部任務</h3>
							</div>
							<div class="campaign-counts" aria-label="任務數量">
								<span><strong>{{ mainQuestCount }}</strong> 主線</span>
								<span><strong>{{ sideQuestCount }}</strong> 支線</span>
							</div>
						</header>

						<ol class="campaign-quest-list mt-7">
							<li v-for="(quest, index) in selectedChapter.quests" :key="quest.id">
								<details class="campaign-quest" :open="index === 0">
									<summary>
										<span class="campaign-quest-index">{{ String(index + 1).padStart(2, '0') }}</span>
										<span class="campaign-quest-title">
											<strong>{{ quest.name }}</strong>
											<span :class="['campaign-quest-type', `campaign-quest-type-${quest.type}`]">{{ quest.typeLabel }}</span>
										</span>
										<span class="material-symbols-outlined campaign-quest-toggle" aria-hidden="true">add</span>
									</summary>
									<div class="campaign-quest-detail">
										<dl>
											<div>
												<dt>相關區域</dt>
												<dd>{{ quest.locations.join(' → ') }}</dd>
											</div>
											<div>
												<dt>任務目標</dt>
												<dd>{{ quest.objective }}</dd>
											</div>
											<div>
												<dt>任務獎勵</dt>
												<dd v-if="quest.rewards.length">
													<ul><li v-for="reward in quest.rewards" :key="reward">{{ reward }}</li></ul>
												</dd>
												<dd v-else class="campaign-muted">Poe2DB 未列出固定獎勵</dd>
											</div>
										</dl>
									</div>
								</details>
							</li>
						</ol>
					</section>

					<footer class="campaign-sources">
						<p>資料來源</p>
						<a :href="campaignData.sources.quests" target="_blank" rel="noreferrer">Poe2DB 任務與獎勵</a>
						<a :href="campaignData.sources.act1" target="_blank" rel="noreferrer">Poe2DB 第一章路線</a>
					</footer>
				</div>
		</section>
	</div>
</template>
