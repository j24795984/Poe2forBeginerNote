export function refreshSiteScrollbar() {
	window.dispatchEvent(new Event('site-content-resize'));
}

export function siteScrollBehavior(): ScrollBehavior {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function requestSiteScroll(top: number, behavior = siteScrollBehavior()) {
	const detail = { top, behavior, handled: false };
	const hasAnimationDriver = Boolean((window as typeof window & { gsap?: unknown }).gsap);
	if (hasAnimationDriver) window.dispatchEvent(new CustomEvent('site-scroll-to', { detail }));
	if (!detail.handled) window.scrollTo({ top, behavior });
}

export function requestSiteScrollToElement(element: HTMLElement, offset = 0) {
	requestSiteScroll(Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset));
}
