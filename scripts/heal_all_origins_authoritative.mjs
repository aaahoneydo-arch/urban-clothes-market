import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'C:/Users/aaaho/.gemini/antigravity-ide/scratch';
const WORK_DIR = 'C:/Users/aaaho/Documents/Codex/2026-10-08/what/work/urban-clothes-market';

const GTM_PATH = path.join(WORK_DIR, 'data/ground_truth_design_map.json');
const FLOW_194_PATH = path.join(SCRATCH_DIR, 'flow_194_accurate_titles.json');
const TUM_PATH = path.join(SCRATCH_DIR, 'threadless_unified_manifest.json');
const TL_CATALOG_PATH = path.join(SCRATCH_DIR, 'threadless_all_products_catalog.json');
const ZZ_CATALOG_PATH = path.join(SCRATCH_DIR, 'zazzle_all_products_catalog.json');
const UCM_CATALOG_PATH = path.join(WORK_DIR, 'data/catalog.json');

// Master 194 Authoritative Design Map
const FLOW_194_PRISTINE = {
  1: "Death Before Decaf Grim Reaper Pour-Over",
  2: "Lowrider Classic Impala Low & Slow",
  3: "Measure Twice Cuss Once Carpenter Emblem",
  4: "Chaotic Alignment Good & Neutral Crest",
  5: "Mecha Pilot System Active HUD Helmet",
  6: "Spirit Kitsune Fox Japanese Art",
  7: "Vapor Glitch Cyberwave Retro Graphic",
  8: "Vintage 300ZX JDM Twin Turbo Sports Car",
  9: "Insert Coin Continue Arcade Gaming Vintage",
  10: "Lowrider Classic Boulevard Cruiser Chicano",
  11: "Play VHS Rewind 00:00 Retro 80s Cassette",
  12: "Memento Mori Gothic Skull & Hourglass",
  13: "Urgent ASAP Loading The Living Dream Sarcastic",
  14: "Japanese Cherry Blossom Bonsai Tree Botanical",
  15: "Alchemical Raven Mystic Occult Seal",
  16: "Japanese Oni Demon Samurai Mask",
  17: "Celestial Sun & Moon Celestial Harmony Crest",
  18: "Iron Pitbull Heavy Weightlifting Gym Barbell",
  19: "Rhino Powerlifting Heavy Barbell Gym",
  20: "Celestial Lunar Moth Moon Phases",
  21: "Gothic Gargoyle Cathedral Stone Guardian",
  22: "Quest Accepted Tabletop RPG Gaming Badge",
  23: "Drink The Coffee First Then Do Things Slogan",
  24: "Cybernetic Skull Mecha Android Wireframe",
  25: "Apothecary Botanical Remedy Skull Poison",
  26: "Heavyweight Championship Boxing Gloves",
  27: "Deep Ocean Predator Great White Shark",
  28: "Timber Wolf Howling Northern Lights Aurora",
  29: "Checked My Cares Still Don't Care Sarcasm",
  30: "Japanese Oni Demon Samurai Mask Warrior",
  31: "Insert Coin 25c Arcade Retro Gamer",
  32: "Memento Mori Remember You Must Die Stoic",
  33: "Oni Demon Mask Japanese Folklore Art",
  34: "Retro Synthwave Sunset Neon Grid",
  35: "Cosmic Drifter Astronaut Floating Deep Space",
  36: "Trash King Raccoon Dumpster Diver Connoisseur",
  37: "Lethal Remedy Skull Botanical Apothecary",
  38: "Botanical Remedy Apothecary Herbal Elixir",
  39: "Apothecary Botanical Herb Remedy Vintage",
  40: "Worker Honeybee Geometric Honeycomb Apiary",
  41: "Eternal Ouroboros Serpent Infinity Emblem",
  42: "The Moon Major Arcana Tarot Card Mystic",
  43: "Quest Accepted Fantasy RPG Guild Badge",
  44: "8-Bit Retro Nostalgia Pixel Gaming",
  45: "Grizzly Bear Wilderness National Forest",
  46: "Retro Pixel Gaming 8-Bit Nostalgia Heart",
  47: "Demon Mask Oni Cyberpunk Warrior",
  48: "Living The Dream Sarcastic Skull Coffee",
  49: "Ocean Coral Reef Sea Turtle Wildlife",
  50: "Blooming Anatomical Floral Heart Botanical",
  51: "Aviator Corgi Pilot Vintage Flight Club",
  52: "Vintage Botanical Hummingbird & Floral Blossom",
  53: "Sea Turtle Coral Reef Marine Conservation",
  54: "Skate Cultura Urban Street Skateboarding",
  55: "Iron Pitbull Heavy Gym Weightlifting Barbell",
  56: "Chaos Spark Tabletop Fantasy D20 Magic",
  57: "Cosmic French Press Coffee Nebula Pour",
  58: "Skeleton Barista Pour-Over Coffee Art",
  59: "Sanity In A Cup Liquid Roasted Premium Coffee",
  60: "Iron Pitbull Heavyweight Fitness Gym",
  61: "Zero Concerns Given Sarcastic Streetwear",
  62: "Death Before Decaf Grim Reaper Skull Mug",
  63: "Mystic Witch Mandrake Botanical Herb",
  64: "System Overload Living The Dream Sarcasm",
  65: "Midnight Racing Tokyo Underground JDM Skyline",
  66: "Vintage Cafe Racer Motorcycle Garage Custom Cycles",
  67: "Celestial Sun Moon Harmony Yin Yang",
  68: "Chalk & Iron Heavyweight Barbell Gym",
  69: "Retro 80s Cassette Tape Mixtape Rewind",
  70: "The Iron Never Lies Heavy Weightlifting Gym",
  71: "Synthwave Sunset Palms 80s Retro Neon",
  72: "Celestial Koi Fish Yin Yang Harmony",
  73: "Spartan Gladiator Battle Helm & Shield",
  74: "Tokyo Underground Neon Cyber Streetwear Skyline",
  75: "Measure Twice Cut Once Carpentry Guild",
  76: "Cyber Geisha Neo-Tokyo Android Streetwear",
  77: "Caffeine Molecule C8H10N4O2 High Energy Chemistry",
  78: "Japanese Oni Samurai Warrior Mask",
  79: "Tabletop RPG Character Alignment Chart D&D",
  80: "Sea Turtle Coral Reef Ocean Wildlife",
  81: "Cyber Bionic Tiger Mecha Predator",
  82: "Social Battery Depleted Low Energy Critical",
  83: "Worker Honeybee Geometric Honeycomb Apiary",
  84: "Rogue Assassin Dagger Stealth Guild RPG",
  85: "Magic Potion Bottle Mystic Alchemy Elixir",
  86: "Mecha Pilot Helmet HUD System Active",
  87: "Cyber Industrial Technical Mecha Unit Spec",
  88: "Memento Mori Skull & Hourglass Floral Emblem",
  89: "National Wilderness Park Explorer Crossed Axes",
  90: "Lucky Maneki Neko Japanese Beckoning Cat",
  91: "Stealth Snow Leopard Mountain Apex Predator",
  92: "Retro VHS Cassette Tape 80s Mixtape Rewind",
  93: "Glitch Vaporwave 80s Aesthetic Cyber",
  94: "Cosmic French Press Galactic Coffee Nebula",
  95: "Memento Mori Skull Hourglass Botanical",
  96: "Kaiju Ramen Tokyo Giant Monster Noodle Bowl",
  97: "Chief Happiness Officer Golden Retriever Mascot",
  98: "Kaiju Ramen Tokyo Monster Noodle Bar",
  99: "Cyber Attack Hound Mecha K9 Tactical Unit",
  100: "Vintage Hot Rod Garage Skull V8",
  101: "Never Stop Exploring Mountain Wilderness",
  102: "Cosmic French Press Nebula Coffee Galactic",
  103: "Celestial Lunar Moth Moon Phases Botanical",
  104: "Deploy Straight To Production YOLO Developer Bug",
  105: "Never Split The Party Tabletop RPG Guild",
  106: "Natural 20 Critical Hit D20 Polyhedral Die",
  107: "Skeleton Iced Coffee Barista Skull Pour",
  108: "Social Battery Extremely Low Charge Required",
  109: "Skeleton Iced Coffee Skull Drinker Summer",
  110: "Timber Wolf Howling Northern Lights Aurora",
  111: "Tested In Production Developer Debug Sarcasm",
  112: "Discipline Over Motivation Daily Grind Mindset",
  113: "Premium Fresh Roasted Coffee Beans Grinder",
  114: "Dungeon Mimic Treasure Chest RPG Monster",
  115: "Blooming Anatomical Heart Rose Vines",
  116: "Drink The Coffee First Then Do Things Daily",
  117: "Mystic Magic Potion Bottle Glowing Elixir",
  118: "Chief Happiness Officer Labrador Dog Mascot",
  119: "Wander Forth Without Maps Compass Explorer",
  120: "Alchemical Raven Mystic Moon & Skull",
  121: "Celestial Koi Fish Yin Yang Pond",
  122: "Caffeine Molecule Stimulant Chemical Energy",
  123: "Heavy Metal Skull Crossed Bones Rocker",
  124: "Caffeine Molecule C8H10N4O2 Science Chemistry",
  125: "Cyber Samurai Katana Mecha Streetwear",
  126: "Tokyo Underground Neon Cyber Cityscape",
  127: "Scream Into The Void Sarcastic Existential Meme",
  128: "Cyber Geisha Android Neo-Tokyo Fashion",
  129: "Celestial Sun & Moon Mystical Harmony",
  130: "Cyber Geisha Mecha Android Cyberpunk",
  131: "National Park Outdoor Adventure Explorer",
  132: "Japanese Spirit Kitsune Fox Mask Folklore",
  133: "Midnight Barn Owl Moonlit Forest Flight",
  134: "Midnight Barn Owl Moon Phases Feathers",
  135: "Celestial Black Cat Crescent Moon Stars",
  136: "Iron Gorilla Barbell Heavyweight Gym",
  137: "Lowrider Classic Boulevard Impala Chicano",
  138: "Rhino Powerlifting Heavy Barbell Fitness",
  139: "Discipline Over Motivation Workout Gym Mindset",
  140: "Worker Honeybee Hexagon Honeycomb Apiary",
  141: "Social Battery Low Recharging Introvert Slogan",
  142: "Vintage Italian Moka Pot Espresso Roaster",
  143: "Grizzly Bear Wilderness Forest Heritage Brand",
  144: "Running On Coffee & Pure Sarcasm Daily",
  145: "Cyber Geisha Future Android Neon Streetwear",
  146: "Deep Space Galaxy Nebula Stargazer",
  147: "My Bad Your Fault Funny Sarcastic Slogan",
  148: "Checked My Cares Still Don't Care Funny",
  149: "Please Let Me Overthink This Funny Slogan",
  150: "Apothecary Botanical Remedy Skull Vintage",
  151: "Spirit Kitsune Fox Mask Japanese Folklore",
  152: "Please Let Me Overthink This Funny Overthinker",
  153: "Cybernetic Bionic Tiger Mecha Predator",
  154: "Wander Forth Without Maps Wilderness Compass",
  155: "This Is Fine Sarcastic Dog Fire Meme",
  156: "Cybernetic Skull Mecha Tech Wireframe",
  157: "Midnight Club Racing Tokyo JDM Skyline",
  158: "Mystic Magic Potion Bottle Healing Elixir",
  159: "Spartan Gladiator Warrior Shield Graphic",
  160: "Living The Dream Sarcastic Loading Bar",
  161: "Necromancer Grimoire Dark Fantasy Spellbook",
  162: "Celestial Sun Moon Harmony Balance",
  163: "Checked My Cares Still Don't Care Sarcasm",
  164: "Blooming Heart Anatomical Wildflowers Botanical",
  165: "Gothic Cathedral Archways Stained Glass",
  166: "The Moon Major Arcana Tarot Card Mystic",
  167: "Cyberwave 80s Retro Grid Neon Horizon",
  168: "Apothecary Poison Skull Botanical Remedy",
  169: "Disaster Waiting To Happen Funny Slogan",
  170: "Vintage Diner Coffee Free Refills Bottomless",
  171: "Cyber Attack Hound Tactical Mecha K9",
  172: "Grizzly Forest Wilderness National Park Brand",
  173: "Neo-Tokyo Mobile Suit Mecha Pilot Unit",
  174: "Alchemical Raven Occult Moon Magic Skull",
  175: "Everything Is Fine Sarcastic Laboratory Meme",
  176: "Necromancer Grimoire Dark Magic Spellbook",
  177: "Vintage Botanical Hummingbird & Wildflower",
  178: "Overland Explorer Off-Road 4x4 Expedition",
  179: "Dungeon Mimic Treasure Chest RPG Monster",
  180: "Kaiju Ramen Tokyo Giant Monster Noodle Bowl",
  181: "Warm & Dysfunctional Funny Family Holiday Slogan",
  182: "Alchemical Raven Mystic Moon & Skull",
  183: "Celestial Black Cat Crescent Moon Stars",
  184: "Lucky Maneki Neko Beckoning Japanese Cat",
  185: "Not Today Maybe Tomorrow Funny Procrastinator",
  186: "Cyber Patrol Neo-Tokyo Enforcement Police",
  187: "Memento Mori Skull & Hourglass Botanical",
  188: "Vintage Hummingbird & Floral Botanical Blossom",
  189: "Overland Explorer Trail Proven All-Terrain 4x4",
  190: "Lucky Cat Maneki Neko Retro Vaporwave Graphic",
  191: "Tokyo Underground Neon Cyber Streetwear",
  192: "Everything Is Fine Dumpster Fire Sarcastic Meme",
  193: "Skeleton Barista Pour-Over Coffee Art",
  194: "Viking Runes & Crossed Axes Heavy Iron Strength Gym"
};

console.log('=== HEALING ALL ORIGIN SHOPS & CATALOGS AUTHORITATIVE ===\n');

// 1. Heal scratch/flow_194_accurate_titles.json
if (fs.existsSync(FLOW_194_PATH)) {
  const d = JSON.parse(fs.readFileSync(FLOW_194_PATH, 'utf8'));
  for (const [idStr, title] of Object.entries(FLOW_194_PRISTINE)) {
    const id = parseInt(idStr, 10);
    if (d[id]) {
      d[id].title = title;
    } else {
      d[id] = { id, filename: `flow-gen-${String(id).padStart(4, '0')}.png`, title };
    }
  }
  fs.writeFileSync(FLOW_194_PATH, JSON.stringify(d, null, 2), 'utf8');
  console.log(`✓ Healed scratch/flow_194_accurate_titles.json with 194 pristine titles.`);
}

// 2. Heal data/ground_truth_design_map.json
if (fs.existsSync(GTM_PATH)) {
  const gtm = JSON.parse(fs.readFileSync(GTM_PATH, 'utf8'));
  for (const [idStr, title] of Object.entries(FLOW_194_PRISTINE)) {
    const id = parseInt(idStr, 10);
    const key1 = `flow-gen-${String(id).padStart(4, '0')}`;
    const key2 = `flow-gen-${String(id).padStart(4, '0')}-trans`;
    if (gtm[key1]) gtm[key1].title = title;
    else gtm[key1] = { title, tags: ['urbanclothesmarket', 'streetwear', 'graphic-apparel'] };
    if (gtm[key2]) gtm[key2].title = title;
    else gtm[key2] = { title, tags: ['urbanclothesmarket', 'streetwear', 'graphic-apparel'] };
  }
  fs.writeFileSync(GTM_PATH, JSON.stringify(gtm, null, 2), 'utf8');
  console.log(`✓ Healed data/ground_truth_design_map.json.`);
}

// 3. Heal scratch/threadless_unified_manifest.json
if (fs.existsSync(TUM_PATH)) {
  const tum = JSON.parse(fs.readFileSync(TUM_PATH, 'utf8'));
  let tumHealed = 0;
  for (const item of tum) {
    if (item.raw_file && item.raw_file.startsWith('flow-gen-')) {
      const match = item.raw_file.match(/flow-gen-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (FLOW_194_PRISTINE[num]) {
          item.title = FLOW_194_PRISTINE[num];
          tumHealed++;
        }
      }
    }
  }
  fs.writeFileSync(TUM_PATH, JSON.stringify(tum, null, 2), 'utf8');
  console.log(`✓ Healed ${tumHealed} items in scratch/threadless_unified_manifest.json.`);
}

// 4. Heal scratch/threadless_all_products_catalog.json (160k items!)
if (fs.existsSync(TL_CATALOG_PATH)) {
  console.log('Reading threadless_all_products_catalog.json...');
  const tlCatalog = JSON.parse(fs.readFileSync(TL_CATALOG_PATH, 'utf8'));
  let tlHealed = 0;
  for (const item of tlCatalog) {
    // If title has OCR typos, replace them
    if (/qrrrrrtnss/i.test(item.title || '')) {
      item.title = item.title.replace(/qrrrrrtnss/i, 'Wilderness');
      tlHealed++;
    }
    if (/overlan\b/i.test(item.title || '')) {
      item.title = item.title.replace(/overlan\b/i, 'Overland');
      tlHealed++;
    }
    if (/spirii/i.test(item.title || '')) {
      item.title = item.title.replace(/'?spirii kitsung/i, 'Spirit Kitsune');
      tlHealed++;
    }
    if (/30ez\s*nlie/i.test(item.title || '')) {
      item.title = item.title.replace(/30ez\s*nlie/i, 'Vintage 300ZX JDM');
      tlHealed++;
    }
    if (/morl\s*mbmentd/i.test(item.title || '')) {
      item.title = item.title.replace(/morl\s*mbmentd/i, 'Memento Mori');
      tlHealed++;
    }
    if (/remedx\s*lmthal/i.test(item.title || '')) {
      item.title = item.title.replace(/remedx\s*lmthal/i, 'Lethal Remedy');
      tlHealed++;
    }
    if (/zohopa\s*remed/i.test(item.title || '')) {
      item.title = item.title.replace(/zohopa\s*remed/i, 'Apothecary Remedy');
      tlHealed++;
    }
  }
  fs.writeFileSync(TL_CATALOG_PATH, JSON.stringify(tlCatalog), 'utf8');
  console.log(`✓ Healed ${tlHealed} items in scratch/threadless_all_products_catalog.json.`);
}

// 5. Heal scratch/zazzle_all_products_catalog.json (5.5k items!)
if (fs.existsSync(ZZ_CATALOG_PATH)) {
  console.log('Reading zazzle_all_products_catalog.json...');
  const zzCatalog = JSON.parse(fs.readFileSync(ZZ_CATALOG_PATH, 'utf8'));
  let zzHealed = 0;
  for (const item of zzCatalog) {
    if (/'?spirii\s*kitsung/i.test(item.title || '')) {
      item.title = item.title.replace(/'?spirii\s*kitsung/i, 'Spirit Kitsune Fox');
      zzHealed++;
    }
    if (/30ez\s*nlie/i.test(item.title || '')) {
      item.title = item.title.replace(/30ez\s*nlie/i, 'Vintage 300ZX Twin Turbo JDM');
      zzHealed++;
    }
    if (/qrrrrrtnss/i.test(item.title || '')) {
      item.title = item.title.replace(/qrrrrrtnss/i, 'Wilderness');
      zzHealed++;
    }
    if (/overlan\b/i.test(item.title || '')) {
      item.title = item.title.replace(/overlan\b/i, 'Overland');
      zzHealed++;
    }
    if (/morl\s*mbmentd/i.test(item.title || '')) {
      item.title = item.title.replace(/morl\s*mbmentd/i, 'Memento Mori');
      zzHealed++;
    }
    if (/remedx\s*lmthal/i.test(item.title || '')) {
      item.title = item.title.replace(/remedx\s*lmthal/i, 'Lethal Remedy');
      zzHealed++;
    }
    if (/zohopa\s*remed/i.test(item.title || '')) {
      item.title = item.title.replace(/zohopa\s*remed/i, 'Apothecary Remedy');
      zzHealed++;
    }
  }
  fs.writeFileSync(ZZ_CATALOG_PATH, JSON.stringify(zzCatalog), 'utf8');
  console.log(`✓ Healed ${zzHealed} items in scratch/zazzle_all_products_catalog.json.`);
}

// 6. Heal data/catalog.json (102.5k items)
if (fs.existsSync(UCM_CATALOG_PATH)) {
  console.log('Reading data/catalog.json...');
  const catalog = JSON.parse(fs.readFileSync(UCM_CATALOG_PATH, 'utf8'));
  let ucmHealed = 0;
  if (Array.isArray(catalog.products)) {
    for (const p of catalog.products) {
      if (/qrrrrrtnss/i.test(p.title || '')) {
        p.title = p.title.replace(/qrrrrrtnss/i, 'Wilderness');
        ucmHealed++;
      }
      if (/overlan\b/i.test(p.title || '')) {
        p.title = p.title.replace(/overlan\b/i, 'Overland');
        ucmHealed++;
      }
      if (/'?spirii\s*kitsung/i.test(p.title || '')) {
        p.title = p.title.replace(/'?spirii\s*kitsung/i, 'Spirit Kitsune');
        ucmHealed++;
      }
      if (/30ez\s*nlie/i.test(p.title || '')) {
        p.title = p.title.replace(/30ez\s*nlie/i, 'Vintage 300ZX JDM');
        ucmHealed++;
      }
      if (/morl\s*mbmentd/i.test(p.title || '')) {
        p.title = p.title.replace(/morl\s*mbmentd/i, 'Memento Mori');
        ucmHealed++;
      }
      if (/remedx\s*lmthal/i.test(p.title || '')) {
        p.title = p.title.replace(/remedx\s*lmthal/i, 'Lethal Remedy');
        ucmHealed++;
      }
      if (/zohopa\s*remed/i.test(p.title || '')) {
        p.title = p.title.replace(/zohopa\s*remed/i, 'Apothecary Remedy');
        ucmHealed++;
      }
    }
  }
  fs.writeFileSync(UCM_CATALOG_PATH, JSON.stringify(catalog), 'utf8');
  console.log(`✓ Healed ${ucmHealed} items in data/catalog.json.`);
}

console.log('\n=== ALL ORIGIN CATALOGS AND MANIFESTS HEALED AT ROOT ===');
