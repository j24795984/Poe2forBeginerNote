# JSON 資料規則

- 每個 JSON 檔案內的 `id` 必須唯一。
- 新資料從該檔案的 `idRegistry.nextSequence` 配發下一個序號，並遞增 `nextSequence`。
- 刪除資料時，將其 `id` 加入 `idRegistry.retiredIds`；已退休的 ID 不得重複使用。
- 跨 JSON 關聯一律使用 ID，例如 `leagueMechanicIds` 對應 `leagueMechanics[].id`。
- `currencies.json` 只保存 POE2DB 通貨索引連結；通貨清單不在本專案重複維護。
- 高價值通貨與高價值物品分別維護於 `high-value-currencies.json` 與 `high-value-items.json`。
- `campaign.json` 維護主線章節、地圖路徑、任務區域關聯、目標與獎勵；圖片路徑以 `public/` 為基準。

執行 `npm run data:validate` 可檢查每個 JSON 的重複與退休 ID。
