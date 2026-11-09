# Jason Coleman storefronts

Urban Clothes Market and Jason TV Marketplace use this one master catalog. The Urban Clothes Market repository owns the source. Both sites offer every approved design, variant and book edition. Jason TV is the canonical home for books and videos. Urban Clothes Market is the canonical home for design and apparel detail pages.

## Source records

* merch.json.gz contains only seller-confirmed items from Urban Clothes Market on Spreadshirt. Each row has its direct USD offer URL, price, seller design ID, sale SKU and appearance. Product photos come from the seller. An old shop URL, guessed SKU, generic store homepage or search result cannot act as checkout.
* books.json comes from Jason Coleman's live Amazon All Books page (author B0HHYS2BHM). Keep each named format and its corresponding Amazon product ID. Merge multiple formats of the same work on one book page. The buttons always use the edition-specific Amazon detail URL.
* archive.json.gz contains the public Videos, Shorts and Live tabs for YouTube channel UC5EY2rDVHdIOskfZcwR8t3Q. videos.json maps selected adaptations back to their books. The storefront loads a small initial selection and the full browsable archive on demand. The static video indexes and watch pages also work without JavaScript.

## Refresh merchandise

Run discover_seller.py against the publicly visible seller catalog or use a fresh seller export that includes actual sellable identifiers. verify_purchases.py accepts one or more --source catalog JSON files, --output to a newline-delimited results file, and --prior for an existing checkpoint. Verify the named creator, exact design, product type, SKU, appearance, availability, UTC check date, price and seller offer. Keep inconclusive and missing items for review. The checkout directory in the main Urban Clothes Market repository contains the original full 22,075-item audit.

Run refresh_merch.py with --evidence for each complete evidence snapshot and subsequent revisions, --existing merch.json.gz and --out pointing to a new catalog. Later evidence supersedes earlier evidence for the same SKU. Review the printed counts before replacing merch.json.gz. Use the seller-provided canonical URL even when the title was renamed, and retain working design slugs when rebuilding.

## Refresh video and book listings

Export each public channel tab with yt-dlp --flat-playlist --skip-download --dump-single-json. Use yt-videos.json, yt-shorts.json and yt-streams.json in a temporary directory. Run refresh_videos.py --dir that-directory --out archive.json.gz. It checks the channel ID, deduplicates YouTube IDs and excludes deleted or private placeholders. For books, open the Amazon author page, choose All Books, expand the available titles, and copy the actual Amazon links for each edition. Never copy a different edition's product ID into a paperback, Kindle or hardcover button.

## Publish

The two exact GitHub remotes are aaahoneydo-arch/urban-clothes-market and aaahoneydo-arch/jason-coleman-media-network. Their CNAME files identify urbanclothesmarket.com and jasontvmarketplace.com. Each production GitHub Pages source is the docs folder of main. Old source stays in Git for rollback.

From the canonical source, run python publish.py --urban PATH_TO_URBAN_REPO --jason PATH_TO_JASON_REPO. The program builds both folders and checks every generated HTML link before replacing the two docs folders. Commit approved source changes in the canonical repository. Supply --push to publish checked outputs from the local repositories. Confirm both Pages deployments succeed and open both real domains afterward. An action-generated Git commit can require a subsequent Pages build.

Known product addresses from the previous sites and product advertising feeds get real static landing files. An exact active SKU leads to its official seller offer. A retired item identifies its status and provides navigation without substituting another product. The Spreadshop-named exports contain only verified merchandise with matching seller artwork. Amazon editions and video entries are excluded from those feeds. The storefront build never changes Merchant Center account settings.
