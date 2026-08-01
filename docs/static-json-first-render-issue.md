# 避免 GitHub Pages 首屏顯示靜態 JSON 載入提示

**Labels:** `performance`, `data`, `astro`, `ssr`

## 背景

Campaign、Atlas 與 Builds 頁面原本使用 Vue `client:load` 元件，並在元件的 `onMounted()` 階段才透過 `fetch()` 讀取 `public/data/*.json`。

Astro 產生的初始 HTML 因此只包含「正在載入主線資料」、「正在載入輿圖資料」等提示。瀏覽器必須先下載並執行 Vue runtime、完成 hydration，再發出 JSON 請求，正式內容才會出現。在 GitHub Pages 首次造訪、行動網路或 CDN 回應較慢時，會產生明顯延遲感。

## 目標

讓 Astro 在建置階段讀取靜態 JSON，初始 HTML 直接包含第一個可用分類的正式內容；Vue 僅負責 hydration 後的頁籤、網址 hash、捲動與動畫互動。

## 工作項目

- [x] 建立共用的 build-time JSON 讀取工具。
- [x] 在 Campaign、Atlas 與 Builds 的 Astro 頁面讀取對應 JSON。
- [x] 將 JSON 透過 `initialData` prop 傳入 Vue 元件。
- [x] 移除 Vue 元件在 `onMounted()` 階段執行的初始 JSON `fetch()`。
- [x] 讓共用分類狀態在 SSR 階段預先選中第一筆資料。
- [x] 移除不再使用的瀏覽器端 JSON 讀取服務與載入提示。
- [x] 將靜態 JSON 首屏渲染規則記錄於 `AGENTS.md`。

## 驗收條件

- [x] `npm run data:validate` 成功。
- [x] `npm run build` 成功。
- [x] Campaign、Atlas 與 Builds 的建置 HTML 不包含「正在載入」提示。
- [x] 三個頁面的建置 HTML 已包含第一個分類的正式內容。
- [x] 首屏客戶端程式不再請求 `campaign.json`、`atlas.json` 或 `builds.json`。
- [ ] Vue hydration 後的頁籤切換、網址 hash 與既有動畫仍正常。

## 實作備註

- JSON 仍保留在 `public/data/`，維持現有資料維護與公開路徑契約。
- `client:load` 仍保留，因為頁面需要 Vue 的互動行為；它不再負責取得首屏資料。
- JSON 內容更新後必須重新建置並部署 GitHub Pages。
- 外部同步 CDN 腳本的最佳化不包含在本 Issue 範圍內，可另案處理。
- Campaign 與 Atlas 關聯資料已各自具備 ID、版本與跨檔引用驗證；被取代的舊 Campaign 資料已移至 `archive/data/legacy/`。
