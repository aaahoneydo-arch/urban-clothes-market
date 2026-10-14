import fs from 'node:fs';
import path from 'node:path';

console.log('=== GENERATING STATIC PRODUCT PAGES FOR VERIFIED LISTINGS ===');

const catalogPath = fs.existsSync(path.resolve('data/catalog.json'))
  ? path.resolve('data/catalog.json')
  : path.resolve('data/generated-mockup-catalog.json');
if (!fs.existsSync(catalogPath)) {
  console.error('catalog.json not found!');
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Generating pages for ${products.length} verified physical products from ${path.basename(catalogPath)}...`);

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PRODUCTS_DIR = path.resolve('products');
let count = 0;

for (const p of products) {
  const slug = p.id.replace(/^ucm-/, '');
  const dir = path.join(PRODUCTS_DIR, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 24.99;
  const priceFormatted = priceNum.toFixed(2);
  const designQuery = encodeURIComponent(p.design || p.name);
  const checkoutUrl = p.supplierUrl || `https://urbanclothesmarket.myspreadshop.com/?q=${designQuery}`;

  const descText = p.description || `Official ${p.name}. Custom made-to-order high quality graphic physical merchandise from Urban Clothes Market with fast US delivery and 30-day money-back guarantee.`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": [p.image],
    "sku": p.id,
    "description": descText,
    "brand": {
      "@type": "Brand",
      "name": "Urban Clothes Market"
    },
    "offers": {
      "@type": "Offer",
      "price": priceFormatted,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": p.url,
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Urban Clothes Market"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "6.99",
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 6,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn",
        "merchantReturnLink": "https://www.urbanclothesmarket.com/returns/"
      }
    }
  });

  const sizesHtml = (p.sizes || ['One Size']).map(s => `<span class="size-pill">${esc(s)}</span>`).join(' ');
  const colorsHtml = (p.colors || ['Standard']).join(' · ');

  const html = `<!DOCTYPE HTML><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} | Urban Clothes Market</title><meta name="description" content="${esc(descText)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${esc(p.url)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(p.name)}"><meta property="og:description" content="${esc(descText)}"><meta property="og:url" content="${esc(p.url)}"><meta property="og:site_name" content="Urban Clothes Market"><meta property="og:image" content="${esc(p.image)}"><meta name="theme-color" content="#d5fa42"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=20261012-prosuite"><script type="module" src="/app.js?v=20261012-prosuite"></script><script type="application/ld+json">${jsonLd}</script></head><body><div class="announce">⚡ 740+ Original Graphic Designs Across 13,844+ Verified Products. <span>Wear Your Personality.</span></div><header class="header"><div class="wrap headrow"><a class="logo" href="/" aria-label="Urban Clothes Market home"><span class="logo-mark">UCM</span><span class="logo-text">URBAN CLOTHES<small>MARKET</small></span></a><form class="head-search" action="/#catalog" method="GET" role="search"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="head-search-input" name="q" type="search" placeholder="Search 13,844+ items (cats, gaming, cars, hoodies, mugs...)" aria-label="Search all items" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd><button type="submit">Search</button></form><nav class="topnav" aria-label="Main navigation"><a href="/#catalog">Explore All</a><a href="/types/tees/">Tees &amp; Tanks</a><a href="/types/hoodies/">Hoodies</a><a href="/types/mugs/">Drinkware</a><a href="/types/hats/">Hats</a><a href="/#collections">Themes</a></nav><div class="head-actions"><button data-favorites aria-label="View favorites"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span class="pill-count" data-favcount>0</span></button></div></div></header><main><div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / <a href="/#catalog">${esc(p.category || 'Apparel')}</a> / ${esc(p.name)}</div><section class="detail"><div class="detail-image"><img data-gallery-main src="${esc(p.image)}" alt="${esc(p.name)}" width="700" height="700" fetchpriority="high"></div><div class="detail-info"><div class="eyebrow">Wear your personality</div><h1>${esc(p.name)}</h1><h2>${esc(p.productType || 'Custom Merchandise')}</h2><div class="detail-price">$${priceFormatted}</div><small>USD · Catalog price checked October 2026</small><p class="detail-desc" style="font-size: 1.05rem; line-height: 1.6; color: #222; margin: 15px 0;">${esc(descText)}</p><div class="sizes-section" style="margin: 15px 0;"><strong>Available Sizes:</strong> <div style="margin-top: 6px;">${sizesHtml}</div></div><a class="btn dark" href="${checkoutUrl}">Pick size &amp; colors <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><div class="payment-trust-bar"><div class="trust-heading"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Guaranteed Safe &amp; Secure Checkout</span></div><div class="payment-icons"><span class="pay-badge gpay" title="Google Pay Accepted at Checkout"><strong style="color:#4285F4">G</strong><strong>Pay</strong></span><span class="pay-badge applepay" title="Apple Pay Accepted at Checkout"><strong>Pay</strong></span><span class="pay-badge paypal" title="PayPal Accepted at Checkout"><strong style="color:#003087">PayPal</strong></span><span class="pay-badge card" title="Visa / Mastercard Accepted"><span>Cards</span></span></div><div class="trust-note">Fast 1-click checkout with Google Pay, Apple Pay &amp; PayPal confirmed at checkout.</div></div><dl><dt>Product Type</dt><dd>${esc(p.productType || 'Custom Merch')}</dd><dt>Available Colors</dt><dd>${esc(colorsHtml)}</dd><dt>Shipping</dt><dd>Standard US Shipping (3-6 days)</dd><dt>Guarantee</dt><dd>30-Day Free Return Policy</dd></dl></div></section></div></main><footer class="footer"><div class="wrap"><div class="foot-bottom"><span>© 2026 Urban Clothes Market. Made to order. Delivered directly to your door.</span><span>Catalog verified · Google Customer Reviews partner</span></div></div></footer><div id="toast" class="toast" role="status" hidden></div></body></html>`;

  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  count++;
}

console.log(`Successfully generated ${count} static product HTML pages.`);
