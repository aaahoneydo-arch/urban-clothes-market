# Urban Clothes Market

This site is a discovery hub. **BUY NOW!** links open the exact product in the shop selling it. Do not add a local cart, fake checkout, fabricated order confirmation, or Google/Bing merchant feed.

Run `npm run build` followed by `npm test`. The supported build entry point is `scripts/build-hub.mjs`; older build/discovery scripts are retained as history and must not be used to publish this hub.

Catalog records in `data/catalog.json` keep the title, product type, image, source date, and purchase URL together. Never join design titles to art using a reused numeric generator ID. Never synthesize product variants or guess destination slugs. Missing images use a text fallback, never another design. Current options, pricing, shipping, and returns are confirmed at the selling shop.

The restored Spreadshop catalog comes from the October 10 public-shop snapshot. The additional curated Threadless, Fourthwall, Printify, and Printful products and images were read together from their live shop cards on October 14. Full shops remain linked for their current collections. Unverified generated records are excluded; the original local repository and its catalog were not changed.

`.openai/hosting.json` identifies the existing site. Build, validate, and package locally before publishing its saved version. Keep this repository as the publication source so older generated catalogs cannot overwrite the repair.


## Threadless catalog intake
Run `node scripts/audit-threadless.mjs <generated-catalog.json> <live-audit.json> <output-folder>` against a stable source snapshot. The audit assigns physical categories separately from publication status, records source hashes, and quarantines unverified variants. Never expand every design by a fixed product count or copy one mockup to unrelated products. Confirm the exact design ID, enabled product option, destination and physical mockup together before adding a product. The importer rejects quarantined records. Prices, materials, stock and shipping must come from that product page or be omitted. This workflow does not modify the active uploader and does not create merchant feeds.

The GitHub Pages repair preserves old files and uses a shared guard to prevent unverified legacy pages from presenting purchase forms. The source HTML of retained legacy pages still requires later archival cleanup; no wholesale deletion is performed.
