import fs from 'node:fs';
import path from 'node:path';
import { normalize, TYPES, THEMES } from '../src/catalog-model.mjs';
import { filters } from '../src/templates.mjs';

const UCM_ROOT = path.resolve('.');
const raw = JSON.parse(fs.readFileSync('data/catalog.json'));
const products = normalize(raw);
const sync = JSON.parse(fs.readFileSync('data/catalog-sync.json', 'utf8'));

const meta = {
    count: products.length,
    updated: sync.checkedDate,
    typeCounts: {},
    themeCounts: {},
    themeHero: {}
};

for (const [id] of TYPES) {
    meta.typeCounts[id] = products.filter(p => id === 'kids' ? p.kids : p.category === id).length;
}
for (const [id] of THEMES) {
    const group = products.filter(p => id === 'all' || p.themes.includes(id));
    meta.themeCounts[id] = group.length;
}

console.log(`Loaded catalog: ${products.length} products.`);

// Helper to replace <aside class="filters"...</aside> with new sidebar
function updateSidebarInFile(filePath, typeId = '', themeId = '') {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    const sidebarHtml = filters(meta, { type: typeId, theme: themeId });
    // Extract just the <aside ... </aside>
    const match = sidebarHtml.match(/<aside class="filters walmart-sidebar"[\s\S]*?<\/aside>/);
    if (!match) {
        console.error('Failed to match walmart-sidebar in filters output');
        return;
    }
    const newAside = match[0];

    // Replace old aside in file
    const oldAsideRegex = /<aside class="filters"[\s\S]*?<\/aside>/;
    if (oldAsideRegex.test(html)) {
        html = html.replace(oldAsideRegex, newAside);
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`Updated sidebar in: ${path.relative(UCM_ROOT, filePath)}`);
    } else {
        console.log(`No old aside found in: ${path.relative(UCM_ROOT, filePath)}`);
    }
}

// 1. Update all types/*/index.html
for (const [id] of TYPES) {
    const p = path.join(UCM_ROOT, 'types', id, 'index.html');
    updateSidebarInFile(p, id, '');
}

// 2. Update all collections/*/index.html
for (const [id] of THEMES) {
    const p = path.join(UCM_ROOT, 'collections', id, 'index.html');
    updateSidebarInFile(p, '', id);
}

// 3. Update collections/all/index.html
updateSidebarInFile(path.join(UCM_ROOT, 'collections/all/index.html'), '', 'all');

console.log('Finished updating sidebar across all department & collection hub pages.');
