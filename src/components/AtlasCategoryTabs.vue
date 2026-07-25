<script setup lang="ts">
import { computed, ref } from 'vue';

const categories = [
	{ id: 'getting-started', label: '初入輿圖', content: '初入輿圖的內容將放置於此。' },
	{ id: 'tablets', label: '碑牌', content: '碑牌的內容將放置於此。' },
	{ id: 'waystones', label: '換界石', content: '換界石的內容將放置於此。' },
	{ id: 'drops-and-sustain', label: '掉落/養圖', content: '掉落與養圖的內容將放置於此。' },
	{ id: 'league-mechanics', label: '聯盟機制', content: '聯盟機制的內容將放置於此。' },
	{ id: 'terrain', label: '地形', content: '地形的內容將放置於此。' },
] as const;

const selectedId = ref<(typeof categories)[number]['id']>(categories[0].id);
const selectedCategory = computed(() => categories.find((category) => category.id === selectedId.value) ?? categories[0]);
</script>

<template>
	<nav aria-label="輿圖分類">
		<ul>
			<li v-for="category in categories" :key="category.id">
				<button type="button" :aria-pressed="category.id === selectedId" @click="selectedId = category.id">
					{{ category.label }}
				</button>
			</li>
		</ul>
	</nav>

	<section aria-live="polite">
		<h2>{{ selectedCategory.label }}</h2>
		<p>{{ selectedCategory.content }}</p>
	</section>
</template>
