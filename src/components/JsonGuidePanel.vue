<script setup lang="ts">
import { onMounted, ref } from 'vue';

type Guide = { id: string; title: string; summary: string; categoryId: string };
type GuidesDocument = { guides: Guide[] };

const guides = ref<Guide[]>([]);
const error = ref('');

onMounted(async () => {
	try {
		const response = await fetch(`${import.meta.env.BASE_URL}data/guides.json`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		guides.value = (await response.json() as GuidesDocument).guides;
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : '資料讀取失敗';
	}
});
</script>

<template>
	<p v-if="error">無法讀取 guides.json：{{ error }}</p>
	<ul v-else>
		<li v-for="guide in guides" :key="guide.id">
			<p>{{ guide.categoryId }}</p>
			<h3>{{ guide.title }}</h3>
			<p>{{ guide.summary }}</p>
		</li>
	</ul>
</template>
