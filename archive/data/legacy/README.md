# Legacy JSON archive

Archived on 2026-08-01 while normalizing the campaign and valuable-item data layers.

These files are retained for provenance and possible comparison. They are outside `public/`, are not published with the static site, and must not be loaded by runtime pages.

## Superseded campaign datasets

- `campaign-quests.json`
- `poe2_campaign_permanent_rewards_0.5_zh-TW.json`
- `poe2_campaign_permanent_rewards_by_map_0.5_zh-TW.json`

Their normalized content now lives in `public/data/campaign-entities.json`; relationships live in `public/data/campaign-relations.json`; page presentation remains in `public/data/campaign.json`.

## Empty or inactive placeholders

- `bosses.json`
- `categories.json`
- `currencies.json`
- `high-value-currencies.json`
- `high-value-items.json`

Keep these files until the website data model is near completion, then review them together for permanent removal or migration.
