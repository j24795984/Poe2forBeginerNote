<script setup lang="ts">
import { onMounted, ref } from 'vue';
type Guide = { id: string; title: string; summary: string; categoryId: string };
const guides = ref<Guide[]>([]);
const error = ref('');
onMounted(async () => {
	try {
		const response = await fetch(`${import.meta.env.BASE_URL}data/guides.json`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		guides.value = await response.json();
	} catch (cause) { error.value = cause instanceof Error ? cause.message : '資料讀取失敗'; }
});
</script>

<template>
	<p v-if="error" class="mt-4 text-rose-300">無法讀取 guides.json：{{ error }}</p>
	<ul v-else class="mt-5 grid gap-4 sm:grid-cols-2">
		<li v-for="guide in guides" :key="guide.id" class="rounded-xl border border-slate-700 bg-slate-900 p-5">
			<p class="text-xs font-medium tracking-widest text-cyan-300">{{ guide.categoryId }}</p>
			<h3 class="mt-2 text-lg font-semibold text-white">{{ guide.title }}</h3>
			<p class="mt-2 text-sm leading-6 text-slate-300">{{ guide.summary }}</p>
		</li>
	</ul>
</template>
