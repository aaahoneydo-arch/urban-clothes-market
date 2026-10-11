const reduced=matchMedia('(prefers-reduced-motion: reduce)');
for(const gallery of document.querySelectorAll('[data-product-gallery]')){
  gallery.addEventListener('click',event=>{
    const button=event.target.closest('[data-gallery-src]');
    if(!button)return;
    const image=gallery.querySelector('[data-gallery-main]');
    image.src=button.dataset.gallerySrc;
    image.alt=button.dataset.galleryAlt;
    for(const thumb of gallery.querySelectorAll('[data-gallery-src]'))thumb.setAttribute('aria-pressed',String(thumb===button));
  });
}
for(const section of document.querySelectorAll('[data-lookbook]')){
  const track=section.querySelector('[data-look-track]');
  const cards=[...track.querySelectorAll('.look-card')];
  const pause=section.querySelector('[data-look-pause]');
  const position=section.querySelector('[data-look-position]');
  let current=0,userPaused=reduced.matches||!!navigator.connection?.saveData,visible=false,hover=false,focused=false,timer;
  const reflect=()=>{pause.textContent=userPaused?'Play':'Pause';pause.setAttribute('aria-label',userPaused?'Play slideshow':'Pause slideshow');};
  const stop=()=>{clearInterval(timer);timer=null;};
  const active=()=>visible&&!userPaused&&!hover&&!focused&&!document.hidden;
  const move=(delta,manual=false)=>{
    if(manual){userPaused=true;reflect();stop();}
    const end=track.scrollWidth-track.clientWidth;
    current=delta>0&&track.scrollLeft>=end-3?0:delta<0&&track.scrollLeft<=3?cards.length-1:(current+delta+cards.length)%cards.length;
    track.scrollTo({left:cards[current].offsetLeft-cards[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'});
    position.textContent=`Look ${current+1} of ${cards.length}`;
  };
  const schedule=()=>{stop();if(active())timer=setInterval(()=>move(1),6000);};
  section.querySelector('[data-look-prev]').addEventListener('click',()=>move(-1,true));
  section.querySelector('[data-look-next]').addEventListener('click',()=>move(1,true));
  pause.addEventListener('click',()=>{userPaused=!userPaused;if(!userPaused){hover=false;focused=false;}reflect();schedule();});
  section.addEventListener('mouseenter',()=>{hover=true;stop();});
  section.addEventListener('mouseleave',()=>{hover=false;schedule();});
  section.addEventListener('focusin',()=>{focused=true;stop();});
  section.addEventListener('focusout',()=>{queueMicrotask(()=>{focused=section.contains(document.activeElement);schedule();});});
  track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1,true);}});
  track.addEventListener('pointerdown',()=>{userPaused=true;reflect();stop();});
  let scrollTimer;
  track.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{current=cards.reduce((best,card,i)=>Math.abs(card.offsetLeft-cards[0].offsetLeft-track.scrollLeft)<Math.abs(cards[best].offsetLeft-cards[0].offsetLeft-track.scrollLeft)?i:best,0);position.textContent=`Look ${current+1} of ${cards.length}`;},150);},{passive:true});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.2}).observe(section);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{if(reduced.matches)userPaused=true;reflect();schedule();});
  reflect();
}
