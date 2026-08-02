<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

type ItemType = { id: string; label: string };
type GsapTween = { kill: () => void };
type GsapApi = {
	fromTo: (
		target: Element,
		fromVars: Record<string, string | number>,
		toVars: Record<string, string | number>,
	) => GsapTween;
	to: (
		target: Element,
		toVars: Record<string, string | number>,
	) => GsapTween;
};
type SpecialDrop = {
	id: string;
	typeId: string;
	name: { zhTw: string; en: string };
	itemUrl: string;
	dropArea: string;
	boss: string;
	valueLabel: string;
	acquisition: {
		summary: string;
		detail?: { title: string; navigation?: { id: string; label: string }[]; html: string };
	};
};
type SpecialDropData = {
	title: string;
	scope: { checkedAt: string; priceNote: string };
	source: { name: string; url: string };
	types: ItemType[];
	items: SpecialDrop[];
};

const props = defineProps<{ initialData: SpecialDropData }>();
const query = ref('');
const selectedTypeIds = ref<string[]>([]);
const detailDialog = ref<HTMLDialogElement>();
const detailDialogPanel = ref<HTMLElement>();
const detailDialogContent = ref<HTMLElement>();
const activeItem = ref<SpecialDrop>();
let detailDialogTween: GsapTween | undefined;
let detailDialogCloseTimer: number | undefined;

const typeLabels = computed(() => Object.fromEntries(props.initialData.types.map((type) => [type.id, type.label])));
const typeCounts = computed(() => Object.fromEntries(
	props.initialData.types.map((type) => [type.id, props.initialData.items.filter((item) => item.typeId === type.id).length]),
));
const filteredItems = computed(() => {
	const keyword = query.value.trim().toLocaleLowerCase();
	return props.initialData.items.filter((item) => {
		if (selectedTypeIds.value.length && !selectedTypeIds.value.includes(item.typeId)) return false;
		if (!keyword) return true;
		return [item.name.zhTw, item.name.en, typeLabels.value[item.typeId], item.dropArea, item.boss, item.acquisition.summary]
			.join(' ')
			.toLocaleLowerCase()
			.includes(keyword);
	});
});

function clearFilters() {
	query.value = '';
	selectedTypeIds.value = [];
}

function setPageScrollLocked(locked: boolean) {
	document.documentElement.classList.toggle('is-modal-scroll-locked', locked);
}

async function openDetails(item: SpecialDrop) {
	activeItem.value = item;
	await nextTick();
	if (!detailDialog.value || detailDialog.value.open) return;
	detailDialog.value.classList.remove('is-closing');
	detailDialog.value.showModal();
	setPageScrollLocked(true);
	if (detailDialogContent.value) detailDialogContent.value.scrollTop = 0;

	const panel = detailDialogPanel.value;
	const gsap = (window as typeof window & { gsap?: GsapApi }).gsap;
	if (!panel || !gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	detailDialogTween?.kill();
	detailDialogTween = gsap.fromTo(
		panel,
		{ autoAlpha: 0, y: 18 },
		{ autoAlpha: 1, y: 0, duration: .38, ease: 'power2.out', clearProps: 'opacity,transform,visibility' },
	);
}

function scrollDetailTo(id: string) {
	const content = detailDialogContent.value;
	const target = content?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
	if (!content || !target) return;
	const top = content.scrollTop + target.getBoundingClientRect().top - content.getBoundingClientRect().top;
	content.scrollTo({
		top,
		behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
	});
}

function closeDetails() {
	const dialog = detailDialog.value;
	if (!dialog?.open || dialog.classList.contains('is-closing')) return;

	detailDialogTween?.kill();
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		dialog.close();
		return;
	}

	dialog.classList.add('is-closing');
	const panel = detailDialogPanel.value;
	const gsap = (window as typeof window & { gsap?: GsapApi }).gsap;
	if (panel && gsap) {
		detailDialogTween = gsap.to(panel, {
			autoAlpha: 0,
			y: 12,
			duration: .28,
			ease: 'power2.in',
		});
	}
	detailDialogCloseTimer = window.setTimeout(() => dialog.close(), 280);
}

function closeFromBackdrop(event: MouseEvent) {
	if (event.target === detailDialog.value) closeDetails();
}

function finishDetailsClose() {
	if (detailDialogCloseTimer !== undefined) window.clearTimeout(detailDialogCloseTimer);
	detailDialogCloseTimer = undefined;
	detailDialogTween = undefined;
	detailDialog.value?.classList.remove('is-closing');
	setPageScrollLocked(false);
	activeItem.value = undefined;
}

watch(filteredItems, () => {
	if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('site-content-resize'));
});

onUnmounted(() => {
	detailDialogTween?.kill();
	if (detailDialogCloseTimer !== undefined) window.clearTimeout(detailDialogCloseTimer);
	setPageScrollLocked(false);
});
</script>

<template>
	<article class="atlas-content-card valuable-items-panel relative grid rounded-[8px] border border-stone-100/15 shadow-xl shadow-black/25">
		<header class="valuable-items-panel-header relative z-[1]">
			<div class="valuable-items-summary-row">
				<div class="valuable-items-summary-copy">
					<p>目前整理需要特別辨識的稀有通貨與高價碎片／門票；一般常見通貨不列入，限定與高價傳奇裝備將於後續另外整理。</p>
					<p class="atlas-accent-text font-semibold">注意：{{ initialData.scope.priceNote }}</p>
				</div>
				<div class="valuable-items-market-block">
					<a class="valuable-items-market-link" :href="initialData.source.url" target="_blank" rel="noreferrer">
						<span>
							<strong>台服通貨交易價格</strong>
							<small>包含碎片、門票、寶石等各類型物品</small>
						</span>
						<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
					</a>
					<p class="special-drop-updated">資料日期 <time :datetime="initialData.scope.checkedAt">{{ initialData.scope.checkedAt }}</time></p>
				</div>
			</div>

			<div class="valuable-items-filter-panel" aria-label="高價值物品篩選">
				<label class="valuable-items-search">
					<span class="material-symbols-outlined" aria-hidden="true">search</span>
					<span class="sr-only">搜尋高價物品</span>
					<input v-model="query" type="search" placeholder="搜尋物品、區域、BOSS 或說明" />
				</label>

				<fieldset class="valuable-items-type-filter">
					<legend>類型 <small>可複選</small></legend>
					<div>
						<button type="button" :class="{ 'is-active': selectedTypeIds.length === 0 }" :aria-pressed="selectedTypeIds.length === 0" @click="selectedTypeIds = []">
							全部
						</button>
						<label
							v-for="type in initialData.types"
							:key="type.id"
							:class="{ 'is-active': selectedTypeIds.includes(type.id), 'is-disabled': typeCounts[type.id] === 0 }"
						>
							<input v-model="selectedTypeIds" type="checkbox" :value="type.id" :disabled="typeCounts[type.id] === 0" />
							<span>{{ type.label }}</span>
						</label>
					</div>
				</fieldset>
			</div>
		</header>

		<div class="valuable-items-result-meta relative z-[1]" aria-live="polite">
			<p>顯示 <strong>{{ filteredItems.length }}</strong>／{{ initialData.items.length }} 件物品</p>
			<button v-if="query || selectedTypeIds.length" type="button" @click="clearFilters">清除篩選</button>
		</div>

		<div v-if="filteredItems.length" class="special-drop-grid relative z-[1]" role="table" aria-label="高價值物品列表">
			<div class="special-drop-grid-header" role="row">
				<div role="columnheader">物品名稱</div>
				<div role="columnheader">類型</div>
				<div role="columnheader">掉落區域</div>
				<div role="columnheader">相關 BOSS</div>
				<div role="columnheader">台服價值</div>
				<div role="columnheader">取得方式</div>
			</div>
			<div v-for="item in filteredItems" :key="item.id" class="special-drop-grid-row" role="row">
				<div role="cell" data-label="物品名稱">
					<a :href="item.itemUrl" target="_blank" rel="noreferrer">
						<strong>{{ item.name.zhTw }}</strong>
						<small>{{ item.name.en }}</small>
						<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
					</a>
				</div>
				<div class="special-drop-type" role="cell" data-label="類型">{{ typeLabels[item.typeId] }}</div>
				<div role="cell" data-label="掉落區域">{{ item.dropArea }}</div>
				<div role="cell" data-label="相關 BOSS">{{ item.boss }}</div>
				<div class="special-drop-value" role="cell" data-label="台服價值">{{ item.valueLabel }}</div>
				<div role="cell" data-label="取得方式">
					<div class="special-drop-acquisition">
						<span>{{ item.acquisition.summary }}</span>
						<button
							v-if="item.acquisition.detail"
							type="button"
							:aria-label="`查看${item.name.zhTw}的詳細取得方式`"
							@click="openDetails(item)"
						>
							<span class="material-symbols-outlined" aria-hidden="true">more_horiz</span>
							<span>詳細</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<div v-else class="valuable-items-empty relative z-[1]" role="status">
			<p>沒有符合目前篩選條件的物品。</p>
			<button type="button" @click="clearFilters">清除篩選</button>
		</div>

		<footer class="valuable-items-panel-footer relative z-[1]">
			<p>價格僅用於快速辨識掉落價值，交易前請重新查價。</p>
		</footer>

		<dialog
			ref="detailDialog"
			class="valuable-item-dialog"
			data-lenis-prevent
			aria-labelledby="valuable-item-dialog-title"
			@click="closeFromBackdrop"
			@cancel.prevent="closeDetails"
			@close="finishDetailsClose"
		>
			<article v-if="activeItem?.acquisition.detail" ref="detailDialogPanel" class="valuable-item-dialog-panel">
				<header>
					<div>
						<p>詳細取得方式</p>
						<h2 id="valuable-item-dialog-title">{{ activeItem.acquisition.detail.title }}</h2>
					</div>
					<button type="button" aria-label="關閉詳細內容" @click="closeDetails">
						<span class="material-symbols-outlined" aria-hidden="true">close</span>
					</button>
				</header>
				<div ref="detailDialogContent" class="valuable-item-dialog-content">
					<nav v-if="activeItem.acquisition.detail.navigation?.length" class="valuable-item-detail-nav" aria-label="詳細內容分類">
						<button
							v-for="item in activeItem.acquisition.detail.navigation"
							:key="item.id"
							type="button"
							@click="scrollDetailTo(item.id)"
						>
							{{ item.label }}
						</button>
					</nav>
					<div class="valuable-item-detail-body" v-html="activeItem.acquisition.detail.html"></div>
				</div>
			</article>
		</dialog>
	</article>
</template>
