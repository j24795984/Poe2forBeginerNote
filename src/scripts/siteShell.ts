type SiteShellElements = { scrollbar: HTMLElement | null; thumb: HTMLElement | null };
type LenisInstance = { scrollTo: (top: number, options: Record<string, unknown>) => void; on: (event: 'scroll', callback: () => void) => void; raf: (time: number) => void };
type BrowserWindow = typeof window & {
	Lenis?: new (options: Record<string, unknown>) => LenisInstance;
	gsap?: { ticker: { add: (callback: (time: number) => void) => void; lagSmoothing: (threshold: number) => void } };
	ScrollTrigger?: { update: () => void; refresh: () => void };
};

export function initializeSiteShell({ scrollbar, thumb }: SiteShellElements) {
	let frame = 0;
	const updateScrollbar = () => {
		frame = 0;
		if (!scrollbar || !thumb) return;
		const documentHeight = document.documentElement.scrollHeight;
		const viewportHeight = window.innerHeight;
		const maxScroll = documentHeight - viewportHeight;
		const thumbHeight = Math.min(viewportHeight, Math.max(44, (viewportHeight / documentHeight) * viewportHeight));
		const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
		thumb.style.height = `${thumbHeight}px`;
		thumb.style.transform = `translateY(${progress * (viewportHeight - thumbHeight)}px)`;
	};
	const requestScrollbarUpdate = () => {
		if (!frame) frame = requestAnimationFrame(updateScrollbar);
	};
	window.addEventListener('scroll', requestScrollbarUpdate, { passive: true });
	window.addEventListener('resize', requestScrollbarUpdate);
	window.addEventListener('site-content-resize', requestScrollbarUpdate);
	requestScrollbarUpdate();

	const browserWindow = window as BrowserWindow;
	if (!browserWindow.Lenis) return;
	const lenis = new browserWindow.Lenis({ anchors: true, autoRaf: false, lerp: 0.1 });
	window.addEventListener('site-scroll-to', (event) => {
		const detail = event instanceof CustomEvent ? event.detail as { top?: number; behavior?: ScrollBehavior; handled?: boolean } : null;
		if (!detail || typeof detail.top !== 'number') return;
		const isInstant = detail.behavior !== 'smooth';
		lenis.scrollTo(detail.top, { duration: isInstant ? 0 : 0.7, immediate: isInstant });
		detail.handled = true;
	});
	const { gsap, ScrollTrigger } = browserWindow;
	lenis.on('scroll', () => {
		requestScrollbarUpdate();
		ScrollTrigger?.update();
	});
	if (!gsap || !ScrollTrigger) return;
	gsap.ticker.add((time) => lenis.raf(time * 1000));
	gsap.ticker.lagSmoothing(0);
	ScrollTrigger.refresh();
}
