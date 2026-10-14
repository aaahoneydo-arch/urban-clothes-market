import {esc,icon} from './templates.mjs';

export function lookbook(photos,products){
  const byId=new Map(products.map(p=>[p.id,p]));
  const looks=photos.filter(photo=>byId.has(photo.productId));
  if(!looks.length)return '';
  return `<section class="lookbook section" id="lookbook" aria-label="Urban Clothes Market style gallery" data-lookbook><div class="section-head"><div><div class="sub">YOUR STYLE. OUT IN THE WORLD.</div><h2>See yourself in the story.</h2><p>Fresh ways to wear your favorites. Find a look, make it yours.</p></div><div class="lookbook-controls"><button type="button" data-look-prev aria-label="Previous looks">←</button><button type="button" data-look-pause aria-label="Pause slideshow">Pause</button><button type="button" data-look-next aria-label="Next looks">→</button></div></div><div class="lookbook-track" tabindex="0" aria-label="Style photographs; scroll to browse" data-look-track>${looks.map(photo=>{const p=byId.get(photo.productId);return `<article class="look-card"><a href="${esc(p.path)}" aria-label="Shop ${esc(p.name)}"><img src="${esc(photo.src)}" alt="${esc(photo.alt||p.name+' in a styled look')}" width="800" height="1000" loading="lazy" decoding="async"><div class="look-caption"><span>${esc(p.productType)}</span><h3>${esc(p.design)}</h3><span class="look-shop">Shop the look ${icon('arrow')}</span></div></a></article>`;}).join('')}</div><div class="lookbook-foot"><span data-look-position>Look 1 of ${looks.length}</span><p>AI-styled imagery. Check the product photos for the exact garment, print, and colors.</p><a href="/#catalog" class="text-link">Explore all ${products.length.toLocaleString()} items ↗</a></div></section>`;
}

export function productGallery(p,photos){
  const looks=photos.filter(x=>x.productId===p.id);
  const image=`<div class="detail-image"><img data-gallery-main src="${esc(p.image)}" alt="${esc(p.name)}" width="700" height="700" fetchpriority="high"></div>`;
  if(!looks.length)return image;
  return `<div class="product-gallery" data-product-gallery>${image}<div class="gallery-thumbs" role="group" aria-label="Product images"><button type="button" data-gallery-src="${esc(p.image)}" data-gallery-alt="${esc(p.name)}" aria-label="Show product photo" aria-pressed="true"><img src="${esc(p.image)}" alt="" width="90" height="90" loading="lazy"><span>Product photo</span></button>${looks.map((photo,i)=>`<button type="button" data-gallery-src="${esc(photo.src)}" data-gallery-alt="${esc(photo.alt||p.name+' in a styled look')}" aria-label="Show styled look${looks.length>1?' '+(i+1):''}" aria-pressed="false"><img src="${esc(photo.src)}" alt="" width="90" height="90" loading="lazy"><span>Styled look${looks.length>1?' '+(i+1):''}</span></button>`).join('')}</div><p class="gallery-note">Styled looks created with AI. Check the product photo for the exact garment, print, and colors.</p></div>`;
}
