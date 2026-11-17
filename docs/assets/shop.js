(() => {
  // Single-design style table filter
  const field = document.querySelector('[data-variant-filter]');
  if (field) {
    const rows = Array.from(document.querySelectorAll('[data-variant]'));
    field.addEventListener('input', () => {
      const words = field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      for (const row of rows) row.hidden = !words.every(w => row.dataset.variant.includes(w));
      document.querySelector('[data-matches]').textContent = rows.filter(row => !row.hidden).length + ' matching styles';
    });
  }

  function decodeImg(raw, pfx) {
    if (!raw) return '';
    return raw.startsWith('@') ? pfx + raw.slice(1) : raw;
  }

  function buildCheckoutUrl(row, data) {
    const d = data.designs[row[0]];
    const t = data.types[row[1]];
    const slug = row[5] ? row[5] : (d[4] + '+' + t[2]);
    const uid36 = row[7] || d[3];
    return 'https://www.spreadshirt.com/shop/design/' + slug + '-D' + d[0] + '?appearance=' + row[3] + '&sellable=' + uid36 + '-' + t[1];
  }

  const THEME_ALIASES = {
    'gothic': ['gothic', 'crest', 'crown', 'gargoyle', 'cathedral', 'emblem'],
    'family & loyalty': ['family', 'loyalty', 'faithful'],
    'wolves & dogs': ['wolf', 'direwolves', 'dog', 'corso', 'pit bull', 'paws'],
    'cats & panthers': ['cat', 'panther', 'tiger', 'leopard', 'lion'],
    'dragons & phoenix': ['dragon', 'phoenix', 'raven', 'griffin', 'falcon'],
    'gaming & anime': ['gamer', 'anime', 'arcade', 'player', 'ronin', 'ninja'],
    'cars & garage': ['car', 'garage', 'racing', 'tool', 'measure', 'level', 'piston'],
    'city crests': ['new york', 'los angeles', 'skyline', 'city', 'urban'],
    'roses & floral': ['rose', 'floral', 'peonies', 'bloom', 'moon', 'thorns']
  };

  function compilePipeRegex(pattern) {
    if (!pattern) return null;
    const parts = pattern.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return null;
    const escaped = parts.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp('(?:^|\\b)(?:' + escaped.join('|') + ')', 'i');
  }

  function buildProductCard(row, data, designBase, itemBase) {
    const d = data.designs[row[0]];
    const t = data.types[row[1]];
    const buyUrl = buildCheckoutUrl(row, data);
    const price = (row[2] / 100).toFixed(2);
    const vImg = decodeImg(row[6], data.imgPfx);
    const dImg = vImg || decodeImg(d[5], data.imgPfx);
    const designHref = designBase + d[1] + '/';
    const designAltHref = row[4] ? (itemBase + (row[7] || d[3]) + '-' + t[1] + '/') : designHref;

    const art = document.createElement('article');
    if (vImg) {
      art.className = 'card';
      const pic = document.createElement('a');
      pic.className = 'picture';
      pic.href = buyUrl;
      pic.target = '_blank';
      pic.rel = 'noopener';
      pic.setAttribute('aria-label', 'Shop ' + d[2] + ' ' + t[0] + ' on Spreadshirt');
      const img = document.createElement('img');
      img.src = vImg;
      img.alt = d[2] + ' on ' + t[0];
      img.loading = 'lazy';
      img.decoding = 'async';
      pic.append(img);
      art.append(pic);
    } else {
      art.className = 'card stylecard';
      if (dImg) {
        const thumbWrap = document.createElement('a');
        thumbWrap.className = 'picture stylethumb';
        thumbWrap.href = buyUrl;
        thumbWrap.target = '_blank';
        thumbWrap.rel = 'noopener';
        thumbWrap.title = 'Design artwork preview — click to view exact ' + t[0] + ' mockup on Spreadshirt';
        const img = document.createElement('img');
        img.src = dImg;
        img.alt = d[2] + ' artwork preview';
        img.loading = 'lazy';
        img.decoding = 'async';
        thumbWrap.append(img);
        art.append(thumbWrap);
      }
    }

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = vImg ? t[0] : (t[5] + ' · ' + t[0]);

    const h3 = document.createElement('h3');
    const aTitle = document.createElement('a');
    aTitle.href = buyUrl;
    aTitle.target = '_blank';
    aTitle.rel = 'noopener';
    aTitle.textContent = d[2];
    h3.append(aTitle);

    const pPrice = document.createElement('p');
    pPrice.className = 'card-amount';
    pPrice.textContent = '$' + price + ' USD';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const buy = document.createElement('a');
    buy.className = 'btn btn-buy';
    buy.href = buyUrl;
    buy.target = '_blank';
    buy.rel = 'noopener';
    buy.textContent = 'Buy on Spreadshirt ↗';

    const more = document.createElement('a');
    more.className = 'morestyles';
    more.href = vImg ? designHref : designAltHref;
    more.textContent = vImg ? 'All styles →' : 'View item →';

    actions.append(buy, more);
    art.append(tag, h3, pPrice, actions);
    return art;
  }

  let prodPromise = null;
  function loadProductsIndex(url) {
    if (!prodPromise) {
      prodPromise = fetch(url).then(r => { if (!r.ok) throw Error(); return r.json(); });
    }
    return prodPromise;
  }

  // Interactive 46,877+ Product Browser on Homepage, /merch/, and /merch/<dept>/
  const finder = document.querySelector('[data-catalog-finder]');
  if (finder) {
    const form = finder.querySelector('form');
    const qInput = form.elements.q;
    const deptSel = form.elements.dept;
    const ptypeSel = form.elements.ptype || null;
    const sortSel = form.elements.sort;
    const resetBtn = finder.querySelector('[data-catalog-reset]');
    const status = finder.querySelector('[data-catalog-status]');
    const grid = finder.querySelector('[data-catalog-results]');
    const moreBtn = finder.querySelector('[data-catalog-more]');
    const staticBox = document.querySelector('[data-static-catalog]');
    const defDept = finder.dataset.defaultDept || '';
    const dBase = finder.dataset.designBase || 'merch/design/';
    const iBase = finder.dataset.itemBase || 'merch/item/';
    const defaultStatusText = status.textContent;
    const qChips = Array.from(finder.querySelectorAll('[data-quick-q]'));
    const pChips = Array.from(finder.querySelectorAll('[data-quick-ptype]'));
    const allChipReset = finder.querySelector('[data-quick-reset]');

    function syncQuickChips(q, ptype, dept, sort) {
      const qLower = q.toLowerCase();
      const isDefault = !q && dept === defDept && !ptype && sort === 'rel';
      if (resetBtn) resetBtn.hidden = isDefault;
      if (allChipReset) allChipReset.classList.toggle('current', isDefault);
      for (const c of qChips) c.classList.toggle('current', !!qLower && c.dataset.quickQ.toLowerCase() === qLower);
      for (const c of pChips) c.classList.toggle('current', !!ptype && c.dataset.quickPtype === ptype);
    }

    async function runFinder() {
      const q = qInput.value.trim();
      const dept = deptSel.value;
      const ptype = ptypeSel ? ptypeSel.value : '';
      const sort = sortSel.value;
      syncQuickChips(q, ptype, dept, sort);

      const isDefaultState = !q && dept === defDept && !ptype && sort === 'rel';
      if (isDefaultState) {
        grid.hidden = true;
        grid.replaceChildren();
        moreBtn.hidden = true;
        status.textContent = defaultStatusText;
        if (staticBox) staticBox.hidden = false;
        return;
      }

      status.textContent = 'Searching full verified catalog…';
      try {
        const data = await loadProductsIndex(finder.dataset.index);
        if (qInput.value.trim() !== q || deptSel.value !== dept || (ptypeSel ? ptypeSel.value : '') !== ptype || sortSel.value !== sort) return;

        const ptypeRx = compilePipeRegex(ptype);
        const typeMatch = data.types.map(t => (!dept || t[3] === dept || t[4] === dept) && (!ptypeRx || ptypeRx.test(t[0])));
        const designLower = data.designs.map(d => d[2].toLowerCase());
        const typeLower = data.types.map(t => (t[0] + ' ' + t[5] + ' ' + t[4]).toLowerCase());

        const aliasList = q ? THEME_ALIASES[q.toLowerCase()] : null;
        const wordGroups = (!aliasList && q)
          ? q.toLowerCase().split(/\s+/).filter(Boolean).map(tok => tok.split('|').filter(Boolean))
          : [];

        const matches = [];
        for (let i = 0; i < data.items.length; i++) {
          const row = data.items[i];
          if (!typeMatch[row[1]]) continue;
          if (aliasList) {
            const hay = designLower[row[0]] + ' ' + typeLower[row[1]];
            let anyHit = false;
            for (let a = 0; a < aliasList.length; a++) {
              if (hay.includes(aliasList[a])) { anyHit = true; break; }
            }
            if (!anyHit) continue;
          } else if (wordGroups.length) {
            const hay = designLower[row[0]] + ' ' + typeLower[row[1]];
            let ok = true;
            for (let w = 0; w < wordGroups.length; w++) {
              const alts = wordGroups[w];
              let grpHit = false;
              for (let a = 0; a < alts.length; a++) {
                if (hay.includes(alts[a])) { grpHit = true; break; }
              }
              if (!grpHit) { ok = false; break; }
            }
            if (!ok) continue;
          }
          matches.push(row);
        }
        if (sort === 'pa') matches.sort((a, b) => a[2] - b[2]);
        else if (sort === 'pd') matches.sort((a, b) => b[2] - a[2]);
        else if (sort === 'az') matches.sort((a, b) => designLower[a[0]].localeCompare(designLower[b[0]]) || typeLower[a[1]].localeCompare(typeLower[b[1]]));

        if (staticBox) staticBox.hidden = true;
        grid.hidden = false;
        grid.replaceChildren();
        status.textContent = matches.length
          ? matches.length.toLocaleString() + ' matching verified products (out of ' + data.items.length.toLocaleString() + ' total)' + (q ? ' for “' + q + '”' : '') + ' — every link goes straight to Spreadshirt.'
          : 'No matching verified products for “' + q + '”. Click Reset filters or try fewer keywords.';
        let shown = 0;
        const append = () => {
          const frag = document.createDocumentFragment();
          for (const row of matches.slice(shown, shown + 48)) {
            frag.append(buildProductCard(row, data, dBase, iBase));
          }
          grid.append(frag);
          shown += 48;
          moreBtn.hidden = shown >= matches.length;
        };
        append();
        moreBtn.onclick = append;
      } catch {
        status.textContent = 'Catalog search could not load. Browse category links below.';
        if (staticBox) staticBox.hidden = false;
      }
    }

    function resetAllFilters() {
      qInput.value = '';
      deptSel.value = defDept;
      if (ptypeSel) ptypeSel.value = '';
      sortSel.value = 'rel';
      runFinder();
    }

    form.addEventListener('submit', e => { e.preventDefault(); runFinder(); });
    deptSel.addEventListener('change', runFinder);
    if (ptypeSel) ptypeSel.addEventListener('change', runFinder);
    sortSel.addEventListener('change', runFinder);
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    if (allChipReset) allChipReset.addEventListener('click', resetAllFilters);
    for (const btn of qChips) {
      btn.addEventListener('click', () => {
        const same = qInput.value.trim().toLowerCase() === btn.dataset.quickQ.toLowerCase();
        qInput.value = same ? '' : btn.dataset.quickQ;
        runFinder();
      });
    }
    for (const btn of pChips) {
      btn.addEventListener('click', () => {
        if (!ptypeSel) return;
        ptypeSel.value = ptypeSel.value === btn.dataset.quickPtype ? '' : btn.dataset.quickPtype;
        runFinder();
      });
    }
    for (const btn of document.querySelectorAll('[data-filter-dept]')) {
      btn.addEventListener('click', () => {
        deptSel.value = btn.dataset.filterDept;
        runFinder();
        finder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    let fTimer;
    qInput.addEventListener('input', () => { clearTimeout(fTimer); fTimer = setTimeout(runFinder, 180); });
  }

  // Accessible Spreadshop Category Tabs with keyboard navigation, beforematch find-in-page sync & scroll-edge fades
  const tabsRoot = document.querySelector('[data-merch-tabs]');
  if (tabsRoot) {
    const tablist = tabsRoot.querySelector('[role="tablist"]');
    const tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
    const panelMap = new Map(tabs.map(t => [t, document.getElementById(t.dataset.panel)]));

    function selectTab(nextTab, moveFocus = false) {
      if (!nextTab) return;
      for (const tab of tabs) {
        const active = tab === nextTab;
        tab.setAttribute('aria-selected', String(active));
        tab.toggleAttribute('focusgroupstart', active);
        tab.tabIndex = active ? 0 : -1;
        const panel = panelMap.get(tab);
        if (panel) {
          if (active) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', 'until-found');
        }
      }
      if (moveFocus) nextTab.focus();
      try {
        nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      } catch {
        nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab, false));
      const panel = panelMap.get(tab);
      if (panel) panel.addEventListener('beforematch', () => selectTab(tab, false));
    }

    if (tablist && !Object.hasOwn(HTMLElement.prototype, 'focusGroup')) {
      tablist.addEventListener('keydown', e => {
        const cur = tabs.indexOf(document.activeElement);
        if (cur === -1) return;
        let next = -1;
        if (e.key === 'ArrowRight') next = (cur + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (cur - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== -1) {
          e.preventDefault();
          selectTab(tabs[next], true);
        }
      });
    }
  }

  if (typeof CSS !== 'undefined' && typeof IntersectionObserver !== 'undefined' && !CSS.supports('animation-timeline', 'scroll()')) {
    for (const scroller of document.querySelectorAll('.scroller')) {
      const first = scroller.firstElementChild;
      const last = scroller.lastElementChild;
      if (!first || !last) continue;
      const observer = new IntersectionObserver(entries => {
        for (const { target, intersectionRatio } of entries) {
          scroller.classList.toggle(target === first ? 'more-start' : 'more-end', intersectionRatio < 1);
        }
      }, { root: scroller, threshold: 1, rootMargin: '1px' });
      observer.observe(first);
      observer.observe(last);
    }
  }

  // Unified Full-Catalog + Books + Designs + Videos Search on /search/
  const results = document.querySelector('[data-search-results]');
  if (results) {
    const form = document.querySelector('.searchform');
    const input = form.elements.q;
    const params = new URLSearchParams(location.search);
    input.value = params.get('q') || '';
    let activeTab = 'all';
    const tabs = Array.from(document.querySelectorAll('[data-tab]'));
    for (const btn of tabs) {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        for (const t of tabs) t.classList.toggle('current', t === btn);
        show();
      });
    }

    let searchIdx = null;
    const status = document.querySelector('[data-search-status]');
    const more = document.querySelector('[data-search-more]');
    const dBase = results.dataset.designBase || 'merch/design/';
    const iBase = results.dataset.itemBase || 'merch/item/';

    async function show() {
      const value = input.value.trim();
      if (!value) {
        results.replaceChildren();
        more.hidden = true;
        status.textContent = 'Type any keyword to search all Spreadshirt products, original designs, Jason Coleman books, or YouTube videos.';
        return;
      }
      status.textContent = 'Searching full catalog…';
      try {
        searchIdx ||= fetch(results.dataset.index).then(r => { if (!r.ok) throw Error(); return r.json(); });
        const [metaRows, prodData] = await Promise.all([
          searchIdx,
          loadProductsIndex(results.dataset.productsIndex),
        ]);
        if (value !== input.value.trim()) return;
        const words = value.toLowerCase().split(/\s+/).filter(Boolean);

        const metaHits = [];
        if (activeTab !== 'products') {
          for (const x of metaRows) {
            if (activeTab === 'Video' && x[1] !== 'Video' && x[1] !== 'Short') continue;
            if ((activeTab === 'Design' || activeTab === 'Book') && x[1] !== activeTab) continue;
            const hay = (x[0] + ' ' + x[1] + ' ' + x[3]).toLowerCase();
            if (words.every(w => hay.includes(w))) metaHits.push(x);
          }
        }

        const prodHits = [];
        if (activeTab === 'all' || activeTab === 'products') {
          const dLower = prodData.designs.map(d => d[2].toLowerCase());
          const tLower = prodData.types.map(t => (t[0] + ' ' + t[5] + ' ' + t[4]).toLowerCase());
          for (let i = 0; i < prodData.items.length; i++) {
            const row = prodData.items[i];
            const hay = dLower[row[0]] + ' ' + tLower[row[1]];
            let ok = true;
            for (let w = 0; w < words.length; w++) {
              if (!hay.includes(words[w])) { ok = false; break; }
            }
            if (ok) prodHits.push(row);
          }
        }

        results.replaceChildren();
        const total = metaHits.length + prodHits.length;
        status.textContent = total
          ? `${prodHits.length.toLocaleString()} matching products + ${metaHits.length.toLocaleString()} designs, books & videos for “${value}”`
          : `No results for “${value}”`;

        const unified = [
          ...metaHits.map(x => ({ kind: 'meta', x })),
          ...prodHits.map(row => ({ kind: 'prod', row })),
        ];
        let shown = 0;
        function append() {
          const slice = unified.slice(shown, shown + 48);
          let prodGrid = results.querySelector('[data-search-prod-grid]');
          for (const entry of slice) {
            if (entry.kind === 'meta') {
              const x = entry.x;
              const a = document.createElement('a'), label = document.createElement('small'), title = document.createElement('strong');
              a.className = 'result'; a.href = x[2]; label.textContent = x[1]; title.textContent = x[0];
              a.append(label, title);
              results.append(a);
              prodGrid = null;
            } else {
              if (!prodGrid) {
                prodGrid = document.createElement('div');
                prodGrid.className = 'cards collection-grid search-prod-grid';
                prodGrid.setAttribute('data-search-prod-grid', '');
                results.append(prodGrid);
              }
              prodGrid.append(buildProductCard(entry.row, prodData, dBase, iBase));
            }
          }
          shown += 48;
          more.hidden = shown >= unified.length;
        }
        append();
        more.onclick = append;
      } catch {
        searchIdx = undefined;
        prodPromise = null;
        status.textContent = 'Search could not load. Browse books, designs, or videos from the navigation.';
      }
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const url = new URL(location.href);
      url.searchParams.set('q', input.value.trim());
      history.replaceState({}, '', url);
      show();
    });
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(show, 180); });
    show();
  }

  // Video Archive Browser on homepage
  const block = document.querySelector('[data-archive]');
  if (block) {
    const format = block.querySelector('select'), input = block.querySelector('input'), list = block.querySelector('[data-archive-list]');
    const nav = block.querySelector('[data-archive-nav]'), status = block.querySelector('[data-archive-status]');
    const prev = block.querySelector('[data-back]'), next = block.querySelector('[data-next]'), load = block.querySelector('[data-load]');
    let rows, page = 0;
    async function render() {
      try {
        rows ||= fetch(block.dataset.index).then(r => { if (!r.ok) throw Error(); return r.json(); });
        const data = await rows, words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const subset = data.filter(v => (!format.value || format.value === v[2]) && words.every(w => v[1].toLowerCase().includes(w)));
        const pages = Math.max(1, Math.ceil(subset.length / 6)); page = Math.max(0, Math.min(page, pages - 1));
        list.replaceChildren();
        for (const [id, title, kind] of subset.slice(page * 6, page * 6 + 6)) {
          const item = document.createElement('article'), a = document.createElement('a'), img = document.createElement('img'), h = document.createElement('h3'), titleLink = document.createElement('a'), kindText = document.createElement('p');
          item.className = 'video'; a.className = 'videoimage'; a.href = block.dataset.watch + id + '/';
          img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; img.alt = title; img.loading = 'lazy'; a.append(img);
          titleLink.href = a.href; titleLink.textContent = title; h.append(titleLink); kindText.textContent = kind === 'shorts' ? 'YouTube Short' : kind === 'streams' ? 'Livestream' : 'Video';
          item.append(a, h, kindText); list.append(item);
        }
        nav.hidden = false; prev.disabled = page === 0; next.disabled = page >= pages - 1;
        status.textContent = subset.length ? 'Page ' + (page + 1) + ' of ' + pages + ' · ' + subset.length + ' uploads' : 'No matching uploads';
      } catch { rows = undefined; nav.hidden = false; status.textContent = 'Open the full video archive above to continue browsing.'; }
    }
    load.onclick = () => { page = 0; render(); };
    format.onchange = () => { page = 0; render(); };
    let timer;
    input.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { page = 0; render(); }, 220); };
    prev.onclick = () => { if (page > 0) page--; render(); };
    next.onclick = () => { page++; render(); };
  }
})();

document.addEventListener('click', event => {
  const a = event.target.closest?.('a[href]');
  if (!a || typeof window.gtag !== 'function') return;
  const to = new URL(a.href);
  if (to.hostname === 'www.amazon.com' || to.hostname === 'www.spreadshirt.com') {
    window.gtag('event', 'seller_product_click', { seller: to.hostname === 'www.amazon.com' ? 'Amazon' : 'Spreadshirt', item_url: to.origin + to.pathname + to.search });
  } else if (to.hostname === 'www.youtube.com') {
    window.gtag('event', 'channel_video_click', { video_url: to.href });
  }
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      const active = registration.active;
      if (active && new URL(active.scriptURL).pathname === '/sw.js' && registration.scope === location.origin + '/') {
        registration.update().catch(() => {});
      }
    }
  }).catch(() => {});
}
