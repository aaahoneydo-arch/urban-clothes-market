import fs from 'fs';
import path from 'path';

console.log('=== HEALING ALL CATALOG TITLES, DESIGNS, AND METADATA ===');

const catalogPath = path.resolve('data/catalog.json');
const groundTruthPath = path.resolve('data/ground_truth_design_map.json');
const flowDesignNamesPath = path.resolve('data/flow-design-names.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));

console.log(`Loaded ${catalog.length} items from catalog.`);
console.log(`Loaded ${Object.keys(groundTruth).length} verified designs from ground truth.`);

let healedTitles = 0;
let healedDesigns = 0;
let healedTags = 0;

// Also build an updated flow-design-names map
const updatedFlowNames = {};

for (const p of catalog) {
  let designKey = null;
  const imgMatch = (p.image || '').match(/(flow-gen-\d{4}|flow-oct15-\d{3}|[0-9]{3}_[A-Za-z]+_[A-Z])/i);
  const idMatch = (p.id || '').match(/(flow-gen-\d{4}|flow-oct15-\d{3}|flow-95-(\d+))/i);
  
  if (imgMatch) {
    designKey = imgMatch[1].toLowerCase();
  } else if (idMatch) {
    if (idMatch[2]) {
      designKey = `flow-gen-${String(idMatch[2]).padStart(4, '0')}`;
    } else {
      designKey = idMatch[1].toLowerCase();
    }
  }

  if (designKey && groundTruth[designKey]) {
    const verified = groundTruth[designKey];
    const trueDesign = verified.title;
    
    // Update flow names dictionary
    const numMatch = designKey.match(/flow-gen-(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      updatedFlowNames[String(num)] = trueDesign;
      updatedFlowNames[String(num).padStart(4, '0')] = trueDesign;
    }

    // Check if design name needs healing
    if (p.design !== trueDesign) {
      p.design = trueDesign;
      healedDesigns++;
    }

    // Standardize product type
    let pType = p.productType;
    if (!pType) {
      if (p.category === 'hoodies') pType = 'Premium Pullover Hoodie';
      else if (p.category === 'tees') pType = 'Classic Graphic T-Shirt';
      else if (p.category === 'hats') pType = 'Embroidered Dad Hat';
      else if (p.category === 'mugs') pType = 'Ceramic Coffee Mug';
      else pType = 'Graphic Apparel';
    }

    // Clean new title: "[Verified Title] — [Product Type]"
    const expectedName = `${trueDesign} — ${pType}`;
    if (p.name !== expectedName) {
      p.name = expectedName;
      healedTitles++;
    }

    // Update tags if verified has rich tags
    if (verified.tags && verified.tags.length > 0) {
      const mergedTags = Array.from(new Set([...(p.tags || []), ...verified.tags]));
      if (!p.tags || p.tags.length !== mergedTags.length) {
        p.tags = mergedTags;
        healedTags++;
      }
    }

    // Clean up description if empty or generic
    if (!p.description || p.description.includes('Neo-Tokyo') && !trueDesign.includes('Neo-Tokyo')) {
      p.description = `Official "${trueDesign}" ${pType} from the Urban Clothes Market collection. Premium direct-to-garment print with vibrant archival inks on durable, comfortable fabric. 100% authentic original artwork.`;
    }
  }
}

// Write healed catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Saved updated catalog to ${catalogPath}`);

// Write updated flow-design-names.json
fs.writeFileSync(flowDesignNamesPath, JSON.stringify(updatedFlowNames, null, 2), 'utf8');
console.log(`Saved updated flow design names to ${flowDesignNamesPath}`);

console.log(`=== HEALING COMPLETE ===`);
console.log(`Healed Titles: ${healedTitles}`);
console.log(`Healed Designs: ${healedDesigns}`);
console.log(`Healed Tags: ${healedTags}`);
