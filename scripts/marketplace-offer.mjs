// Resolve a partner export row against the product and offer actually presented to a buyer.
export function matchMarketplaceOffer(html, expected) {
  const analytics = html.match(/window\.analytics\.product\s*=\s*(\{[^\n]+?\});/);
  const schema = html.match(/<script\b[^>]*id="seo-json-ld"[^>]*>([\s\S]*?)<\/script>/i);
  if (!analytics || !schema) throw new Error('Missing merchant product details');
  const product = JSON.parse(analytics[1]);
  const listing = JSON.parse(schema[1]);
  if (product.designerName !== 'Urban Clothes Market' ||
      product.articleId !== expected.designId ||
      product.sellableId !== expected.sellable ||
      String(product.productTypeId) !== expected.productType) {
    throw new Error('Merchant returned another creator, design or product type');
  }
  if (String(product.appearanceId) !== expected.appearance || product.stockout ||
      !product.availableAppearances?.map(String).includes(expected.appearance) || !product.availableSizes?.length) {
    throw new Error('Requested variant is unavailable');
  }
  const offers = Array.isArray(listing.offers) ? listing.offers : [listing.offers];
  for (const offer of offers) {
    if (!offer?.url || offer.priceCurrency !== 'USD' || !Number.isFinite(Number(offer.price)) ||
        Number(offer.price) <= 0 || !/\/InStock$/.test(offer.availability)) continue;
    const destination = new URL(offer.url);
    if (destination.origin !== 'https://www.spreadshirt.com' ||
        !destination.pathname.startsWith('/shop/design/') || !destination.pathname.endsWith('-D'+expected.designId) ||
        destination.searchParams.get('sellable') !== expected.sellable ||
        destination.searchParams.get('appearance') !== expected.appearance) continue;
    if (listing['@type'] !== 'Product' || !listing.name || !/Add to basket/i.test(html)) break;
    return {url: destination.href, name: listing.name, design: product.articleName,
      productType: listing.name.startsWith(product.articleName+' ') ? listing.name.slice(product.articleName.length+1) : null,
      price: Number(offer.price), verifiedAt: new Date().toISOString()};
  }
  throw new Error('No exact, orderable USD offer');
}

export async function lookupMarketplaceOffer(design, sellable, productTypeId, appearanceId, typeName) {
  const expected = {designId:String(design.id),sellable:String(sellable.sellableId || ''),
    productType:String(productTypeId),appearance:String(appearanceId)};
  if (!/^[a-z0-9]+$/i.test(expected.designId) || !/^[a-z0-9]+-\d+$/i.test(expected.sellable) ||
      !expected.sellable.endsWith('-'+expected.productType) || !/^\d+$/.test(expected.appearance)) {
    throw new Error('Incomplete seller export identifiers');
  }
  const slug = (design.title+' '+typeName).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'+').replace(/^\+|\+$/g,'');
  const candidate = new URL('https://www.spreadshirt.com/shop/design/'+slug+'-D'+expected.designId);
  candidate.searchParams.set('sellable',expected.sellable);
  candidate.searchParams.set('appearance',expected.appearance);
  const response = await fetch(candidate, {signal:AbortSignal.timeout(25000), headers:{
    'User-Agent':'UrbanClothesMarket-CatalogAudit/1.0 (+https://urbanclothesmarket.com/)', 'Accept':'text/html'
  }});
  if (!response.ok) throw new Error('Merchant HTTP '+response.status);
  if (new URL(response.url).origin !== candidate.origin) throw new Error('Unexpected merchant redirect');
  return matchMarketplaceOffer(await response.text(),expected);
}
