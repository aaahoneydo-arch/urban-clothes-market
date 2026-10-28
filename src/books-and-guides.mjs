import { esc, card, ORIGIN, AMAZON_AUTHOR_URL, bookFormatButtonsHtml, bookCardHtml, booksShowcaseSection } from './templates.mjs';

export const NICHE_GUIDES = [
  {
    slug: 'post-apocalyptic-survival-handyman-gifts',
    title: 'Post-Apocalyptic Survival & Handyman Gifts — Books, Graphic Tees & Gear',
    shortTitle: 'Post-Apocalyptic Survival & Handyman Gifts',
    eyebrow: 'SURVIVAL FICTION · PRACTICAL TRADES & PREPPER GEAR',
    description: "Pair Jason Coleman's new survival novel 'Dixon's Journal: Book One — A House Beneath The Ash' with rugged handyman, tool, and survivalist graphic hoodies, tees, and camper mugs.",
    lead: "Written for people who fix what breaks, keep a stocked workshop, and love grounded post-apocalyptic survival stories where real tools and grit matter. Pair today's newest release 'Dixon's Journal: Book One — A House Beneath The Ash' with 16 made-to-order graphic apparel and drinkware picks across our 5 official stores.",
    bookSlugs: ['dixons-journal-book-one-a-house-beneath-the-ash', 'the-real-americana'],
    themeFilter: ['diy', 'cars', 'outdoor'],
    regex: /\b(tool|tools|wrench|handyman|mechanic|carpenter|built different|survival|garage|anvil|blacksmith|level|measure|fix|workshop|mountain|camp)\b/i
  },
  {
    slug: 'dark-fantasy-vampire-book-lover-gifts',
    title: 'Dark Fantasy & Vampire Book Lover Gifts — Immortals, Covens & Gothic Apparel',
    shortTitle: 'Dark Fantasy & Vampire Book Lover Gifts',
    eyebrow: 'SUPERNATURAL THRILLERS · THE DRAEVAN SAGA & GOTHIC MERCH',
    description: "Shop dark fantasy and vampire book lover gifts featuring 'Draevan: Book Two: The Unclaimed', 'Draevan: The Immortal', and 16 gothic vampire graphic hoodies, tees, and art prints.",
    lead: "Enter a world of 4,000-year-old vampire bloodlines, contested immortal thrones, and neon-drenched nocturnal intrigue. Bundle the complete Draevan Saga (Novels & Full-Color Graphic Novel) on Amazon with 16 curated gothic and vampire merch pieces.",
    bookSlugs: ['draevan-book-two-the-unclaimed', 'draevan-book-one-the-immortal', 'draevan-the-immortal-graphic-novel-book-1', 'the-moonlight-outcasts'],
    themeFilter: ['gothic', 'fantasy', 'tarot'],
    regex: /\b(vampire|goth|gothic|blood|bat|coven|immortal|rose|skull|raven|night|darkness|belladonna|occult|coffin)\b/i
  },
  {
    slug: 'cyberpunk-ai-sci-fi-gamer-merch',
    title: 'Cyberpunk, AI Consciousness & Sci-Fi Gamer Merch + Books',
    shortTitle: 'Cyberpunk, AI & Sci-Fi Gamer Merch',
    eyebrow: 'SENTIENT AI THRILLERS · NEON CYBERNETIC APPAREL & TECH GEAR',
    description: "Discover cyberpunk and sci-fi gamer gifts pairing 'TIFF: Book Two: We Are', 'TIFF: Book One: I AM.', and 'Life In The Year 2035' with neon mecha hoodies, desk mats, and tees.",
    lead: "For sci-fi readers, developers, and gamers fascinated by artificial consciousness, synthetic uprisings, and near-future tech. Pair the bestselling TIFF Cybernetic Saga and 'Life In The Year 2035' on Amazon with 16 cyberpunk graphic tees, hoodies, phone cases, and desk mats.",
    bookSlugs: ['tiff-book-two-we-are', 'tiff-book-one-i-am', 'life-in-the-year-2035', 'a-beautiful-alibi'],
    themeFilter: ['cyber', 'gamers'],
    regex: /\b(cyber|cyberpunk|cybernetic|mecha|mech|robot|ai|neon|matrix|glitch|future|synthwave|gamer|arcade|bot|motherboard)\b/i
  },
  {
    slug: 'tabletop-rpg-dungeon-master-gifts',
    title: 'Tabletop RPG, Dungeon Master & Grimdark Fantasy Gifts',
    shortTitle: 'Tabletop RPG & Dungeon Master Gifts',
    eyebrow: 'EPIC SWORD & SORCERY · D20 CAMPAIGN & FANTASY APPAREL',
    description: "Curated tabletop RPG and epic fantasy gifts featuring 'The Shattered Crown', 'The Dark Versus Light Legions Graphic Novel', and 16 dragon, knight, and D20 graphic shirts & hoodies.",
    lead: "Whether you're rolling critical hits behind the DM screen or diving into grimdark sword-and-sorcery where real steel meets the Immortal Lich King, this guide pairs 'The Shattered Crown' and 'The Dark Versus Light Legions' with 16 epic fantasy merch essentials.",
    bookSlugs: ['the-shattered-crown', 'the-dark-versus-light-legions-graphic-novel', 'the-moonlight-outcasts'],
    themeFilter: ['fantasy', 'gamers', 'gothic'],
    regex: /\b(rpg|d20|dice|quest|dragon|knight|wraith|sword|crown|shield|dungeon|mana|grimoire|armor|lich|gargoyle)\b/i
  },
  {
    slug: 'mechanic-project-car-garage-gifts',
    title: 'Mechanic, Project Car & Garage Crew Gifts — Apparel, Mugs & Books',
    shortTitle: 'Mechanic & Project Car Garage Gifts',
    eyebrow: 'GARAGE LIFE · BLUE-COLLAR GRIT & OPEN-ROAD CULTURE',
    description: "Shop mechanic and car enthusiast gifts pairing 'The Real Americana' and 'Dixon's Journal: Book One' with muscle car, JDM, cafe racer, and wrenching hoodies, tees, and mugs.",
    lead: "Built for the late-night wrench turners, project car builders, and backroad cruisers. Pair Jason Coleman's gritty heartland novel 'The Real Americana' and 'Dixon's Journal' with 16 automotive and garage graphic pieces.",
    bookSlugs: ['the-real-americana', 'dixons-journal-book-one-a-house-beneath-the-ash'],
    themeFilter: ['cars', 'diy'],
    regex: /\b(car|cars|garage|mechanic|wrench|racing|muscle car|jdm|skyline|impala|lowrider|motorcycle|cafe racer|drift|turbo|engine)\b/i
  },
  {
    slug: 'carpenter-woodworking-humor-gifts',
    title: 'Carpenter, Woodworking & DIY Maker Humor Gifts + Survival Reads',
    shortTitle: 'Carpenter & Woodworking Maker Gifts',
    eyebrow: 'MAKERS & CRAFTSMEN · MEASURE TWICE, READ ONCE',
    description: "Find the best carpenter, woodworking, and DIY maker gifts pairing 'Dixon's Journal: Book One — A House Beneath The Ash' with funny tool tees, workshop mugs, and hoodies.",
    lead: "Celebrate the builders, woodworkers, and tradespeople who keep everything standing. Pair our realistic handyman survival novel 'Dixon's Journal: Book One — A House Beneath The Ash' with 16 workshop-ready graphic shirts, hoodies, and mugs.",
    bookSlugs: ['dixons-journal-book-one-a-house-beneath-the-ash', 'the-real-americana'],
    themeFilter: ['diy', 'humor'],
    regex: /\b(carpenter|wood|tool|power tools|level|measure|built different|wrench|blacksmith|anvil|dad|father|maker|craft)\b/i
  },
  {
    slug: 'gothic-streetwear-cathedral-raven-gifts',
    title: 'Gothic Streetwear, Cathedral & Raven Aesthetic Gifts + Dark Fiction',
    shortTitle: 'Gothic Streetwear & Raven Aesthetic Gifts',
    eyebrow: 'DARK AESTHETIC · MEMENTO MORI, RAVENS & SUPERNATURAL LORE',
    description: "Explore gothic streetwear, raven, skull, and tarot gifts paired with 'Draevan: Book Two: The Unclaimed', 'The Moonlight Outcasts', and 'The Shattered Crown'.",
    lead: "Heavyweight gothic hoodies, cathedral roses, occult tarot archetypes, and armored wolves—paired directly with our darkest supernatural fantasy novels on Amazon Kindle Unlimited, Paperback, and Hardcover.",
    bookSlugs: ['draevan-book-two-the-unclaimed', 'the-moonlight-outcasts', 'the-shattered-crown', 'draevan-the-immortal-graphic-novel-book-1'],
    themeFilter: ['gothic', 'tarot', 'fantasy'],
    regex: /\b(gothic|goth|raven|crow|cathedral|skull|skeleton|reaper|memento mori|tarot|moon|lunar|wolf|wolves|witch)\b/i
  },
  {
    slug: 'cat-lover-graphic-tees-and-mugs',
    title: 'Cat Lover Graphic Tees, Coffee Mugs & Cozy Reader Gifts',
    shortTitle: 'Cat Lover Graphic Tees, Mugs & Books',
    eyebrow: 'FELINE OBSESSION · COZY READING NIGHTS & CAT APPAREL',
    description: "Purr-fect gifts for cat lovers and bookworms: pair 16 original cat graphic hoodies, tees, and ceramic coffee mugs with Jason Coleman's Amazon books.",
    lead: "Because every great reading session requires a warm mug, a cozy hoodie, and a cat supervising from the armrest. Browse 16 of our bestselling cat graphic designs paired with favorite family and fantasy reads.",
    bookSlugs: ['the-moonlight-outcasts', 'jay-and-jaes-adventures-in-colorland', 'the-world-we-leave-each-other'],
    themeFilter: ['cats'],
    regex: /\b(cat|cats|kitten|feline|maneki|neko|meow|purr)\b/i
  },
  {
    slug: 'dog-dad-and-pet-lover-gifts',
    title: 'Dog Dad & Pet Lover Graphic Apparel, Bandanas & Heartland Books',
    shortTitle: 'Dog Dad & Pet Lover Gifts',
    eyebrow: 'FOUR-LEGGED BEST FRIENDS · DOG APPAREL, BANDANAS & READS',
    description: "Shop dog dad and dog mom gifts featuring 16 canine graphic hoodies, tees, and pet bandanas paired with 'The Real Americana' and 'Dixon's Journal: Book One'.",
    lead: "From loyal German Shepherds and Pitbulls to hilarious Corgi and Pug graphics, celebrate your four-legged best friend with 16 verified merch picks and heartfelt stories.",
    bookSlugs: ['the-real-americana', 'dixons-journal-book-one-a-house-beneath-the-ash', 'jay-and-jaes-adventures-in-colorland'],
    themeFilter: ['dogs'],
    regex: /\b(dog|dogs|puppy|canine|pitbull|retriever|shepherd|doberman|paws|hound|corgi|pug)\b/i
  },
  {
    slug: 'coffee-addict-barista-sarcastic-gifts',
    title: 'Coffee Addict, Barista & Sarcastic Humor Mugs, Tees & Books',
    shortTitle: 'Coffee Addict & Sarcastic Humor Gifts',
    eyebrow: 'CAFFEINE & DEADPAN WIT · NOVELTY MUGS, TEES & SHARP READS',
    description: "Fuel your morning with 16 funny sarcastic graphic tees and ceramic coffee mugs paired with 'The Deception Habit' (Kindle, Paperback & Audible) and 'A Beautiful Alibi'.",
    lead: "High-octane espresso meets unfiltered wit. Pair our sharpest social commentary ('The Deception Habit') and near-future diner-to-espionage thriller ('A Beautiful Alibi') with 16 sarcastic tees, hoodies, and ceramic mugs.",
    bookSlugs: ['the-deception-habit', 'a-beautiful-alibi', 'the-world-we-leave-each-other'],
    themeFilter: ['humor'],
    regex: /\b(coffee|caffeine|espresso|mug|sarcastic|sarcasm|social battery|avoiding|funny|problems|my bad|opossum|raccoon|dumpster)\b/i
  },
  {
    slug: 'kids-and-family-adventure-coloring-gifts',
    title: 'Kids & Family Adventure Coloring Books, Youth Tees & Gifts',
    shortTitle: 'Kids & Family Adventure Coloring Gifts',
    eyebrow: 'FAMILY STORYTIME · INTERACTIVE COLORING BOOK & YOUTH APPAREL',
    description: "Pair 'Jay And Jae's Adventures In Colorland' on Amazon with 16 colorful youth graphic tees, toddler hoodies, and family adventure gifts.",
    lead: "Spark creativity at storytime with 'Jay And Jae's Adventures In Colorland'—our interactive children's coloring and story adventure book on Amazon—matched with 16 durable youth tees, hoodies, and family gifts.",
    bookSlugs: ['jay-and-jaes-adventures-in-colorland', 'the-world-we-leave-each-other'],
    themeFilter: ['kids', 'relationships'],
    regex: /\b(kid|kids|youth|toddler|baby|family|adventure|cute|animal|dino|space)\b/i
  },
  {
    slug: 'military-history-and-strategy-gifts',
    title: 'Military History, Geopolitics & Strategy Books + Warrior Apparel',
    shortTitle: 'Military History & Strategy Gifts',
    eyebrow: 'HISTORY, CONFLICT & ACCOUNTABILITY · NONFICTION & WARRIOR GEAR',
    description: "Pair 'Humans: The Endless Warmonger' and 'Old Men Start Wars That Young Men Die In' on Amazon with 16 Spartan, warrior, strategy, and history graphic tees and hoodies.",
    lead: "Explore the deep history of human conflict, geopolitical cycles, and ethical peacebuilding in 'Humans: The Endless Warmonger' and 'Old Men Start Wars That Young Men Die In', paired with 16 bold historical and warrior graphic pieces.",
    bookSlugs: ['humans-the-endless-warmonger', 'old-men-start-wars-that-young-men-die-in', 'the-deception-habit'],
    themeFilter: ['sports', 'inspirational', 'diy'],
    regex: /\b(spartan|warrior|samurai|knight|history|strength|unstoppable|courage|shield|iron|discipline|veteran|americana)\b/i
  },
  {
    slug: 'retro-80s-synthwave-arcade-gifts',
    title: 'Retro 80s Synthwave, Neon Arcade & Futurist Sci-Fi Gifts',
    shortTitle: 'Retro 80s Synthwave & Arcade Gifts',
    eyebrow: 'NEON HORIZONS · SYNTHWAVE ART, ARCADE TEES & FUTURIST SCI-FI',
    description: "Shop retro 80s synthwave, vaporwave, and arcade gamer gifts paired with 'TIFF: Book Two: We Are', 'Life In The Year 2035', and 'TIFF: Book One: I AM.'.",
    lead: "Electric sunsets, pixel arcades, Tokyo night runs, and sentient cybernetics. Pair our futuristic sci-fi books on Amazon with 16 synthwave and retro arcade hoodies, tees, posters, and desk mats.",
    bookSlugs: ['tiff-book-two-we-are', 'life-in-the-year-2035', 'tiff-book-one-i-am'],
    themeFilter: ['cyber', 'gamers', 'streetwear'],
    regex: /\b(synthwave|vaporwave|retro|arcade|insert coin|pixel|joystick|neon|tokyo|night run|drift|cyberwave|80s)\b/i
  },
  {
    slug: 'espionage-thriller-mystery-reader-gifts',
    title: 'Espionage Thriller, Spy Fiction & Mystery Reader Gifts',
    shortTitle: 'Espionage Thriller & Mystery Reader Gifts',
    eyebrow: 'BORROWED NAMES & SHADOW NETWORKS · THRILLER BOOKS & NOIR MERCH',
    description: "Celebrate today's release of 'A Beautiful Alibi (The Borrowed Names, Book One)' on Amazon alongside 'The Deception Habit' and 16 noir, mystery, and night-owl merch gifts.",
    lead: "Featuring today's brand-new near-future espionage release 'A Beautiful Alibi (The Borrowed Names, Book One)'—set across Florida and wintry Saint Petersburg—paired with 16 moody noir, urban streetwear, and mystery reader gifts.",
    bookSlugs: ['a-beautiful-alibi', 'the-deception-habit', 'draevan-book-one-the-immortal'],
    themeFilter: ['streetwear', 'cyber', 'gothic'],
    regex: /\b(night|shadow|city|tokyo|noir|mystery|cipher|secret|urban|street|ghost|raven|eclipse|midnight)\b/i
  },
  {
    slug: 'outdoor-wilderness-overland-explorer-gifts',
    title: 'Outdoor Wilderness, Overland 4x4 & Backcountry Survival Gifts',
    shortTitle: 'Outdoor Wilderness & Overland Explorer Gifts',
    eyebrow: 'OFF-GRID & BACKCOUNTRY · SURVIVAL NOVELS, CAMPER MUGS & APPAREL',
    description: "Gear up for the backcountry with 'Dixon's Journal: Book One — A House Beneath The Ash', 'The Real Americana', and 16 overland, wilderness, and nature graphic gifts.",
    lead: "For off-grid explorers, overland 4x4 drivers, and mountain homesteaders. Pair 'Dixon's Journal: Book One — A House Beneath The Ash', 'The Real Americana', and 'How Matter Became Conscious' with 16 rugged outdoor apparel and drinkware picks.",
    bookSlugs: ['dixons-journal-book-one-a-house-beneath-the-ash', 'the-real-americana', 'how-matter-became-conscious'],
    themeFilter: ['cars', 'diy', 'inspirational'],
    regex: /\b(overland|4x4|mountain|forest|wilderness|nature|camp|adventure|backroad|wolf|bear|pine|trail|cosmic|star)\b/i
  }
];

function selectMultiStoreItems(candidates, fallbackPool, count = 16) {
  const stores = ['spreadshop', 'printify', 'zazzle', 'redbubble', 'teepublic'];
  const byStore = new Map(stores.map(s => [s, []]));
  const seenDesigns = new Set();
  const seenIds = new Set();

  for (const p of candidates) {
    const st = p.store || 'spreadshop';
    if (!byStore.has(st)) byStore.set(st, []);
    byStore.get(st).push(p);
  }

  const picked = [];
  // Round-robin across the 5 stores first to guarantee 5-store diversity
  let addedInRound = true;
  while (picked.length < count && addedInRound) {
    addedInRound = false;
    for (const st of stores) {
      const list = byStore.get(st) || [];
      while (list.length > 0) {
        const item = list.shift();
        if (!seenIds.has(item.id) && !seenDesigns.has(item.design)) {
          seenIds.add(item.id);
          seenDesigns.add(item.design);
          picked.push(item);
          addedInRound = true;
          break;
        }
      }
      if (picked.length >= count) break;
    }
  }

  // Fill any remaining slots from candidates or fallbackPool
  for (const item of [...candidates, ...fallbackPool]) {
    if (picked.length >= count) break;
    if (!seenIds.has(item.id) && !seenDesigns.has(item.design)) {
      seenIds.add(item.id);
      seenDesigns.add(item.design);
      picked.push(item);
    }
  }
  return picked.slice(0, count);
}

export function selectMerchForBook(book, products, isCleanProfessional, count = 12) {
  const themes = (book.themes || []).map(t => t.toLowerCase());
  const kwRegex = new RegExp(
    themes.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || 'urban',
    'i'
  );
  const cleanPool = products.filter(isCleanProfessional);
  const matched = cleanPool.filter(p => {
    if (book.slug === 'jay-and-jaes-adventures-in-colorland' && p.kids) return true;
    const hay = `${p.design} ${p.name} ${(p.themes || []).join(' ')} ${p.category}`;
    return kwRegex.test(hay);
  });
  return selectMultiStoreItems(matched, cleanPool, count);
}

export function selectMerchForGuide(guide, products, isCleanProfessional, count = 16) {
  const cleanPool = products.filter(isCleanProfessional);
  const matched = cleanPool.filter(p => {
    const themeHit = (guide.themeFilter || []).some(t => (p.themes || []).includes(t) || (t === 'kids' && p.kids));
    const regexHit = guide.regex ? guide.regex.test(`${p.design} ${p.name}`) : false;
    return regexHit || themeHit;
  });
  // Prioritize regex matches first
  matched.sort((a, b) => {
    const aR = guide.regex && guide.regex.test(`${a.design} ${a.name}`) ? 1 : 0;
    const bR = guide.regex && guide.regex.test(`${b.design} ${b.name}`) ? 1 : 0;
    return bR - aR;
  });
  return selectMultiStoreItems(matched, cleanPool, count);
}

export function guidesPreviewSectionHtml(booksData, limit = 6) {
  const booksBySlug = new Map((booksData?.books || []).map(b => [b.slug, b]));
  const shown = NICHE_GUIDES.slice(0, limit);
  return `<section class="section" id="gift-guides-preview">
    <div class="section-head">
      <div>
        <div class="sub">CURATED BOOK + MERCH BUNDLES · 15 NICHE BUYER'S GUIDES</div>
        <h2>Shop Curated Buyer's Gift Guides</h2>
        <p>Every guide pairs Jason Coleman's published Amazon KDP books with 16 hand-picked graphic tees, hoodies, mugs, and gear across our 5 verified partner stores.</p>
      </div>
      <a class="btn-see-all-action" href="/guides/">Explore All 15 Gift Guides ↗</a>
    </div>
    <div class="guides-grid">
      ${shown.map(g => {
        const b = booksBySlug.get(g.bookSlugs[0]) || booksData.books[0];
        return `<article class="guide-card">
          <div>
            <div class="guide-card-eyebrow">${esc(g.eyebrow)}</div>
            <h3><a href="/guides/${esc(g.slug)}/">${esc(g.shortTitle)}</a></h3>
            <p>${esc(g.description)}</p>
          </div>
          <div>
            ${b ? `<div class="guide-card-books-preview">
              <img src="${esc(b.cover)}" alt="${esc(b.title)}" width="38" height="56" loading="lazy">
              <span>Paired with <strong>${esc(b.title)}</strong> + 16 Official Merch Picks</span>
            </div>` : ''}
            <a class="btn-card-buy" href="/guides/${esc(g.slug)}/" style="width:100%;justify-content:center;padding:9px 14px;font-size:11px">Open Gift Guide (Books + 16 Merch Picks) →</a>
          </div>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

export function buildBookOffersSchema(book) {
  const offers = [];
  if (book.kindleAsin) {
    offers.push({
      '@type': 'Offer',
      name: 'Kindle eBook Edition',
      asin: book.kindleAsin,
      sku: book.kindleAsin,
      price: String(book.price || '4.99'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://www.amazon.com/dp/${book.kindleAsin}`
    });
  }
  if (book.paperbackAsin) {
    offers.push({
      '@type': 'Offer',
      name: 'Paperback Edition',
      asin: book.paperbackAsin,
      sku: book.paperbackAsin,
      price: String(book.paperbackPrice || book.price || '9.99'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://www.amazon.com/dp/${book.paperbackAsin}`
    });
  }
  if (book.hardcoverAsin) {
    offers.push({
      '@type': 'Offer',
      name: 'Hardcover Edition',
      asin: book.hardcoverAsin,
      sku: book.hardcoverAsin,
      price: String(book.hardcoverPrice || '14.99'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://www.amazon.com/dp/${book.hardcoverAsin}`
    });
  }
  if (book.audiobookAsin) {
    offers.push({
      '@type': 'Offer',
      name: 'Audible Audiobook Edition',
      asin: book.audiobookAsin,
      sku: book.audiobookAsin,
      price: String(book.price || '4.99'),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://www.amazon.com/dp/${book.audiobookAsin}`
    });
  }
  return offers;
}

export function buildBooksHubPage(booksData) {
  const books = booksData.books || [];
  const body = `<div class="wrap" style="padding-top:18px;padding-bottom:48px">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="crumb-sep">/</span>
      <span class="current-crumb">Published Books on Amazon (${books.length} Live Titles)</span>
    </nav>

    ${booksShowcaseSection(booksData, { includePipeline: true })}

    ${guidesPreviewSectionHtml(booksData, 15)}
  </div>`;

  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Official Published Books by Jason Coleman on Amazon (${books.length} Live Titles)`,
        description: `Browse all ${books.length} published Amazon KDP books by Jason Coleman—including Dixon's Journal: Book One — A House Beneath The Ash and A Beautiful Alibi—plus 2 new books released weekly.`,
        url: `${ORIGIN}/books/`,
        author: {
          '@type': 'Person',
          name: 'Jason Coleman',
          alternateName: 'Jason Ray Coleman',
          sameAs: [AMAZON_AUTHOR_URL]
        }
      },
      {
        '@type': 'ItemList',
        name: 'Published Books on Amazon by Jason Coleman',
        numberOfItems: books.length,
        itemListElement: books.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${ORIGIN}/books/${b.slug}/`,
          item: {
            '@type': 'Book',
            name: b.title,
            alternateName: b.subtitle,
            author: { '@type': 'Person', name: 'Jason Coleman' },
            image: b.cover,
            description: b.description,
            genre: b.genre,
            url: `https://www.amazon.com/dp/${b.primaryAsin}`,
            sameAs: `https://www.amazon.com/dp/${b.primaryAsin}`,
            offers: buildBookOffersSchema(b)
          }
        }))
      }
    ]
  };

  return {
    title: `Official Published Books on Amazon by Jason Coleman (${books.length} Live Titles • 2 New Books Weekly)`,
    description: `Shop all ${books.length} published books by Jason Coleman on Amazon Kindle, Kindle Unlimited, Paperback, Hardcover & Audible—plus matching official graphic apparel & gear.`,
    path: '/books/',
    body,
    structured,
    ogImage: books[0]?.cover || ''
  };
}

export function buildSingleBookPage(book, booksData, products, isCleanProfessional) {
  const matchedMerch = selectMerchForBook(book, products, isCleanProfessional, 12);
  const otherBooks = (booksData.books || []).filter(b => b.slug !== book.slug).slice(0, 6);
  const matchingGuides = NICHE_GUIDES.filter(g => g.bookSlugs.includes(book.slug)).slice(0, 3);
  const offers = buildBookOffersSchema(book);

  const formatListHtml = [
    book.kindleAsin ? `<li><strong>Kindle eBook${book.kindleUnlimited ? ' &amp; Kindle Unlimited' : ''}:</strong> ASIN <code>${esc(book.kindleAsin)}</code> — <a href="https://www.amazon.com/dp/${esc(book.kindleAsin)}" target="_blank" rel="noopener" style="color:var(--acid);text-decoration:underline">Buy on Amazon ($${esc(book.price)}) ↗</a></li>` : '',
    book.paperbackAsin ? `<li><strong>Paperback Edition:</strong> ASIN <code>${esc(book.paperbackAsin)}</code> — <a href="https://www.amazon.com/dp/${esc(book.paperbackAsin)}" target="_blank" rel="noopener" style="color:var(--acid);text-decoration:underline">Buy Paperback on Amazon${book.paperbackPrice ? ' ($' + esc(book.paperbackPrice) + ')' : ''} ↗</a></li>` : '',
    book.hardcoverAsin ? `<li><strong>Hardcover Collector Edition:</strong> ASIN <code>${esc(book.hardcoverAsin)}</code> — <a href="https://www.amazon.com/dp/${esc(book.hardcoverAsin)}" target="_blank" rel="noopener" style="color:var(--acid);text-decoration:underline">Buy Hardcover on Amazon${book.hardcoverPrice ? ' ($' + esc(book.hardcoverPrice) + ')' : ''} ↗</a></li>` : '',
    book.audiobookAsin ? `<li><strong>Audible Audiobook Edition:</strong> ASIN <code>${esc(book.audiobookAsin)}</code> — <a href="https://www.amazon.com/dp/${esc(book.audiobookAsin)}" target="_blank" rel="noopener" style="color:var(--acid);text-decoration:underline">Listen on Amazon Audible ↗</a></li>` : ''
  ].filter(Boolean).join('');

  const body = `<div class="wrap" style="padding-top:16px;padding-bottom:48px">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="crumb-sep">/</span>
      <a href="/books/">Published Books on Amazon</a>
      <span class="crumb-sep">/</span>
      <span class="current-crumb">${esc(book.title)}</span>
    </nav>

    <section class="book-pdp-hero">
      <div class="book-pdp-cover-wrap">
        <a href="https://www.amazon.com/dp/${esc(book.primaryAsin)}" target="_blank" rel="noopener">
          <img src="${esc(book.cover)}" alt="${esc(book.title)} by Jason Coleman — Official Amazon Cover" width="400" height="600" loading="eager" decoding="async">
        </a>
      </div>
      <div class="book-pdp-info">
        <div class="book-badge-row">
          <span class="book-release-badge">${esc(book.badge || 'Live on Amazon')}</span>
          <span class="book-genre-badge">${esc(book.series || book.genre)}</span>
          ${book.kindleUnlimited ? `<span class="book-ku-badge">✓ Read Free with Kindle Unlimited</span>` : ''}
        </div>
        <h1>${esc(book.title)}</h1>
        <div class="book-pdp-subtitle">${esc(book.subtitle)}</div>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 14px">By <strong>Jason Coleman</strong> · Genre: ${esc(book.genre)} · Primary Amazon ASIN: <code>${esc(book.primaryAsin)}</code></p>
        <p class="book-pdp-synopsis">${esc(book.description)}</p>

        <div class="book-pdp-formats-box">
          <h3>🛒 Direct Amazon Checkout — Choose Your Edition</h3>
          ${bookFormatButtonsHtml(book, true)}
          <ul style="margin:14px 0 0;padding-left:18px;font-size:12px;line-height:1.8;color:#cbd5e1">
            ${formatListHtml}
          </ul>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <a class="btn-amazon-author" href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener">Follow Jason Coleman on Amazon Author Central ↗</a>
          ${book.trailerUrl ? `<a class="btn-book-amz secondary" href="${esc(book.trailerUrl)}" target="_blank" rel="noopener">🎬 Watch Official Book Trailer ↗</a>` : ''}
          <a class="btn-book-amz secondary" href="/books/">← Back to All 18 Books</a>
        </div>
      </div>
    </section>

    <section class="section" id="matching-book-merch" style="padding-top:12px">
      <div class="section-head">
        <div>
          <div class="sub">OFFICIAL COMPANION MERCHANDISE · 12 CURATED PICKS</div>
          <h2>Pair “${esc(book.title)}” With Matching Official Merch</h2>
          <p>Custom made-to-order graphic hoodies, tees, mugs, and gear matching the themes of <strong>${esc(book.title)}</strong> (${esc((book.themes || []).join(', '))}). Click any item for direct partner store checkout.</p>
        </div>
        <a class="btn-see-all-action" href="/#catalog">Browse All 18,622+ Merch Items ↗</a>
      </div>
      <div class="grid">
        ${matchedMerch.map(card).join('')}
      </div>
    </section>

    ${matchingGuides.length ? `
    <section class="section">
      <div class="section-head">
        <div>
          <div class="sub">CURATED GIFT GUIDES FEATURING THIS BOOK</div>
          <h2>Explore Related Buyer's Gift Guides</h2>
        </div>
        <a class="text-link" href="/guides/">All 15 Gift Guides ↗</a>
      </div>
      <div class="guides-grid">
        ${matchingGuides.map(g => `<article class="guide-card">
          <div>
            <div class="guide-card-eyebrow">${esc(g.eyebrow)}</div>
            <h3><a href="/guides/${esc(g.slug)}/">${esc(g.shortTitle)}</a></h3>
            <p>${esc(g.description)}</p>
          </div>
          <a class="btn-card-buy" href="/guides/${esc(g.slug)}/" style="width:100%;justify-content:center;padding:9px 14px;font-size:11px">Open Gift Guide →</a>
        </article>`).join('')}
      </div>
    </section>` : ''}

    <section class="books-showcase-section" style="margin-top:36px">
      <div class="books-showcase-header">
        <div>
          <span class="books-eyebrow">MORE BY JASON COLEMAN ON AMAZON</span>
          <h2>Explore More Published Books in the Catalog</h2>
        </div>
        <a class="btn-books-hub" href="/books/">See All 18 Live Books →</a>
      </div>
      <div class="books-grid">
        ${otherBooks.map(bookCardHtml).join('')}
      </div>
    </section>
  </div>`;

  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Book', 'Product'],
        '@id': `${ORIGIN}/books/${book.slug}/#book`,
        name: book.title,
        headline: `${book.title} — ${book.subtitle}`,
        alternativeHeadline: book.subtitle,
        sku: book.primaryAsin,
        productID: `ASIN:${book.primaryAsin}`,
        image: [book.cover],
        description: book.description,
        genre: book.genre,
        keywords: (book.keywords || book.themes || []).join(', '),
        url: `${ORIGIN}/books/${book.slug}/`,
        sameAs: [
          `https://www.amazon.com/dp/${book.primaryAsin}`,
          book.kindleAsin ? `https://www.amazon.com/dp/${book.kindleAsin}` : null,
          book.paperbackAsin ? `https://www.amazon.com/dp/${book.paperbackAsin}` : null,
          book.hardcoverAsin ? `https://www.amazon.com/dp/${book.hardcoverAsin}` : null,
          book.audiobookAsin ? `https://www.amazon.com/dp/${book.audiobookAsin}` : null
        ].filter(Boolean),
        author: {
          '@type': 'Person',
          name: 'Jason Coleman',
          alternateName: 'Jason Ray Coleman',
          url: AMAZON_AUTHOR_URL
        },
        brand: {
          '@type': 'Brand',
          name: 'Jason Coleman Publishing'
        },
        offers
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Published Books on Amazon', item: `${ORIGIN}/books/` },
          { '@type': 'ListItem', position: 3, name: book.title, item: `${ORIGIN}/books/${book.slug}/` }
        ]
      }
    ]
  };

  return {
    title: `${book.title} — ${book.subtitle} | Jason Coleman Amazon Book & Official Merch`,
    description: `${book.description.slice(0, 155)}... Shop ${book.title} on Amazon (ASIN ${book.primaryAsin}) and explore 12 matching graphic apparel & gifts.`,
    path: `/books/${book.slug}/`,
    body,
    structured,
    ogImage: book.cover
  };
}

export function buildGuidesHubPage(booksData) {
  const body = `<div class="wrap" style="padding-top:18px;padding-bottom:48px">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="crumb-sep">/</span>
      <span class="current-crumb">Curated Buyer's Gift Guides (15 Niche Guides)</span>
    </nav>

    <section class="collection-intro">
      <div class="eyebrow">OFFICIAL BOOKS + 5-STORE MERCH BUNDLES</div>
      <h1 style="font:900 clamp(38px,5.5vw,68px)/.95 var(--display);text-transform:uppercase;margin:8px 0 12px">15 Niche Buyer's Gift Guides — Amazon Books &amp; Graphic Gear</h1>
      <p style="max-width:820px;font-size:15px;color:var(--muted);line-height:1.6">Each buyer's guide pairs Jason Coleman's published Amazon KDP books with 16 curated graphic tees, heavyweight hoodies, ceramic mugs, posters, and accessories across Spreadshop, Printify, Zazzle, Redbubble, and TeePublic.</p>
    </section>

    ${guidesPreviewSectionHtml(booksData, 15)}

    ${booksShowcaseSection(booksData, { includePipeline: false })}
  </div>`;

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "15 Niche Buyer's Gift Guides — Amazon KDP Books & Official Graphic Merch",
    description: "Explore 15 curated buyer's gift guides pairing Jason Coleman's 18 published Amazon books with 16 official graphic apparel & gift items per guide.",
    url: `${ORIGIN}/guides/`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: NICHE_GUIDES.length,
      itemListElement: NICHE_GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        url: `${ORIGIN}/guides/${g.slug}/`
      }))
    }
  };

  return {
    title: "15 Curated Buyer's Gift Guides — Amazon Books & Official Graphic Merch",
    description: "Browse 15 niche gift guides pairing Jason Coleman's 18 Amazon KDP books with custom graphic hoodies, tees, mugs, and gear across 5 official stores.",
    path: '/guides/',
    body,
    structured
  };
}

export function buildSingleGuidePage(guide, booksData, products, isCleanProfessional) {
  const booksBySlug = new Map((booksData.books || []).map(b => [b.slug, b]));
  const pairedBooks = guide.bookSlugs.map(s => booksBySlug.get(s)).filter(Boolean);
  const curatedMerch = selectMerchForGuide(guide, products, isCleanProfessional, 16);
  const otherGuides = NICHE_GUIDES.filter(g => g.slug !== guide.slug).slice(0, 6);

  const body = `<div class="wrap" style="padding-top:18px;padding-bottom:48px">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="crumb-sep">/</span>
      <a href="/guides/">Buyer's Gift Guides</a>
      <span class="crumb-sep">/</span>
      <span class="current-crumb">${esc(guide.shortTitle)}</span>
    </nav>

    <section class="collection-intro">
      <div class="eyebrow">${esc(guide.eyebrow)}</div>
      <h1 style="font:900 clamp(34px,5vw,60px)/.98 var(--display);text-transform:uppercase;margin:8px 0 12px">${esc(guide.title)}</h1>
      <p style="max-width:860px;font-size:15px;color:var(--muted);line-height:1.65">${esc(guide.lead)}</p>
    </section>

    <section class="pdp-book-cross-sell" style="margin-top:10px">
      <div class="pdp-book-cross-head">
        <div>
          <span class="books-eyebrow">📚 PART 1 · FEATURED AMAZON KDP BOOKS IN THIS GUIDE</span>
          <h3>Start With the Matching Books by Jason Coleman on Amazon</h3>
        </div>
        <a class="btn-amazon-author" href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener">Amazon Author Page ↗</a>
      </div>
      <div class="pdp-book-cross-grid">
        ${pairedBooks.map(book => `
          <article class="pdp-book-cross-item">
            <a class="pdp-book-cross-cover" href="https://www.amazon.com/dp/${esc(book.primaryAsin)}" target="_blank" rel="noopener">
              <img src="${esc(book.cover)}" alt="${esc(book.title)} Cover" width="140" height="210" loading="eager" decoding="async">
            </a>
            <div class="pdp-book-cross-info">
              <span class="book-card-badge">${esc(book.badge || book.genre)}</span>
              <h4><a href="/books/${esc(book.slug)}/">${esc(book.title)}</a></h4>
              <div class="pdp-book-cross-sub">${esc(book.subtitle)}</div>
              <p class="pdp-book-cross-desc">${esc(book.description)}</p>
              ${bookFormatButtonsHtml(book, false)}
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="section" style="padding-top:24px">
      <div class="section-head">
        <div>
          <div class="sub">👕 PART 2 · 16 CURATED MERCH ITEMS ACROSS 5 OFFICIAL STORES</div>
          <h2>16 Matching Graphic Apparel, Mugs &amp; Gift Picks</h2>
          <p>Every item below is custom made to order and links directly to our verified partner storefronts (Spreadshop, Printify, Zazzle, Redbubble &amp; TeePublic).</p>
        </div>
        <a class="btn-see-all-action" href="/#catalog">Explore Full 18,622+ Catalog ↗</a>
      </div>
      <div class="grid">
        ${curatedMerch.map(card).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <div class="sub">MORE CURATED BUYER'S GUIDES</div>
          <h2>Explore More Niche Book + Merch Gift Guides</h2>
        </div>
        <a class="text-link" href="/guides/">View All 15 Gift Guides ↗</a>
      </div>
      <div class="guides-grid">
        ${otherGuides.map(g => `<article class="guide-card">
          <div>
            <div class="guide-card-eyebrow">${esc(g.eyebrow)}</div>
            <h3><a href="/guides/${esc(g.slug)}/">${esc(g.shortTitle)}</a></h3>
            <p>${esc(g.description)}</p>
          </div>
          <a class="btn-card-buy" href="/guides/${esc(g.slug)}/" style="width:100%;justify-content:center;padding:9px 14px;font-size:11px">Open Gift Guide →</a>
        </article>`).join('')}
      </div>
    </section>
  </div>`;

  const listItems = [
    ...pairedBooks.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Book',
        name: b.title,
        url: `https://www.amazon.com/dp/${b.primaryAsin}`,
        image: b.cover,
        author: { '@type': 'Person', name: 'Jason Coleman' }
      }
    })),
    ...curatedMerch.map((p, i) => ({
      '@type': 'ListItem',
      position: pairedBooks.length + i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        url: `${ORIGIN}${p.path}`,
        image: p.image,
        offers: {
          '@type': 'Offer',
          price: p.price.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: p.url
        }
      }
    }))
  ];

  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: guide.title,
        description: guide.description,
        url: `${ORIGIN}/guides/${guide.slug}/`,
        isPartOf: { '@type': 'WebSite', name: 'Urban Clothes Market', url: ORIGIN }
      },
      {
        '@type': 'ItemList',
        name: guide.title,
        numberOfItems: listItems.length,
        itemListElement: listItems
      }
    ]
  };

  return {
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}/`,
    body,
    structured,
    ogImage: pairedBooks[0]?.cover || curatedMerch[0]?.image || ''
  };
}
