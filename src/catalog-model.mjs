export const TYPES = [
  ['hoodies', 'Hoodies & Sweatshirts', /hoodie|hooded|sweatshirt|pullover|crewneck|fleece/i],
  ['jackets', 'Jackets & Outerwear', /jacket|windbreaker|command.*zip|medalist.*pullover/i],
  ['tees', 'Tees & Tanks', /shirt|tank|tee|jersey|polo|henley/i],
  ['hats', 'Hats & Beanies', /cap|hat|beanie|visor/i],
  ['mugs', 'Mugs & Drinkware', /mug|bottle|tumbler|cup|flask|coaster|can cooler|bowl|teapot|jar/i],
  ['art', 'Wall Art & Canvas', /art print|canvas|poster|tapestry|wall print|wall art|framed print|photographic print|metal sign|plaque/i],
  ['tech', 'Phone Cases & Tech', /phone|iphone|samsung|galaxy|case|laptop|sleeve|desk mat|mouse pad/i],
  ['home', 'Home & Living', /pillow|blanket|shower curtain|wall clock|clock|apron|towel|candle|napkin|ornament|wrapping paper/i],
  ['stickers', 'Stickers, Pins & Magnets', /sticker|magnet|pin|badge|button/i],
  ['bags', 'Bags & Backpacks', /bag|tote|pouch|backpack|fanny pack|duffel|luggage/i],
  ['stationery', 'Stationery & Journals', /notebook|journal|pad|postcard|greeting card|holiday card/i],
  ['kids', 'Kids & Baby', /kid|baby|babies|toddler|youth|infant|bodysuit|bib/i],
  ['bottoms', 'Shorts & Joggers', /short$|jogger|socks|espadrille|sneaker|flip flop/i],
  ['pets', 'Pet Gear', /dog|bandana|pet blanket/i],
  ['accessories', 'Accessories', /keychain|jet tag|umbrella|watch|tie|mirror|puzzle|playing cards|golf|paddle|skate/i]
];

export const THEMES = [
  ['love', 'Love & Romance', /\b(love|loves|loving|heart|hearts|sweetheart|cupid|valentine|valentines|soulmate|soulmates|kiss|kisses|hug|hugs|romance|romantic)\b/i, 'Heartfelt romance, soulmates, and loving graphic art.'],
  ['gothic', 'Gothic & Dark Aesthetic', /\b(goth|gothic|skull|skulls|skeleton|skeletons|grim|reaper|wraith|vampire|vampires|occult|witch|witches|horror|coffin|grave|graveyard|undead|abyssal|darkness|crow|raven|memento mori|belladonna|poison|cathedral|sacred heart)\b/i, 'Dark aesthetic, gothic skulls, occult mysteries, and edgy art.'],
  ['sports', 'Sports & Fitness', /\b(sport|sports|gym|workout|fitness|running|runner|marathon|basketball|football|soccer|baseball|boxing|athletic|athlete|lifting|weights|weightlifting|powerlifting|barbell|training|coach|game day)\b/i, 'Active gym wear, sports fandom, and high-energy athletic graphics.'],
  ['relationships', 'Relationships & Family', /\b(relationship|relationships|couple|couples|husband|wife|boyfriend|girlfriend|partner|partners|soulmate|soulmates|lovers?|marriage|anniversary|family|mom|dad|mother|father|sister|brother|besties?|bff)\b/i, 'Apparel and gifts celebrating family, couples, best friends, and loved ones.'],
  ['inspirational', 'Inspirational & Mindset', /\b(inspire|inspirational|motivat|motivation|motivational|dream|dreams|believe|positive|positivity|hope|peace|faith|courage|strength|blessed|mindset|focus|hustle|unstoppable|gratitude|wisdom|harmony|zen|bonsai)\b/i, 'Positive mindset, motivational quotes, and uplifting daily reminders.'],
  ['gamers', 'Gamers & Arcade', /player|controller|robot|gamer|gaming|arcade|noob|pixel|quest|rpg|d20|dice|mana|insert coin|joystick/i, 'For your next game night, boss fight, or victory lap.'],
  ['cats', 'Cat Lovers', /\b(cat|cats|kitten|feline|maneki|neko|meow)\b/i, 'For the ones who know who really runs the house.'],
  ['dogs', 'Dog Lovers', /\b(dog|dogs|puppy|pitbull|pit bull|retriever|shepherd|doberman|canine|paws|hound|corgi|pug)\b/i, 'Wear a little love for your four-legged best friend.'],
  ['cars', 'Car Enthusiasts', /\b(car|cars|garage|modification|backroad|racing|muscle car|lowrider|impala|jdm|skyline|motorcycle|cafe racer|4x4|overland)\b/i, 'For the garage crowd and the open-road dreamers.'],
  ['humor', 'Funny & Sarcastic', /judgemental|angry|naughty|fault|cuss|problems|other man|other woman|war crime|my bad|social battery|okayest|sarcastic|sarcasm|disdain|avoiding everyone|treachery|opossum|raccoon|dumpster/i, 'Good jokes. Great conversation starters.'],
  ['streetwear', 'Urban Streetwear', /night run|racing|tokyo|drift|city|street|varsity|graffiti|brooklyn|nyc|harajuku|shibuya|samurai|oni|kitsune/i, 'Raw city energy, underground racing, and classic varsity graphics.'],
  ['cyber', 'Cyberpunk & Sci-Fi', /cyber|cybernetic|cyberpunk|cyberwave|orbit|future|mech|mecha|neon|bot|void|aberration|synthwave|vaporwave|glitch|matrix|motherboard/i, 'Futuristic cityscapes, neon androids, and cybernetic street art.'],
  ['tarot', 'Tarot & Mystical', /tarot|fool|magician|priestess|empress|emperor|hierophant|lovers|chariot|death|devil|tower|star|moon|sun|hermit|fortune|justice|hanged man|temperance|judgement|celestial|lunar|alchemy|alchemical|mystic|astrology/i, 'Iconic tarot archetypes, mystical cards, and esoteric symbolism.'],
  ['fantasy', 'Dark Fantasy & Gothic', /knight|wraith|bone|wendigo|gargoyle|plague|aberration|seraphim|gothic|horror|dragon|kraken|mothman|cthulhu|deity|grimoire/i, 'High-detail dark fantasy, mythical creatures, and abyssal armor.'],
  ['diy', 'DIY & Makers', /tool|power tools|level|measure|built different|mechanic|wrench|blacksmith|anvil|carpenter/i, 'Made for people who would rather build it themselves.'],
  ['kids', 'Kids & Family', null, 'Small sizes. Big personality.'],
  ['all', 'All Designs', null, 'Find your next favorite in the full collection.']
];

export function slug(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
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
    const rawType = (p.productType && p.productType.trim()) || (parts.length > 1 ? parts.pop().trim() : 'Apparel');
    const productType = rawType
      .replace(/\s+by\s+[A-Za-z0-9\s\+\/]+/i, '')
      .replace(/^(Stanley\/Stella|Gildan|Bella\s*\+\s*Canvas|Augusta\s*Sportswear)\s+/i, '')
      .replace(/\b(CRUISER|HAMMER|DRUMMER|CRAFTER|BLASTER|NORA)\b/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Apparel';

    const design = (p.design && p.design.trim()) || (parts.length ? parts.join(' - ').trim() : p.name);
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
      name: `${design} - ${productType}`,
      design,
      productType,
      url: finalUrl,
      buyUrl: finalUrl,
      image: imgHref,
      img: imgHref,
      price: priceNum,
      sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL', '2XL'],
      colors: cleanColors.length ? cleanColors : ['Black', 'White'],
      category,
      themes,
      audience,
      kids,
      brand,
      store: p.store || (finalUrl.includes('myspreadshop.com') ? 'spreadshop' : finalUrl.includes('printify.me') ? 'printify' : finalUrl.includes('zazzle.com') ? 'zazzle' : finalUrl.includes('redbubble.com') ? 'redbubble' : finalUrl.includes('teepublic.com') ? 'teepublic' : 'spreadshop'),
      storeLabel: p.storeLabel || p.channel || brand,
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
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
