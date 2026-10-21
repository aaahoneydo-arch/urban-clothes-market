import fs from 'node:fs';
import path from 'node:path';

const ZAZZLE_ALL = 'scratch/zazzle_visual_audit/zazzle_all_resolved_products.json';
const TEEPUBLIC_ALL = 'scratch/teepublic_visual_audit/teepublic_all_resolved_designs.json';
const REDBUBBLE_REPORT = 'scratch/redbubble_visual_audit/redbubble_audit_full_report.json';
const REDBUBBLE_IMAGES = 'scratch/redbubble_visual_audit/redbubble_work_images.json';
const PRINTIFY_ALL = 'scratch/printify_visual_audit/printify_all_published_from_api.json';

const CATALOG_PATH = 'data/catalog.json';

function cleanPrice(raw) {
  if (!raw) return '$22.00';
  const m = String(raw).match(/\$\d+(\.\d{2})?/);
  return m ? m[0] : '$22.00';
}

function runIntegration() {
  console.log('=== INTEGRATING ALL VERIFIED MULTICHANNEL LISTINGS ===');

  // 1. Zazzle Products (645 verified)
  const zazzleData = JSON.parse(fs.readFileSync(ZAZZLE_ALL, 'utf8'));
  const zazzleProducts = zazzleData.map(item => {
    return {
      id: `zazzle-${item.productId}`,
      name: item.title,
      url: item.url,
      image: item.image,
      price: cleanPrice(item.price),
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['White', 'Black', 'Heather Grey', 'Navy'],
      brand: 'Zazzle',
      channel: 'Zazzle'
    };
  });
  console.log(`✓ Prepared ${zazzleProducts.length} verified Zazzle products.`);

  // 2. TeePublic Products (47 verified)
  const tpData = JSON.parse(fs.readFileSync(TEEPUBLIC_ALL, 'utf8'));
  const teepublicProducts = tpData.map(item => {
    return {
      id: `teepublic-${item.id}`,
      name: item.title,
      url: item.url,
      image: item.image,
      price: cleanPrice(item.price),
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['White', 'Black', 'Vintage Heather', 'Navy', 'Royal Blue'],
      brand: 'TeePublic',
      channel: 'TeePublic'
    };
  });
  console.log(`✓ Prepared ${teepublicProducts.length} verified TeePublic products.`);

  // 3. Redbubble Products (129 verified)
  const rbReport = JSON.parse(fs.readFileSync(REDBUBBLE_REPORT, 'utf8'));
  const rbImages = JSON.parse(fs.readFileSync(REDBUBBLE_IMAGES, 'utf8'));

  const redbubbleProducts = rbReport.map(item => {
    const img = rbImages[item.workId] || `https://ih1.redbubble.net/image.${item.workId}/flat,600x600,075,f.jpg`;
    return {
      id: `redbubble-${item.workId}`,
      name: item.pdpTitle || item.title,
      url: item.url,
      image: img,
      price: cleanPrice(item.price),
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['White', 'Black', 'Heather Grey', 'Dark Blue'],
      brand: 'Redbubble',
      channel: 'Redbubble'
    };
  });
  console.log(`✓ Prepared ${redbubbleProducts.length} verified Redbubble products.`);

  // 4. Printify Products (4,613 verified published)
  const printifyData = JSON.parse(fs.readFileSync(PRINTIFY_ALL, 'utf8'));
  const printifyProducts = printifyData.map(item => {
    const defImg = item.images?.find(i => i.is_default) || item.images?.[0];
    let imgSrc = defImg?.src || '';
    if (imgSrc && !imgSrc.includes('s=')) {
      imgSrc += (imgSrc.includes('?') ? '&' : '?') + 's=2048';
    }

    const enabledVar = item.variants?.find(v => v.is_enabled) || item.variants?.[0];
    const priceStr = enabledVar && enabledVar.price ? '$' + (enabledVar.price / 100).toFixed(2) : '$24.99';

    // Unique sizes
    const sizes = Array.from(new Set((item.variants || []).map(v => {
      const parts = (v.title || '').split(' / ');
      return parts[0] || 'Standard';
    }))).slice(0, 8);

    return {
      id: `printify-${item.externalId || item.id}`,
      name: item.title,
      url: item.url,
      image: imgSrc,
      price: cleanPrice(priceStr),
      sizes: sizes.length ? sizes : ['Standard'],
      colors: ['Default'],
      brand: 'Printify',
      channel: 'Printify'
    };
  });
  console.log(`✓ Prepared ${printifyProducts.length} verified Printify products.`);

  // Load existing catalog to preserve Spreadshop
  const existingCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const spreadshopOnly = existingCatalog.filter(p => {
    if (!p.url) return false;
    return p.url.includes('spreadshop.com');
  });

  console.log(`Preserving ${spreadshopOnly.length} Spreadshop products (as instructed, leaving Spreadshop unchanged).`);

  // Combine: Verified Zazzle + TeePublic + Redbubble + Printify + existing Spreadshop
  const combinedCatalog = [
    ...zazzleProducts,
    ...teepublicProducts,
    ...redbubbleProducts,
    ...printifyProducts,
    ...spreadshopOnly
  ];

  console.log(`Total new catalog size: ${combinedCatalog.length} products.`);

  // Save updated catalog
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(combinedCatalog, null, 2));
  console.log(`Successfully written to ${CATALOG_PATH}`);

  // Write comprehensive audited multichannel manifest
  const manifest = {
    updatedAt: new Date().toISOString(),
    summary: {
      zazzle: zazzleProducts.length,
      teepublic: teepublicProducts.length,
      redbubble: redbubbleProducts.length,
      printify: printifyProducts.length,
      spreadshop: spreadshopOnly.length,
      total: combinedCatalog.length
    },
    sampleZazzle: zazzleProducts.slice(0, 5),
    sampleTeePublic: teepublicProducts.slice(0, 5),
    sampleRedbubble: redbubbleProducts.slice(0, 5),
    samplePrintify: printifyProducts.slice(0, 5)
  };

  fs.writeFileSync('data/verified_multichannel_manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`Saved verified manifest to data/verified_multichannel_manifest.json`);
}

runIntegration();
