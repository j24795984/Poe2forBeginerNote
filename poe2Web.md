\# POE2 新手進度引導與紀錄網站

> Project Planning Document v1.0



\---



\# 一、專案概述



\## 1.1 專案背景



《Path of Exile 2（流放之路2）》具有龐大的遊戲系統與機制，新手玩家在拓荒、主線通關及剛進入輿圖（Atlas）時，經常因資訊過多而不知道目前應優先完成哪些事情。



本專案希望建立一個以「玩家目前進度」為核心的導航網站，而非攻略百科。



網站依照玩家目前所在階段，提供：



\- 下一步建議（Next Action）

\- 必做任務提醒

\- 重要獎勵提醒

\- 進度紀錄

\- 主流工具快速入口



降低新手查找資料與理解遊戲流程的成本。



\---



\## 1.2 專案定位



本網站不是：



\- Wiki

\- 資料庫

\- Build 分享站

\- 天賦模擬器



而是一個：



> Progress-based Navigation Website



以玩家目前進度為核心，提供最需要知道的資訊。



\---



\## 1.3 核心價值



\### Progress First



依照目前進度推薦下一步，而不是一次提供全部攻略。



\---



\### Checklist



所有重要節點皆可勾選紀錄。



例如：



\- 主線

\- 昇華

\- 天賦點

\- Atlas

\- 開圖

\- Boss



\---



\### Lightweight



網站本身不維護大型資料庫。



所有需要詳細查詢的內容皆導向成熟工具。



\---



\# 二、技術架構



\## 開發方式



\- Vue 3

\- Vite

\- GitHub Pages

\- SPA（Single Page Application）



\---



\## 資料來源



所有網站內容皆由 JSON 靜態資料提供。



```text

JSON

&#x20;   ↓

Vue

&#x20;   ↓

畫面

```



\---



\## 儲存方式



LocalStorage



保存：



\- 玩家進度

\- 網站設定

\- 勾選紀錄



不建立：



\- Server

\- Database

\- Login



\---



\## 部署方式



GitHub Pages



零維護成本。



\---



\# 三、網站資訊架構（Information Architecture）



```text

首頁 Dashboard

│

├── 進度總覽

│

├── 拓荒與流派

│

├── 主線 Campaign

│

├── 輿圖 Atlas

│

├── 賺錢

│

├── 做裝

│

├── 高價值物品

│

├── 工具 Tools

│

└── 設定／資料管理

```



\---



\# 四、各功能模組



\## 4.1 首頁 Dashboard



網站首頁。



主要功能：



\- 玩家目前進度

\- 下一步建議

\- Campaign 完成率

\- Atlas 完成率

\- 最近更新

\- 快速入口



首頁希望玩家一打開就知道：



> 我現在應該做什麼？



\---



\## 4.2 進度總覽



集中顯示目前角色進度。



例如：



\- 等級

\- Campaign

\- Atlas

\- 昇華

\- Passive Quest

\- 完成百分比



並提供：



\- 下一步推薦

\- 尚未完成的重要事項



\---



\## 4.3 拓荒與流派



整理適合新手的拓荒資訊。



內容包含：



\- 推薦拓荒職業

\- 推薦技能

\- Build 入口

\- 升級建議

\- 外部 Build 網站



網站僅提供引導。



詳細 Build 交由：



\- poe.ninja

\- Maxroll

\- pobb.in



\---



\## 4.4 主線 Campaign



依章節建立 Checklist。



內容包含：



\- 必做任務

\- Passive Point 任務

\- 昇華試煉

\- 技能石提醒

\- 抗性檢查

\- Boss



所有項目皆可勾選。



\---



\## 4.5 輿圖 Atlas



整理終局流程。



內容包含：



\- 剛進 Atlas

\- 白圖

\- 黃圖

\- 紅圖

\- Pinnacle Boss



提供：



\- 推薦下一步

\- 開圖進度

\- Atlas Passive



\---



\## 4.6 賺錢



整理不同階段的 Farming 方法。



例如：



\- 剛進 Atlas

\- 白圖

\- 黃圖

\- 紅圖



並整理：



\- 推薦機制

\- 建議投資

\- 收益概念



不提供市場價格。



\---



\## 4.7 做裝



整理新手可理解的製作流程。



例如：



\- Base 選擇

\- 基礎 Craft

\- 常用貨幣

\- Bench

\- Essence

\- Regal

\- Exalted

\- Omens



避免深入複雜 Craft。



\---



\## 4.8 高價值物品



整理值得保留的重要物品。



例如：



\- 高價底材

\- 通貨

\- 聯盟掉落

\- Boss 掉落

\- 特殊 Unique



讓新手知道：



哪些東西不要亂丟。



\---



\## 4.9 工具 Tools



網站不自行製作大型工具。



統一整理外部資源。



例如：



\- POE2DB

\- poe.ninja

\- Maxroll

\- pobb.in

\- 社群試算表



依用途分類：



\- Database

\- Build

\- Planner

\- Trade

\- Wiki



\---



\## 4.10 設定／資料管理



本頁負責網站設定與玩家資料。



\### （一）進度管理



顯示：



\- Campaign 完成率

\- Atlas 完成率

\- 昇華完成率

\- Passive Quest



並顯示：



\- 下一步建議



\---



\### （二）聯盟角色



目前僅支援：



> 一個聯盟角色



可修改：



\- 角色名稱

\- 職業



未來若需要：



再擴充多角色功能。



\---



\### （三）資料管理



提供：



\- 匯出 JSON

\- 匯入 JSON

\- 匯出 CSV

\- 重置所有資料



方便：



\- 備份

\- 換裝置



\---



\### （四）網站設定



提供：



\- 深色／淺色模式

\- 系統主題

\- 是否顯示完成率

\- 是否顯示下一步建議

\- 是否隱藏已完成項目



\---



\### （五）網站資訊



顯示：



\- Website Version

\- Game Version

\- Data Version

\- 最後更新日期



並提供：



\- GitHub Repository

\- 問題回報

\- 更新紀錄



\---



\# 五、外部資源策略



本網站採用 Zero-Database Strategy。



所有複雜資料皆導向成熟網站。



| 類型 | 網站 | 用途 |

|------|------|------|

| Database | POE2DB | 資料查詢 |

| Build | poe.ninja | 流派參考 |

| Planner | Maxroll | 天賦規劃 |

| PoB | pobb.in | Build 分享 |

| 社群資料 | Google Sheets | Checklist 資料來源 |



\---



\# 六、資料架構



網站內容皆使用 JSON。



建議資料夾：



```text

/data

│

├── campaign.json

├── atlas.json

├── leveling.json

├── farming.json

├── crafting.json

├── valuable-items.json

├── tools.json

└── settings.json

```



所有畫面皆由 JSON 產生。



\---



\# 七、開發階段



\## Phase 1



資料整理



\- Campaign

\- Atlas

\- Farming

\- Crafting

\- Valuable Items



整理為 JSON。



\---



\## Phase 2



UI / UX



完成：



\- RWD

\- Dashboard

\- Checklist

\- Navigation



\---



\## Phase 3



功能開發



完成：



\- LocalStorage

\- Progress Tracking

\- JSON Import / Export

\- Theme



\---



\## Phase 4



部署



部署至：



GitHub Pages



完成測試：



\- LocalStorage

\- RWD

\- 外部連結

\- 匯入／匯出

\- GitHub Action（如有）



\---



\# 八、未來擴充（Future Features）



目前不列入第一版：



\- 多角色管理

\- 雲端同步

\- 帳號登入

\- Trade API

\- 市場價格

\- 即時物價

\- Build 模擬器

\- 天賦計算機



待網站成熟後，再依需求規劃。

