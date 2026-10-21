export const TYPES = [
  ['hoodies', 'Hoodies & Sweatshirts', /hoodie|hooded|sweatshirt/i],
  ['jackets', 'Jackets & Outerwear', /jacket|windbreaker|command.*zip|medalist.*pullover/i],
  ['tees', 'Tees & Tanks', /shirt|tank|tee|jersey|polo|henley/i],
  ['hats', 'Hats & Beanies', /cap|hat|beanie/i],
  ['mugs', 'Mugs & Drinkware', /mug|bottle|tumbler|cup/i],
  ['art', 'Wall Art & Canvas', /art print|canvas|poster|tapestry|wall print/i],
  ['tech', 'Phone Cases & Tech', /phone|iphone|samsung|case|laptop|sleeve|desk mat|mouse pad/i],
  ['home', 'Home & Living', /pillow|blanket|shower curtain|wall clock|clock|apron|towel/i],
  ['stickers', 'Stickers, Pins & Magnets', /sticker|magnet|pin|badge|button/i],
  ['bags', 'Bags & Backpacks', /bag|tote|pouch|backpack|fanny pack/i],
  ['stationery', 'Stationery & Journals', /notebook|journal|pad/i],
  ['kids', 'Kids & Baby', /kid|baby|babies|toddler|youth|infant/i],
  ['bottoms', 'Shorts & Joggers', /short$|jogger|socks/i],
  ['pets', 'Pet Gear', /dog|bandana|pet blanket/i],
  ['accessories', 'Accessories', /keychain|jet tag/i]
];

export const THEMES = [
  ['love', 'Love & Romance', /\b(love|loves|loving|heart|hearts|sweetheart|cupid|valentine|valentines|soulmate|soulmates|kiss|kisses|hug|hugs|romance|romantic)\b/i, 'Heartfelt romance, soulmates, and loving graphic art.'],
  ['gothic', 'Gothic & Dark Aesthetic', /\b(goth|gothic|skull|skulls|skeleton|skeletons|grim|reaper|wraith|vampire|vampires|occult|witch|witches|horror|coffin|grave|graveyard|undead|abyssal|darkness|crow|raven)\b/i, 'Dark aesthetic, gothic skulls, occult mysteries, and edgy art.'],
  ['sports', 'Sports & Fitness', /\b(sport|sports|gym|workout|fitness|running|runner|marathon|basketball|football|soccer|baseball|boxing|athletic|athlete|lifting|weights|training|coach|game day)\b/i, 'Active gym wear, sports fandom, and high-energy athletic graphics.'],
  ['relationships', 'Relationships & Family', /\b(relationship|relationships|couple|couples|husband|wife|boyfriend|girlfriend|partner|partners|soulmate|soulmates|lovers?|marriage|anniversary|family|mom|dad|mother|father|sister|brother|besties?|bff)\b/i, 'Apparel and gifts celebrating family, couples, best friends, and loved ones.'],
  ['inspirational', 'Inspirational & Mindset', /\b(inspire|inspirational|motivat|motivation|motivational|dream|dreams|believe|positive|positivity|hope|peace|faith|courage|strength|blessed|mindset|focus|hustle|unstoppable|gratitude)\b/i, 'Positive mindset, motivational quotes, and uplifting daily reminders.'],
  ['gamers', 'Gamers & Arcade', /player|controller|robot|gamer|gaming|arcade|noob|pixel art/i, 'For your next game night, boss fight, or victory lap.'],
  ['cats', 'Cat Lovers', /\bcat sits\b/i, 'For the ones who know who really runs the house.'],
  ['dogs', 'Dog Lovers', /best friend with paws/i, 'Wear a little love for your four-legged best friend.'],
  ['cars', 'Car Enthusiasts', /car|garage|modification|backroad|racing/i, 'For the garage crowd and the open-road dreamers.'],
  ['humor', 'Funny & Sarcastic', /judgemental|angry|naughty|fault|cuss|problems|other man|other woman|war crime|my bad/i, 'Good jokes. Great conversation starters.'],
  ['streetwear', 'Urban Streetwear', /night run|racing|tokyo|drift|city|street|varsity/i, 'Raw city energy, underground racing, and classic varsity graphics.'],
  ['cyber', 'Cyberpunk & Sci-Fi', /cyber|orbit|future|mech|neon|bot|void|aberration/i, 'Futuristic cityscapes, neon androids, and cybernetic street art.'],
  ['tarot', 'Tarot & Mystical', /tarot|fool|magician|priestess|empress|emperor|hierophant|lovers|chariot|death|devil|tower|star|moon|sun|hermit|fortune|justice|hanged man|temperance|judgement/i, 'Iconic tarot archetypes, mystical cards, and esoteric symbolism.'],
  ['fantasy', 'Dark Fantasy & Gothic', /knight|wraith|bone|wendigo|gargoyle|plague|aberration|seraphim|gothic|horror/i, 'High-detail dark fantasy, mythical creatures, and abyssal armor.'],
  ['diy', 'DIY & Makers', /tool|power tools|level|measure|built different/i, 'Made for people who would rather build it themselves.'],
  ['kids', 'Kids & Family', null, 'Small sizes. Big personality.'],
  ['all', 'All Designs', null, 'Find your next favorite in the full collection.']
];

export function slug(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function normalize(raw) {
  const seen = new Set();
  const priority = [
    'hoodies', 'jackets', 'hats', 'mugs', 'art', 'tech',
    'bags', 'stickers', 'stationery', 'pets', 'home', 'accessories',
    'tees', 'bottoms'
  ];

  return raw.filter(p => {
    let key = p.id;
    if (!key && p.url) {
      try {
        key = new URL(p.url).searchParams.get('sellable');
      } catch (e) {}
    }
    if (!key) key = slug(p.name || '') || 'p-' + seen.size;
    if (seen.has(key)) return false;
    seen.add(key);
    p._key = key;
    return true;
  }).map((p, i) => {
    const parts = (p.name || '').split(' - ');
    const rawType = parts.length > 1 ? parts.pop().trim() : (p.productType || 'Apparel');
    const productType = rawType
      .replace(/\s+by\s+[A-Za-z0-9\s\+\/]+/i, '')
      .replace(/^(Stanley\/Stella|Gildan|Bella\s*\+\s*Canvas|Augusta\s*Sportswear)\s+/i, '')
      .replace(/\b(CRUISER|HAMMER|DRUMMER|CRAFTER|BLASTER|NORA)\b/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Apparel';

    const design = parts.length ? parts.join(' - ').trim() : (p.design || p.name);
    const kids = /kid|baby|babies|toddler|youth|infant/i.test(productType);
    
    // Accurately determine product department category
    let category = /sweatshirt|hoodie|hooded/i.test(productType) ? 'hoodies' :
                   /tumbler/i.test(productType) ? 'mugs' :
                   (/jacket/i.test(productType) && !/hoodie|sweatshirt/i.test(productType)) ? 'jackets' :
                   kids ? 'kids' : (priority.find(id => {
                     const typeDef = TYPES.find(t => t[0] === id);
                     return typeDef && typeDef[2].test(productType);
                   }) || 'tees');

    // Accurately match themes
    const themes = THEMES.filter(([id, , r]) => {
      if (id === 'kids') return kids;
      if (id === 'all') return true;
      if (id === 'urban') return !kids && ['tees', 'hoodies', 'hats', 'jackets', 'bottoms'].includes(category);
      return r ? r.test(design) : false;
    }).map(x => x[0]);

    if (!themes.length) themes.push('urban');

    const id = p._key;
    let imgHref = p.image || p.img || '';
    try {
      if (imgHref.includes('spreadshirtmedia.com')) {
        const image = new URL(imgHref);
        image.searchParams.set('width', '600');
        image.searchParams.set('height', '600');
        imgHref = image.href;
      }
    } catch (e) {}

    const audience = kids
      ? 'Kids & Babies'
      : /\bwomen(?:['’´]s)?\b|\bwomens\b|\bladies\b/i.test(productType)
        ? 'Women'
        : /\bmen(?:['’´]s)?\b|\bmens\b/i.test(productType)
          ? 'Men'
          : 'Unisex & Everyone';

    const brand = p.brand || [
      ['Under Armour', /under armour/i],
      ['Stanley/Stella', /stanley\/stella/i],
      ['Bella + Canvas', /bella/i],
      ['Champion', /champion/i],
      ['Gildan', /gildan/i],
      ['Adidas', /adidas/i],
      ['Augusta Sportswear', /augusta/i],
      ['Bayside', /bayside/i],
      ['Flexfit', /flexfit/i]
    ].find(([, re]) => re.test(productType))?.[0] || 'Urban Clothes Market';

    const priceNum = typeof p.price === 'number'
      ? p.price
      : (Number(String(p.price || '').replace(/[^0-9.]/g, '')) || 24.99);

    const pathSlug = slug(design + ' ' + productType) + '-' + slug(id).slice(-15);
    const finalUrl = (p.url && !p.url.includes('urbanclothesmarket.com'))
      ? p.url
      : (p.path && !p.path.includes('urbanclothesmarket.com') && p.path.startsWith('http'))
        ? p.path
        : `https://urbanclothesmarket.myspreadshop.com/`;

    const cleanColors = Array.from(new Set((p.colors || ['Black', 'White', 'Heather Grey']).map(c => String(c).trim()).filter(Boolean)));

    return {
      id,
      name: p.name || `${design} - ${productType}`,
      design,
      productType,
      url: finalUrl,
      image: imgHref,
      price: priceNum,
      sizes: p.sizes || ['S', 'M', 'L', 'XL', '2XL'],
      colors: cleanColors.length ? cleanColors : ['Black', 'White'],
      category,
      themes,
      audience,
      kids,
      brand,
      path: '/products/' + pathSlug + '/',
      shard: Math.floor(i / 200)
    };
  });
}

export function matches(p, { q = '', type = '', theme = '', audience = '', maxPrice = 0, favorites = [] } = {}) {
  return (!q || q.toLowerCase().split(/\s+/).every(w => (p.name + ' ' + p.themes.join(' ') + ' ' + p.audience).toLowerCase().includes(w)))
    && (!type || (type === 'kids' ? p.kids : p.category === type))
    && (!theme || theme === 'all' || p.themes.includes(theme))
    && (!audience || p.audience === audience)
    && (!maxPrice || p.price <= Number(maxPrice))
    && (!favorites.length || favorites.includes(p.id));
}
