# POE2 Beginner Note

Astro 靜態網站，僅在需要互動的位置使用 Vue 3 元件。

## 技術選擇

- Node.js 24
- Astro + `@astrojs/vue` + Vue 3（npm 必要依賴）
- Tailwind CSS 4 browser CDN（目前依需求使用；正式上線前建議改為建置整合）
- GSAP 3 與 Swiper 12 CDN
- `public/data/*.json`：不同資料領域各自獨立檔案

## 指令

```bash
npm run dev
npm run build
npm run preview
```

## GitHub Pages

推送到 `main` 時，`.github/workflows/deploy.yml` 會建置並部署 `dist/`。先在 GitHub repository 的 **Settings → Pages** 將來源選為 **GitHub Actions**。

`astro.config.mjs` 的 `base` 目前設為 `/Poe2forBeginerNote/`；若 repository 名稱改變，必須同步更新。
