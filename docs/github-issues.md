# POE2 Beginner Note — GitHub Issues Backlog

> 將每個區塊複製到 GitHub 的 **New issue** 即可建立對應工作項目。

## Milestone 0：基礎與規格

---

## #1 統一專案架構與規劃文件

**Labels:** `documentation`, `architecture`

### 背景

規劃文件目前描述 Vue 3 + Vite SPA，但專案已採 Astro + Vue islands。需統一文件與實作方向。

### 工作項目

- [ ] 更新 `poe2Web.md` 的技術架構說明。
- [ ] 說明 Astro 負責靜態頁面與路由，Vue 負責互動元件。
- [ ] 記錄 GitHub Pages、JSON 分檔與 LocalStorage 原則。
- [ ] 移除 Markdown 標題與分隔線前的反斜線。

### 驗收條件

- [ ] 規劃文件與現有專案架構一致。
- [ ] Markdown 標題、清單與分隔線皆可正常渲染。

---

## #2 建立 JSON 資料規格與讀取服務

**Labels:** `data`, `foundation`

### 工作項目

- [ ] 定義 `campaign.json`、`atlas.json`、`farming.json`、`crafting.json`、`valuable-items.json`、`tools.json`、`settings.json` 的資料格式。
- [ ] 建立共用資料讀取方法與 TypeScript 型別。
- [ ] 定義跨 JSON 的 ID 關聯規則。

### 驗收條件

- [ ] 每個資料領域使用獨立 JSON 檔案。
- [ ] 元件不散落重複的資料讀取邏輯。

## Milestone 1：核心導覽與內容

---

## #14 確立網站視覺風格與設計基礎

**Labels:** `design`, `ui`, `foundation`

**Depends on:** #1

### 背景

在建立共用導覽與內容頁面前，先定義一致的視覺語言，避免各頁面使用不同的色彩、字級與元件樣式。

### 工作項目

- [ ] 定義網站的整體風格方向與情緒關鍵字。
- [ ] 定義色彩、字體、間距、圓角與陰影等設計 Token。
- [ ] 定義桌面與行動版的基本版面寬度與斷點。
- [ ] 建立按鈕、連結、卡片、標籤、Checklist 與分頁／分類切換的基礎樣式。
- [ ] 採用固定深色主題，不提供亮色、系統主題或主題切換功能。

### 驗收條件

- [ ] 有一份可供後續頁面沿用的設計規範或元件範例。
- [ ] 首頁與輿圖頁可套用相同的基礎視覺規則。
- [ ] 文字對比、焦點狀態與鍵盤操作符合基本可用性需求。

---

## #3 建立網站共用導覽與頁面骨架

**Labels:** `feature`, `navigation`

### 工作項目

- [ ] 建立 Dashboard、拓荒與流派、Campaign、Atlas、賺錢、做裝、高價值物品、工具、設定頁面路由。
- [ ] 建立共用導覽列。
- [ ] 驗證 GitHub Pages 子路徑下的所有內部連結。

### 驗收條件

- [ ] 各頁面皆可由導覽列到達。
- [ ] 在 `/Poe2forBeginerNote/` 子路徑下連結正常。

---

## #4 完成輿圖 Atlas 分類與 JSON 內容

**Labels:** `feature`, `atlas`, `data`

### 工作項目

- [ ] 將現有 Vue 分類元件改為由 `atlas.json` 驅動。
- [ ] 建立初入輿圖、碑牌、換界石、掉落／養圖、聯盟機制、地形分類。
- [ ] 顯示各分類對應的內容區塊。

### 驗收條件

- [ ] 點選分類可即時切換內容。
- [ ] 新增分類時不需修改元件邏輯。

---

## #5 建立 Campaign 主線 Checklist

**Labels:** `feature`, `campaign`, `checklist`

### 工作項目

- [ ] 依章節建立必做任務、Passive Point、昇華試煉、技能石、抗性與 Boss 清單。
- [ ] 由 `campaign.json` 產生頁面內容。
- [ ] 加入完成狀態呈現。

### 驗收條件

- [ ] 可辨識完成與未完成項目。
- [ ] 清單資料與頁面結構分離。

---

## #6 建立拓荒與流派引導頁

**Labels:** `feature`, `builds`

### 工作項目

- [ ] 整理推薦職業、技能與升級建議。
- [ ] 加入 poe.ninja、Maxroll、pobb.in 的外部 Build 入口。

### 驗收條件

- [ ] 網站僅提供引導，不維護完整 Build 資料庫。
- [ ] 外部連結具名稱與用途說明。

---

## #7 建立賺錢、做裝與高價值物品頁面

**Labels:** `feature`, `content`

### 工作項目

- [ ] 建立 Farming 頁面，依白圖、黃圖、紅圖與投資程度分類。
- [ ] 建立新手做裝頁面，說明底材、通貨與基礎流程。
- [ ] 建立高價值物品頁面，整理底材、通貨、Boss 與聯盟掉落。

### 驗收條件

- [ ] 三個模組各自使用獨立 JSON。
- [ ] 不提供即時市場價格或 Trade API 資料。

---

## #8 建立外部工具資源頁

**Labels:** `feature`, `tools`

### 工作項目

- [ ] 以 Database、Build、Planner、Trade、Wiki、社群資料分類外部工具。
- [ ] 使用 `tools.json` 管理名稱、用途與網址。

### 驗收條件

- [ ] 每筆工具都有分類、用途與網址。
- [ ] 外部連結可正常開啟。

## Milestone 2：玩家進度

---

## #9 建立共用 Checklist 與進度計算

**Labels:** `feature`, `progress`

### 工作項目

- [ ] 製作可重用的 Checklist 元件。
- [ ] 計算 Campaign、Atlas、昇華與任務完成率。
- [ ] 建立下一步建議判斷規則。

### 驗收條件

- [ ] 不同頁面可共用 Checklist 元件。
- [ ] 可根據未完成項目提供下一步建議。

---

## #10 將玩家進度保存至 LocalStorage

**Labels:** `feature`, `storage`

### 工作項目

- [ ] 保存勾選紀錄、角色名稱、職業與網站設定。
- [ ] 建立資料版本與遷移策略。

### 驗收條件

- [ ] 重新整理後資料仍存在。
- [ ] 不使用伺服器、登入或資料庫。

---

## #11 建立 Dashboard 首頁

**Labels:** `feature`, `dashboard`

**Depends on:** #5, #9, #10

### 工作項目

- [ ] 顯示目前進度與下一步建議。
- [ ] 顯示 Campaign 與 Atlas 完成率。
- [ ] 提供主要功能快速入口。

### 驗收條件

- [ ] 首頁能清楚回答「我現在應該做什麼？」。
- [ ] 顯示資料來自 JSON 與 LocalStorage。

## Milestone 3：設定、品質與部署

---

## #12 建立設定與資料管理頁

**Labels:** `feature`, `settings`

### 工作項目

- [ ] 加入完成率、下一步建議與隱藏已完成項目的設定。
- [ ] 支援 JSON 匯入、匯出與 CSV 匯出。
- [ ] 加入本機資料重置與網站版本資訊。

### 驗收條件

- [ ] 匯入資料會驗證格式。
- [ ] 重置資料前需確認。
- [ ] 不會修改網站原始 JSON 資料。

---

## #13 RWD、無障礙與 GitHub Pages 驗收

**Labels:** `quality`, `deployment`

### 工作項目

- [ ] 驗證手機、平板與桌面版面。
- [ ] 驗證鍵盤操作、焦點狀態與基本語意結構。
- [ ] 驗證 GitHub Pages 子路徑與直接開啟頁面。
- [ ] 驗證 LocalStorage、外部連結、匯入與匯出流程。
- [ ] 驗證 GitHub Actions 建置與部署。

### 驗收條件

- [ ] `npm run build` 成功。
- [ ] GitHub Pages 可直接開啟所有靜態頁面。
- [ ] 主要互動可使用鍵盤完成。
