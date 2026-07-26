type TopMenuElements = { menu: HTMLElement | null; spacer: HTMLElement | null };

export function initializeTopMenu({ menu, spacer }: TopMenuElements) {
	if (!menu || !spacer) return;
	const threshold = 12;
	let menuHeight = 0;
	let hiddenDistance = 0;
	let renderedDistance = 0;
	let pendingDistance = 0;
	let pendingDirection = 0;
	let previousScroll = Math.max(0, window.scrollY);
	let frame: number | undefined;
	const scheduleFrame = window.requestAnimationFrame?.bind(window) ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));
	const applyTransform = () => { menu.style.transform = `translate3d(0, ${-renderedDistance}px, 0)`; };
	const render = () => {
		const difference = hiddenDistance - renderedDistance;
		if (Math.abs(difference) < 0.2) {
			renderedDistance = hiddenDistance;
			frame = undefined;
			applyTransform();
			return;
		}
		renderedDistance += difference * 0.24;
		applyTransform();
		frame = scheduleFrame(render);
	};
	const requestRender = () => { if (frame === undefined) frame = scheduleFrame(render); };
	const syncMenuHeight = () => {
		menuHeight = menu.offsetHeight;
		spacer.style.height = `${menuHeight}px`;
		document.documentElement.style.setProperty('--top-menu-height', `${menuHeight}px`);
		hiddenDistance = Math.min(hiddenDistance, menuHeight);
		renderedDistance = Math.min(renderedDistance, menuHeight);
		applyTransform();
	};
	const updateMenu = (scroll: number) => {
		const currentScroll = Math.max(0, scroll);
		const delta = currentScroll - previousScroll;
		previousScroll = currentScroll;
		if (currentScroll === 0) {
			hiddenDistance = 0;
			pendingDistance = 0;
			requestRender();
			return;
		}
		if (!delta) return;
		const direction = Math.sign(delta);
		if (direction !== pendingDirection) {
			pendingDirection = direction;
			pendingDistance = 0;
		}
		pendingDistance += delta;
		if (Math.abs(pendingDistance) < threshold) return;
		hiddenDistance = Math.min(menuHeight, Math.max(0, hiddenDistance + pendingDistance));
		pendingDistance = 0;
		requestRender();
	};
	const requestUpdate = () => updateMenu(window.scrollY);
	syncMenuHeight();
	window.addEventListener('scroll', requestUpdate, { passive: true });
	document.addEventListener('scroll', requestUpdate, { passive: true });
	window.addEventListener('resize', syncMenuHeight);
	if ('ResizeObserver' in window) new ResizeObserver(syncMenuHeight).observe(menu);
}
