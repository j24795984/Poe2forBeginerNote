<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useCategoryTabs } from '../composables/useCategoryTabs';

type CampaignMapPoint = { name: string; x: number; y: number };
type CampaignMap = { id: string; name: string; label?: string; image: string; alt: string; points?: CampaignMapPoint[] };
type LocalizedText = { zh_tw: string; en: string };
type PermanentReward = {
	text_zh_tw?: string;
	choose?: number;
	options?: PermanentReward[];
	groups?: Array<{ name: LocalizedText; options: PermanentReward[] }>;
};
type CampaignRewardEntry = {
	map: LocalizedText;
	main_quest: LocalizedText | '無';
	side_quest: LocalizedText | '無';
	boss: LocalizedText | LocalizedText[] | '無';
	permanent_reward?: PermanentReward;
	condition_zh_tw?: string;
};
type CampaignRewardChapter = {
	id: string;
	chapter: string;
	chapter_en: string;
	maps: CampaignRewardEntry[];
};
type CampaignRewardSource = {
	name: string;
	url?: string;
	urls?: string[];
};
type CampaignRewardData = {
	chapters: CampaignRewardChapter[];
	sources: CampaignRewardSource[];
};
type CampaignRewardCard = {
	id: string;
	target: string;
	objective: string;
	rewards: string[];
	locations: string[];
};
type CampaignChapter = {
	id: string;
	slug: string;
	name: string;
	englishName: string;
	quickGuideUrl?: string;
	maps: CampaignMap[];
};
type CampaignData = {
	id: string;
	chapters: CampaignChapter[];
};

const props = defineProps<{ initialData: CampaignData; initialRewardData: CampaignRewardData }>();
const campaignData = ref<CampaignData>(props.initialData);
const campaignRewardData = ref<CampaignRewardData>(props.initialRewardData);
const error = ref('');
const detailPanel = ref<HTMLElement>();
const chapterTrack = ref<HTMLElement>();
const chapterIndicator = ref<HTMLElement>();
const mapControls = ref<HTMLFieldSetElement>();
const mapIndicator = ref<HTMLElement>();
const mapViewport = ref<HTMLElement>();
const activeMapIndex = ref(0);
const isRewardsOpen = ref(true);
const isMapDragging = ref(false);
const activeMapPointNames = ref<string[]>([]);
const hoveredMapPointName = ref('');
const hoveredMapIndex = ref<number | null>(null);
const hoveredChapterIndex = ref<number | null>(null);
const mapBorderUrl = `${import.meta.env.BASE_URL}images/ui_img/img/border-2-body.webp`;
const assetBase = import.meta.env.BASE_URL;
const indicatorBaseExtensionRatio = .08;
const indicatorExtensionPerUnit = .09;
const indicatorContractionRatio = .045;
const indicatorDuration = 748;
let chapterIndicatorAnimation: Animation | undefined;
let mapIndicatorAnimation: Animation | undefined;
let mapDragPointerId: number | undefined;
let mapDragStartX = 0;
let mapDragStartScrollLeft = 0;

const { selectedId, displayedItem: selectedChapter, select: selectChapter, initialize, dispose } = useCategoryTabs({
	items: () => campaignData.value?.chapters ?? [],
	panel: detailPanel,
	historyStateKey: 'campaignChapter',
});

function rewardTexts(reward?: PermanentReward) {
	if (!reward) return [];
	if (reward.text_zh_tw) return [reward.text_zh_tw];

	if (reward.groups?.length) {
		return reward.groups.map((group) => {
			const options = group.options.map((option) => option.text_zh_tw).filter(Boolean);
			return `${group.name.zh_tw}：${options.join('／')}`;
		});
	}

	const options = reward.options?.map((option) => option.text_zh_tw).filter(Boolean) ?? [];
	return options.length ? [`${reward.choose === 1 ? '選擇一項' : '可選效果'}：${options.join('／')}`] : ['永久獎勵'];
}

function displayReward(chapter: CampaignRewardChapter, entry: CampaignRewardEntry, index: number): CampaignRewardCard {
	const bosses = entry.boss === '無'
		? []
		: (Array.isArray(entry.boss) ? entry.boss : [entry.boss]).map((boss) => boss.zh_tw);
	const bossNames = bosses.join('、');
	const questName = entry.side_quest !== '無'
		? entry.side_quest.zh_tw
		: (entry.main_quest !== '無' ? entry.main_quest.zh_tw : entry.map.zh_tw);
	const target = bossNames || questName;
	const fallbackObjective = bosses.length
		? `擊敗${bossNames}。`
		: `完成${questName}並取得永久獎勵。`;
	const condition = entry.condition_zh_tw;
	const objective = bosses.length && (!condition || /^擊敗(?:頭目|BOSS)並使用掉落/.test(condition))
		? `擊敗${bossNames}。`
		: (condition ?? fallbackObjective).replace(/頭目|BOSS/gi, bossNames || target);

	return {
		id: `${chapter.id}-${index}-${entry.map.en}`,
		target,
		objective,
		rewards: rewardTexts(entry.permanent_reward),
		locations: entry.map.zh_tw.split(/[／/]/).map((location) => location.trim()).filter(Boolean),
	};
}

const selectedRewardChapters = computed(() => {
	const slug = selectedChapter.value?.slug;
	if (!slug) return [];
	if (slug === 'interlude') return campaignRewardData.value.chapters.filter((chapter) => chapter.id.startsWith('interlude_'));
	return campaignRewardData.value.chapters.filter((chapter) => chapter.id === slug.replace('-', '_'));
});
const displayedQuests = computed(() => selectedRewardChapters.value.flatMap((chapter) => chapter.maps.map((entry, index) => displayReward(chapter, entry, index))));
const sourceHomepageByHost: Record<string, { name: string; url: string }> = {
	'poe2db.tw': { name: 'PoE2DB', url: 'https://poe2db.tw/' },
	'mobalytics.gg': { name: 'Mobalytics', url: 'https://mobalytics.gg/' },
	'forum.gamer.com.tw': { name: '巴哈姆特', url: 'https://www.gamer.com.tw/' },
};
const rewardSourceLinks = computed(() => {
	const sites = new Map<string, { name: string; url: string }>();
	campaignRewardData.value.sources.forEach((source) => {
		const urls = source.urls ?? (source.url ? [source.url] : []);
		urls.forEach((url) => {
			const parsedUrl = new URL(url);
			const site = sourceHomepageByHost[parsedUrl.hostname] ?? {
				name: source.name,
				url: `${parsedUrl.origin}/`,
			};
			sites.set(site.url, site);
		});
	});
	return [...sites.values()];
});
const activeChapterIndex = computed(() => Math.max(0, campaignData.value?.chapters.findIndex((chapter) => chapter.id === selectedId.value) ?? 0));
const chapterIndicatorIndex = computed(() => hoveredChapterIndex.value ?? activeChapterIndex.value);
const currentMap = computed(() => selectedChapter.value?.maps[activeMapIndex.value]);
const activeMapPoints = computed(() => currentMap.value?.points?.filter((point) => activeMapPointNames.value.includes(point.name)) ?? []);
const currentMapTaskPoints = computed(() => currentMap.value?.points?.filter((point) => (
	displayedQuests.value.some((quest) => quest.locations.includes(point.name))
)) ?? []);
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
	activeMapPointNames.value = [];
	hoveredMapPointName.value = '';
	if (mapViewport.value) mapViewport.value.scrollLeft = 0;
	hoveredMapIndex.value = null;
	hoveredChapterIndex.value = null;
	selectChapter(id);
}

function startMapDrag(event: PointerEvent) {
	if (!currentMap.value || event.pointerType !== 'mouse' || event.button !== 0 || !mapViewport.value) return;
	mapDragPointerId = event.pointerId;
	mapDragStartX = event.clientX;
	mapDragStartScrollLeft = mapViewport.value.scrollLeft;
	isMapDragging.value = true;
	mapViewport.value.setPointerCapture(event.pointerId);
	event.preventDefault();
}

function moveMapDrag(event: PointerEvent) {
	if (!isMapDragging.value || event.pointerId !== mapDragPointerId || !mapViewport.value) return;
	mapViewport.value.scrollLeft = mapDragStartScrollLeft - (event.clientX - mapDragStartX);
}

function endMapDrag(event: PointerEvent) {
	if (event.pointerId !== mapDragPointerId || !mapViewport.value) return;
	if (mapViewport.value.hasPointerCapture(event.pointerId)) mapViewport.value.releasePointerCapture(event.pointerId);
	isMapDragging.value = false;
	mapDragPointerId = undefined;
}

watch(activeMapIndex, () => {
	activeMapPointNames.value = [];
	hoveredMapPointName.value = '';
	if (mapViewport.value) mapViewport.value.scrollLeft = 0;
});

function mapPointTargetFor(location: string) {
	const maps = selectedChapter.value?.maps ?? [];
	for (const [mapIndex, map] of maps.entries()) {
		const point = map.points?.find((candidate) => candidate.name === location);
		if (point) return { mapIndex, point };
	}
	return undefined;
}

function mapPointTargetsFor(locations: string[]) {
	return locations.flatMap((location) => {
		const target = mapPointTargetFor(location);
		return target ? [{ ...target, location }] : [];
	});
}

function hasMapPoints(locations: string[]) {
	return mapPointTargetsFor(locations).length > 0;
}

function hasActiveMapPoint(locations: string[]) {
	return locations.some((location) => activeMapPointNames.value.includes(location));
}

async function focusMapPoints(locations: string[]) {
	const targets = mapPointTargetsFor(locations);
	if (!targets.length) return;
	hoveredMapPointName.value = '';
	const targetMapIndex = targets[0].mapIndex;
	const visibleTargets = targets.filter((target) => target.mapIndex === targetMapIndex);
	if (activeMapIndex.value !== targetMapIndex) {
		activeMapIndex.value = targetMapIndex;
		await nextTick();
	}
	activeMapPointNames.value = visibleTargets.map((target) => target.location);
	await nextTick();

	const viewport = mapViewport.value;
	if (!viewport) return;
	const viewportWidth = viewport.clientWidth;
	const mapWidth = viewport.querySelector<HTMLElement>('.campaign-map-figure')?.offsetWidth ?? viewportWidth;
	const rewardPanelWidth = isRewardsOpen.value && window.matchMedia('(min-width: 1024px)').matches
		? viewport.parentElement?.querySelector<HTMLElement>('.campaign-map-rewards-panel')?.offsetWidth ?? 0
		: 0;
	const visibleMapWidth = viewportWidth - rewardPanelWidth;
	const pointXs = visibleTargets.map((target) => target.point.x);
	const pointX = mapWidth * (Math.min(...pointXs) + Math.max(...pointXs)) / 200;
	const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
	const targetScrollLeft = Math.min(maxScrollLeft, Math.max(0, pointX - visibleMapWidth / 2));
	viewport.scrollTo({
		left: targetScrollLeft,
		behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
	});
}

onMounted(async () => {
	try {
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
	<div v-else class="campaign-shell">
		<div class="campaign-chapter-toolbar">
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
			<div class="campaign-chapter-actions">
				<a
					v-if="selectedChapter?.quickGuideUrl"
					class="campaign-quest-overview-link"
					:href="selectedChapter.quickGuideUrl"
					target="_blank"
					rel="noreferrer"
					aria-label="章節流程推薦（於新分頁開啟）"
				>章節流程推薦</a>
				<a
					class="campaign-quest-overview-link"
					href="https://poe2db.tw/tw/Quest#%E4%BB%BB%E5%8B%99_Markdown4"
					target="_blank"
					rel="noreferrer"
					aria-label="任務總覽（於新分頁開啟）"
				>任務總覽</a>
			</div>
		</div>

		<section v-if="selectedChapter" ref="detailPanel" class="campaign-detail atlas-detail-motion" aria-live="polite">
				<div class="grid gap-8">
					<section v-if="displayedQuests.length" class="campaign-map-section">
						<div class="campaign-map-stage" :style="{ '--campaign-map-border': `url('${mapBorderUrl}')` }">
							<div
								class="campaign-map-image-container"
								:class="{ 'campaign-map-image-container-rewards-open': isRewardsOpen }"
							>
								<fieldset
									v-if="selectedChapter.maps.length"
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
										<span>{{ map.label ?? mapSurfaceLabels[index] ?? map.name }}</span>
									</label>
									<span ref="mapIndicator" class="campaign-map-indicator" aria-hidden="true"></span>
								</fieldset>

								<div
									ref="mapViewport"
									class="campaign-map-image-box"
									:class="{ 'campaign-map-image-box-dragging': isMapDragging }"
									aria-label="可左右拖曳的章節地圖"
									@pointerdown="startMapDrag"
									@pointermove="moveMapDrag"
									@pointerup="endMapDrag"
									@pointercancel="endMapDrag"
								>
									<div class="campaign-map-pan-canvas">
										<Transition name="campaign-map-switch" mode="out-in">
											<figure v-if="currentMap" :key="currentMap.id" class="campaign-map-figure">
												<img :src="`${assetBase}${currentMap.image}`" :alt="currentMap.alt" loading="eager" draggable="false" />
												<span
													v-for="point in currentMapTaskPoints"
													:key="point.name"
													class="campaign-map-point-hover-target"
													:class="{ 'campaign-map-point-hover-target-disabled': activeMapPointNames.length > 0 }"
													:style="{ left: `${point.x}%`, top: `${point.y}%` }"
													aria-hidden="true"
													@mouseenter="activeMapPointNames.length === 0 && (hoveredMapPointName = point.name)"
													@mouseleave="hoveredMapPointName = ''"
												></span>
												<span
													v-for="point in activeMapPoints"
													:key="`active-${point.name}`"
													class="campaign-map-hotspot"
													:style="{ left: `${point.x}%`, top: `${point.y}%` }"
													aria-hidden="true"
												></span>
											</figure>
										</Transition>
										<div v-if="!currentMap" class="campaign-map-empty" aria-hidden="true">
											<span>{{ selectedChapter.englishName }}</span>
											<strong>{{ selectedChapter.name }}</strong>
										</div>
									</div>
								</div>

								<button
									class="campaign-map-rewards-toggle"
									:class="{ 'campaign-map-rewards-toggle-collapsed': !isRewardsOpen }"
									type="button"
									:aria-expanded="isRewardsOpen"
									aria-controls="campaign-map-rewards-panel"
									:aria-label="isRewardsOpen ? '收合永久獎勵' : '展開永久獎勵'"
									@click="isRewardsOpen = !isRewardsOpen"
								>
									<span class="campaign-map-rewards-toggle-icon-desktop material-symbols-outlined" aria-hidden="true">{{ isRewardsOpen ? 'chevron_right' : 'chevron_left' }}</span>
									<span class="campaign-map-rewards-toggle-icon-mobile material-symbols-outlined" aria-hidden="true">{{ isRewardsOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up' }}</span>
								</button>

								<aside
									id="campaign-map-rewards-panel"
									class="campaign-map-rewards-panel"
									:class="{ 'campaign-map-rewards-panel-open': isRewardsOpen }"
									:aria-hidden="!isRewardsOpen"
									:aria-label="`${selectedChapter.name}永久獎勵`"
								>
									<ol class="campaign-map-reward-list" data-lenis-prevent-wheel>
										<li v-for="quest in displayedQuests" :key="quest.id">
											<article
												class="campaign-map-reward-card"
												:class="{
													'campaign-map-reward-card-interactive': hasMapPoints(quest.locations),
													'campaign-map-reward-card-selected': hasActiveMapPoint(quest.locations),
													'campaign-map-reward-card-map-hovered': activeMapPointNames.length === 0 && quest.locations.includes(hoveredMapPointName),
													'campaign-map-reward-card-abyss': quest.locations.includes('無光通道'),
												}"
											>
												<button
													v-if="hasMapPoints(quest.locations)"
													class="campaign-map-reward-card-action"
													type="button"
													:aria-label="`在地圖上定位${quest.locations.join('、')}`"
													:aria-pressed="hasActiveMapPoint(quest.locations)"
													@click="focusMapPoints(quest.locations)"
												></button>
												<div class="campaign-map-reward-card-heading">
													<div class="campaign-map-reward-method">
														<p>取得方法</p>
														<strong>{{ quest.target }}</strong>
													</div>
													<div class="campaign-map-reward-locations">
														<strong
															v-for="location in quest.locations"
															:key="location"
															class="campaign-map-reward-location"
														>{{ location }}</strong>
													</div>
													<span class="campaign-map-reward-condition">{{ quest.objective }}</span>
												</div>
												<div v-if="quest.rewards.length" class="campaign-map-reward-meta">
													<div>
														<p>獎勵</p>
														<ul><li v-for="reward in quest.rewards" :key="reward">{{ reward }}</li></ul>
													</div>
												</div>
												<div class="campaign-map-reward-card-footer">
													<button
														class="campaign-map-reward-detail-button"
														type="button"
														:aria-label="`詳細內容：${quest.target}（功能製作中）`"
														title="詳細內容功能將於後續提供"
													>詳細內容</button>
												</div>
											</article>
										</li>
									</ol>
								</aside>
							</div>
							<div class="campaign-map-border-box" aria-hidden="true"></div>
						</div>
					</section>

					<footer class="campaign-sources">
						<p>資料來源</p>
						<a v-for="source in rewardSourceLinks" :key="source.url" :href="source.url" target="_blank" rel="noreferrer">{{ source.name }}</a>
					</footer>
				</div>
		</section>
	</div>
</template>
