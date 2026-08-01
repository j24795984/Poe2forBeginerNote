# JSON 資料規則

- 每個 JSON 檔案內的 `id` 必須唯一。
- 新資料從該檔案的 `idRegistry.nextSequence` 配發下一個序號，並遞增 `nextSequence`。
- 刪除資料時，將其 `id` 加入 `idRegistry.retiredIds`；已退休的 ID 不得重複使用。
- 跨 JSON 關聯一律使用 ID，例如 `leagueMechanicIds` 對應 `leagueMechanics[].id`。
- 通貨價格改由 POE2DB 經濟頁提供；本專案不重複維護一般通貨清單。
- `special-high-value-drops.json` 目前只維護特殊高價掉落；每筆資料以 `typeId` 關聯檔內類型，並以 `acquisition.summary` 提供列表簡述。只有具備完整說明的項目才加入 `acquisition.detail.title` 與受信任的 `acquisition.detail.html`，供頁面燈箱排版。類型預留通貨、碎片、門票、傳奇與限定傳奇；傳奇裝備待資料確認後再加入正式項目。
- Campaign 與 Atlas 都採用 `*-entities.json`、`*-relations.json` 與呈現層 JSON，三者的 `dataVersion` 必須一致。
- `campaign.json` 維護章節呈現順序與地圖路徑；任務、永久獎勵及其地圖關聯由 Campaign 的實體與關聯檔提供。圖片路徑以 `public/` 為基準。
- 已停用或被取代的資料保留於 `archive/data/legacy/`，不得從執行期頁面載入。

執行 `npm run data:validate` 可檢查 Campaign 與 Atlas 關聯資料的 ID、版本與跨檔引用。
