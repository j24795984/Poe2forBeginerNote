import { computed, nextTick, ref, type Ref } from 'vue';
import { refreshSiteScrollbar, requestSiteScroll } from '../services/siteScroll';

export type CategoryTab = { id: string; slug: string };
type GsapTween = { kill: () => void };
type Gsap = {
	to: (target: Element, vars: Record<string, unknown>) => GsapTween;
	fromTo: (target: Element, from: Record<string, unknown>, to: Record<string, unknown>) => GsapTween;
};

type UseCategoryTabsOptions<T extends CategoryTab> = {
	items: () => T[];
	panel: Ref<HTMLElement | undefined>;
	historyStateKey: string;
};

export function useCategoryTabs<T extends CategoryTab>({ items, panel, historyStateKey }: UseCategoryTabsOptions<T>) {
	const selectedId = ref('');
	const displayedId = ref('');
	const leavingId = ref('');
	const isChanging = ref(false);
	const displayedItem = computed(() => items().find((item) => item.id === displayedId.value));
	let activeTransition: GsapTween | undefined;
	let selectionMotionTimer: number | undefined;

	function getRouteItem() { return items().find((item) => item.slug === window.location.hash.slice(1)); }
	function setSelectedItem(id: string) {
		if (id === selectedId.value) return;
		const previousId = selectedId.value;
		leavingId.value = previousId;
		selectedId.value = id;
		if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
		selectionMotionTimer = window.setTimeout(() => { if (leavingId.value === previousId) leavingId.value = ''; }, 460);
	}
	function updateRoute(id: string) {
		const item = items().find((candidate) => candidate.id === id);
		if (!item || window.location.hash === `#${item.slug}`) return;
		const url = new URL(window.location.href);
		url.hash = item.slug;
		history.pushState({ [historyStateKey]: item.slug }, '', `${url.pathname}${url.search}${url.hash}`);
	}
	function select(id: string, options: { updateRoute?: boolean; scrollToTop?: boolean } = {}) {
		const { updateRoute: shouldUpdateRoute = true, scrollToTop = true } = options;
		if (shouldUpdateRoute) updateRoute(id);
		if (scrollToTop) requestSiteScroll(0);
		if (isChanging.value || id === selectedId.value) return;
		const browserWindow = window as typeof window & { gsap?: Gsap };
		const detailPanel = panel.value;
		if (!detailPanel || !browserWindow.gsap) {
			setSelectedItem(id);
			displayedId.value = id;
			nextTick().then(refreshSiteScrollbar);
			return;
		}
		isChanging.value = true;
		setSelectedItem(id);
		activeTransition?.kill();
		activeTransition = browserWindow.gsap.to(detailPanel, {
			opacity: 0, filter: 'blur(14px)', y: -10, duration: 0.42, ease: 'power2.in', overwrite: 'auto',
			onComplete: async () => {
				displayedId.value = id;
				await nextTick();
				refreshSiteScrollbar();
				activeTransition = browserWindow.gsap?.fromTo(detailPanel, { opacity: 0, filter: 'blur(6px)', y: 24 }, {
					opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.62, ease: 'power3.out', overwrite: 'auto', clearProps: 'filter,transform', onComplete: () => { isChanging.value = false; }
				});
			}
		});
	}
	function syncFromRoute() {
		const item = getRouteItem() ?? items()[0];
		if (item) select(item.id, { updateRoute: false });
	}
	async function initialize() {
		const item = getRouteItem() ?? items()[0];
		selectedId.value = item?.id ?? '';
		displayedId.value = selectedId.value;
		await nextTick();
		refreshSiteScrollbar();
		window.addEventListener('popstate', syncFromRoute);
		window.addEventListener('hashchange', syncFromRoute);
	}
	function dispose() {
		activeTransition?.kill();
		if (selectionMotionTimer) window.clearTimeout(selectionMotionTimer);
		window.removeEventListener('popstate', syncFromRoute);
		window.removeEventListener('hashchange', syncFromRoute);
	}

	return { selectedId, displayedId, leavingId, displayedItem, select, initialize, dispose };
}
