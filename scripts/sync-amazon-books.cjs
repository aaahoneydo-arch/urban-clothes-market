#!/usr/bin/env node
/**
 * Automated Weekly KDP Book Sync Script for urbanclothesmarket.com
 * Usage:
 *   node scripts/sync-amazon-books.cjs
 *   node scripts/sync-amazon-books.cjs --no-build
 *
 * Scrapes Jason Coleman's Amazon Author Central page (B0HHYS2BHM) and Amazon Books
 * newest-arrivals search to discover newly published weekly KDP titles, merges any
 * new ASINs/editions into data/books.json, and triggers `node scripts/build.mjs --force`.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { execSync } = require('node:child_process');

const AUTHOR_ID = 'B0HHYS2BHM';
const AUTHOR_ALLBOOKS_URL = `https://www.amazon.com/stores/Jason-Coleman/author/${AUTHOR_ID}/allbooks`;
const AUTHOR_SEARCH_URL = 'https://www.amazon.com/s?i=stripbooks&rh=p_27%3AJason+Coleman&s=date-desc-rank';
const BOOKS_JSON_PATH = path.resolve(__dirname, '../data/books.json');

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function fetchHtml(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
  });
}

function parseAmazonItemsFromHtml(html) {
  const discovered = [];
  if (!html) return discovered;

  // Match search result blocks or store cards with data-asin
  const blockRegex = /data-asin="([B0-9][A-Z0-9]{9})"[\s\S]{0,4000}?(?=data-asin="[B0-9][A-Z0-9]{9}"|$)/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const asin = match[1];
    const block = match[0];
    if (!asin || asin === AUTHOR_ID) continue;

    // Extract title
    const titleMatch =
      block.match(/<span class="a-size-(?:medium|base-plus|large)[^"]*"[^>]*>([^<]{4,160})<\/span>/i) ||
      block.match(/alt="([^"]{5,160})"/i);
    const rawTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim() : '';

    // Extract cover image
    const imgMatch = block.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%+._-]+\.jpg/i);
    const cover = imgMatch ? imgMatch[0].replace(/\._[A-Z0-9_,]+_\.jpg$/i, '._SL1000_.jpg') : '';

    if (rawTitle && cover && !/sponsored/i.test(rawTitle)) {
      discovered.push({ asin, title: rawTitle, cover });
    }
  }
  return discovered;
}

async function scrapeWithPuppeteerFallback() {
  const puppeteerPath = 'C:/Users/aaaho/.gemini/antigravity-ide/scratch/node_modules/puppeteer-core';
  if (!fs.existsSync(puppeteerPath)) return [];
  const chromeCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
  if (!executablePath) return [];

  let browser;
  try {
    const puppeteer = require(puppeteerPath);
    browser = await puppeteer.launch({
      executablePath,
      headless: false,
      args: [
        '--window-position=-2400,0',
        '--window-size=1280,900',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    const page = await browser.newPage();
    const results = [];
    for (const url of [AUTHOR_ALLBOOKS_URL, AUTHOR_SEARCH_URL]) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise((r) => setTimeout(r, 2500));
        const html = await page.content();
        results.push(...parseAmazonItemsFromHtml(html));
      } catch (_) {}
    }
    await browser.close();
    return results;
  } catch (_) {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    return [];
  }
}

function inferThemesFromTitle(title) {
  const t = String(title || '').toLowerCase();
  if (/dixon|ash|winter road|far bank|hollow road|survival/.test(t)) {
    return ['trades', 'mechanics', 'carpentry', 'dads', 'outdoor', 'americana', 'survival', 'tools', 'garage', 'family'];
  }
  if (/draevan|vampire|blood|starlight|stormborn|crown|outcasts|legions/.test(t)) {
    return ['gothic', 'vampire', 'dark fantasy', 'thriller', 'supernatural', 'raven', 'skull', 'wolf', 'night'];
  }
  if (/tiff|alibi|2035|cyber|ai|odds|chase/.test(t)) {
    return ['cyberpunk', 'sci-fi', 'thriller', 'tech', 'coding', 'gamer', 'neon', 'future'];
  }
  if (/colorland|jay and jae|kid/.test(t)) {
    return ['kids', 'baby', 'animals', 'cats', 'dogs', 'family', 'cute', 'nature'];
  }
  return ['history', 'philosophy', 'humor', 'americana', 'dads', 'coffee'];
}

async function main() {
  console.log('=== URBAN CLOTHES MARKET · WEEKLY AMAZON KDP BOOK SYNC ===');
  console.log(`Author Central URL: ${AUTHOR_ALLBOOKS_URL}`);
  console.log(`Newest Releases Search: ${AUTHOR_SEARCH_URL}`);

  const booksData = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, 'utf8'));
  const knownAsins = new Set();
  for (const b of booksData.books) {
    if (b.primaryAsin) knownAsins.add(b.primaryAsin);
    if (b.kindleAsin) knownAsins.add(b.kindleAsin);
    if (b.paperbackAsin) knownAsins.add(b.paperbackAsin);
    if (b.hardcoverAsin) knownAsins.add(b.hardcoverAsin);
    if (b.audiobookAsin) knownAsins.add(b.audiobookAsin);
  }
  console.log(`Currently tracking ${booksData.books.length} live books (${knownAsins.size} format ASINs) in data/books.json.`);

  let discovered = [];
  for (const url of [AUTHOR_ALLBOOKS_URL, AUTHOR_SEARCH_URL]) {
    const html = await fetchHtml(url);
    const parsed = parseAmazonItemsFromHtml(html);
    discovered.push(...parsed);
  }

  if (discovered.length === 0 && process.argv.includes('--live-browser')) {
    console.log('Using offscreen Puppeteer browser fallback to check Amazon Author Central...');
    discovered = await scrapeWithPuppeteerFallback();
  }

  let addedCount = 0;
  for (const item of discovered) {
    if (knownAsins.has(item.asin)) continue;
    // Check if title matches an existing book (e.g., new format ASIN)
    const normItemTitle = item.title.split(':')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
    const existingBook = booksData.books.find((b) => {
      const normBookTitle = b.title.split(':')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
      return normBookTitle && normItemTitle && (normBookTitle === normItemTitle || normItemTitle.includes(normBookTitle));
    });

    if (existingBook) {
      if (!existingBook.paperbackAsin) {
        existingBook.paperbackAsin = item.asin;
        knownAsins.add(item.asin);
        console.log(`  + Linked additional format ASIN ${item.asin} to existing book "${existingBook.title}"`);
      }
      continue;
    }

    // Add brand-new KDP book release
    const parts = item.title.split(/\s*[:—-]\s*/);
    const mainTitle = parts[0] ? parts.slice(0, 2).join(': ') : item.title;
    const subTitle = parts.length > 2 ? parts.slice(2).join(' — ') : 'Official Original Release by Jason Coleman';
    const slug = slugify(mainTitle);

    const newBook = {
      id: slug,
      slug,
      title: mainTitle,
      subtitle: subTitle,
      series: 'Jason Coleman Original Release',
      genre: 'Original Fiction & Speculative Literature',
      badge: 'New Weekly KDP Release',
      primaryAsin: item.asin,
      kindleAsin: item.asin,
      hardcoverAsin: '',
      paperbackAsin: '',
      audiobookAsin: '',
      price: '4.99',
      kindleUnlimited: true,
      cover: item.cover,
      description: `${item.title} by Jason Coleman. Available now on Amazon Kindle, Kindle Unlimited, Paperback, and Hardcover.`,
      themes: inferThemesFromTitle(item.title),
      keywords: [mainTitle, `${mainTitle} Jason Coleman`, 'Jason Coleman Amazon book']
    };

    booksData.books.unshift(newBook);
    knownAsins.add(item.asin);
    addedCount++;
    console.log(`  + Added new KDP release: "${newBook.title}" (ASIN: ${newBook.primaryAsin})`);

    // Remove from upcomingPipeline if matched
    if (Array.isArray(booksData.upcomingPipeline)) {
      booksData.upcomingPipeline = booksData.upcomingPipeline.filter(
        (u) => !u.title.toLowerCase().includes(mainTitle.toLowerCase().slice(0, 18))
      );
    }
  }

  // Always validate all 18+ books in data/books.json have valid slugs, covers, and ASINs
  for (const b of booksData.books) {
    if (!b.slug) b.slug = slugify(b.title);
    if (!b.primaryAsin) b.primaryAsin = b.kindleAsin || b.paperbackAsin || b.hardcoverAsin;
  }

  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(booksData, null, 2) + '\n', 'utf8');
  console.log(`✓ Saved data/books.json (${booksData.books.length} live books, ${addedCount} newly added this run).`);

  if (!process.argv.includes('--no-build')) {
    console.log('Triggering full static storefront + book & guide pages build (node scripts/build.mjs --force)...');
    execSync('node scripts/build.mjs --force', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
  }
}

main().catch((err) => {
  console.error('Error in sync-amazon-books.cjs:', err);
  process.exit(1);
});
