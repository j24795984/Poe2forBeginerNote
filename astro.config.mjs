// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
	base: '/Poe2forBeginerNote/',
	integrations: [vue()],
	build: {
		assets: 'css',
	},
	vite: {
		environments: {
			client: {
				build: {
					rollupOptions: {
						output: {
							entryFileNames: 'js/[name]-[hash].js',
							chunkFileNames: 'js/chunks/[name]-[hash].js',
							assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css')
								? 'css/[name]-[hash][extname]'
								: 'assets/[name]-[hash][extname]',
						},
					},
				},
			},
		},
	},
});
