const cache = new Map<string, Promise<unknown>>();

export function loadPublicJson<T>(path: string): Promise<T> {
	const url = `${import.meta.env.BASE_URL}${path}`;
	if (!cache.has(url)) {
		cache.set(url, fetch(url).then((response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		}));
	}
	return cache.get(url) as Promise<T>;
}
