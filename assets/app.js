/* ============================================================
   芯片引脚参考 · 核心脚本
   - MCU 注册表：数据文件通过 MCU.register({...}) 注册芯片
   - 首页渲染芯片卡片、详情页渲染四大板块
   - 主题切换、搜索、筛选、引脚图联动
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 注册表 ---------- */
  const store = [];
  const byId = Object.create(null);

  const MCU = {
    register(def) {
      if (!def || !def.id) throw new Error('MCU.register 需要 id 字段');
      const i = store.findIndex(c => c.id === def.id);
      if (i >= 0) { store[i] = def; byId[def.id] = def; return def; }
      store.push(def);
      byId[def.id] = def;
      return def;
    },
    all() { return store.slice(); },
    get(id) { return byId[id] || null; },
    count() { return store.length; },
  };
  global.MCU = MCU;

  /* ---------- 小工具 ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const CAT_LABEL = {
    GPIO: 'GPIO', SPEC: '特殊功能', PWR: '电源', DBG: '调试', NC: '不可用',
  };
  const AF_LABEL = {
    TIM: '定时器', UART: '串口', SPI: 'SPI', I2C: 'I2C', CAN: 'CAN',
    ADC: 'ADC', DAC: 'DAC', USB: 'USB', DBG: '调试', SYS: '系统',
    REMAP: '重映射', COMP: '比较器', SAI: 'SAI', DMA: 'DMA',
    RTC: 'RTC', TOUCH: '触摸', CLK: '时钟输出', FLASH: 'Flash', STRAP: '启动配置',
  };

  const catClass = p =>
    p.cat === 'PWR' ? 'pwr'
      : p.cat === 'SPEC' ? 'spec'
        : p.cat === 'DBG' ? 'dbg'
          : p.cat === 'NC' ? 'nc' : 'gpio';

  function afList(p) {
    const out = [];
    if (!p.af) return out;
    for (const k of Object.keys(p.af)) {
      for (const v of p.af[k]) out.push({ k, v });
    }
    return out;
  }

  function pinSearchText(p) {
    return [
      p.n, p.nm, p.ty, p.ds, p.ad, p.no,
      afList(p).map(x => x.v).join(' '),
    ].join(' ').toLowerCase();
  }

  /* ---------- 主题 ---------- */
  const ICON_MOON = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const ICON_SUN = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6L6 18M18 6l1.6-1.6"/></svg>';

  function applyTheme(t) {
    const root = document.documentElement;
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    const btn = $('#themeBtn');
    if (btn) {
      btn.innerHTML = t === 'dark' ? ICON_SUN : ICON_MOON;
      btn.title = t === 'dark' ? '切换到浅色模式' : '切换到深色模式';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('mcu-theme'); } catch (e) { /* 隐私模式 */ }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
    const btn = $('#themeBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('mcu-theme', next); } catch (e) { /* 忽略 */ }
      });
    }
  }

  /* ---------- 悬浮提示 ---------- */
  let tipNode = null;
  function tip() {
    if (!tipNode) {
      tipNode = el('div');
      tipNode.id = 'tip';
      document.body.appendChild(tipNode);
    }
    return tipNode;
  }

  function showTip(p, x, y) {
    const t = tip();
    const afs = afList(p);
    let html = `<div class="tip-h"><b>${esc(p.nm)}</b><i>${esc(p.ty || '')}</i>`
      + `<span class="note">#${p.n}</span></div>`;
    if (p.ds) html += `<div class="tip-row"><b>复位后：</b>${esc(p.ds)}</div>`;
    if (afs.length) {
      const groups = {};
      afs.forEach(a => { (groups[a.k] = groups[a.k] || []).push(a.v); });
      html += '<div class="tip-row" style="margin-top:4px">';
      for (const k of Object.keys(groups)) {
        html += `<div><b>${esc(AF_LABEL[k] || k)}：</b>${esc(groups[k].join(' · '))}</div>`;
      }
      html += '</div>';
    }
    if (p.ad) html += `<div class="tip-row"><b>附加：</b>${esc(p.ad)}</div>`;
    if (p.no) html += `<div class="tip-row" style="color:var(--c-spec)"><b>注意：</b>${esc(p.no)}</div>`;
    t.innerHTML = html;
    t.classList.add('show');

    const r = t.getBoundingClientRect();
    let left = x + 14;
    let top = y + 16;
    if (left + r.width > window.innerWidth - 10) left = x - r.width - 14;
    if (top + r.height > window.innerHeight - 10) top = y - r.height - 14;
    t.style.left = Math.max(8, left) + 'px';
    t.style.top = Math.max(8, top) + 'px';
  }

  function hideTip() {
    if (tipNode) tipNode.classList.remove('show');
  }

  /* ---------- 首页：芯片卡片 ---------- */
  function renderIndex() {
    const grid = $('#chipGrid');
    if (!grid) return;
    const list = MCU.all();

    const paint = (chips) => {
      grid.innerHTML = '';
      if (!chips.length) {
        grid.appendChild(el('div', 'empty-state', '没有匹配的芯片，换个关键词试试'));
        return;
      }
      chips.forEach(c => {
        const a = el('a', 'chip-card');
        a.href = `chip.html?id=${encodeURIComponent(c.id)}`;

        const head = el('div', 'chip-card-head');
        const titleBox = el('div');
        titleBox.appendChild(el('h3', null, c.name));
        titleBox.appendChild(el('div', 'fam', `${c.family || ''}${c.family ? ' · ' : ''}${c.pinCount} 引脚`));
        head.appendChild(titleBox);
        head.appendChild(el('span', 'pkg-badge', c.pkg));
        a.appendChild(head);

        if (c.intro) a.appendChild(el('p', 'desc', c.intro));

        if (c.spec && c.spec.length) {
          const specs = el('div', 'specs');
          c.spec.slice(0, 4).forEach(([k, v]) => {
            const s = el('span');
            s.innerHTML = `${esc(k)} <b>${esc(v)}</b>`;
            specs.appendChild(s);
          });
          a.appendChild(specs);
        }

        if (c.tags && c.tags.length) {
          const tags = el('div', 'tags');
          c.tags.forEach(t => tags.appendChild(el('span', null, t)));
          a.appendChild(tags);
        }

        const go = el('span', 'go');
        go.innerHTML = '查看引脚详情 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>';
        a.appendChild(go);

        grid.appendChild(a);
      });
    };

    paint(list);

    const input = $('#indexSearch');
    const stat = $('#indexStat');
    if (stat) stat.textContent = `共 ${list.length} 款`;

    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        const hit = !q ? list : list.filter(c =>
          [c.name, c.family, c.pkg, c.intro, (c.tags || []).join(' '),
            (c.spec || []).map(x => x.join(' ')).join(' ')]
            .join(' ').toLowerCase().includes(q)
        );
        paint(hit);
        if (stat) stat.textContent = q ? `${hit.length} / ${list.length} 款` : `共 ${list.length} 款`;
      });
    }
  }

  /* ---------- 详情页：引脚图 ---------- */
  function renderPackage(chip) {
    const host = $('#pkg');
    if (!host) return;

    const total = chip.pins.length;
    const byN = new Map(chip.pins.map(p => [p.n, p]));

    // 四边分配：优先用数据里给出的 layout（真实封装各边引脚数不等），
    // 否则按 STM32 LQFP 的四等分约定推断。
    let buckets;
    if (chip.layout && (chip.layout.left || chip.layout.right || chip.layout.top || chip.layout.bottom)) {
      buckets = {
        left: (chip.layout.left || []).slice(),
        bottom: (chip.layout.bottom || []).slice(),
        right: (chip.layout.right || []).slice(),
        top: (chip.layout.top || []).slice(),
      };
    } else {
      const side = Math.ceil(total / 4);
      buckets = { left: [], bottom: [], right: [], top: [] };
      for (let n = 1; n <= total; n++) {
        if (n <= side) buckets.left.push(n);
        else if (n <= side * 2) buckets.bottom.push(n);
        else if (n <= side * 3) buckets.right.push(n);
        else buckets.top.push(n);
      }
      buckets.right.reverse();
      buckets.top.reverse();
    }

    const makePin = (n) => {
      const p = byN.get(n);
      const b = el('button', `pin ${catClass(p)}`);
      b.type = 'button';
      b.dataset.n = String(n);
      const no = el('span', 'pn', String(n));
      const nm = el('span', 'pnm', p.nm);
      b.appendChild(no);
      b.appendChild(nm);

      const show = (ev) => {
        const pt = ev.touches ? ev.touches[0] : ev;
        showTip(p, pt.clientX, pt.clientY);
      };
      b.addEventListener('mouseenter', show);
      b.addEventListener('mousemove', show);
      b.addEventListener('mouseleave', hideTip);
      b.addEventListener('touchstart', show, { passive: true });
      b.addEventListener('touchend', () => setTimeout(hideTip, 1400));
      b.addEventListener('click', () => selectPin(chip, p));
      return b;
    };

    const frag = document.createDocumentFragment();

    const left = el('div', 'pkg-side left');
    buckets.left.forEach(n => left.appendChild(makePin(n)));

    const right = el('div', 'pkg-side right');
    buckets.right.forEach(n => right.appendChild(makePin(n)));

    const top = el('div', 'pkg-side top');
    buckets.top.forEach(n => top.appendChild(makePin(n)));

    const bottom = el('div', 'pkg-side bottom');
    buckets.bottom.forEach(n => bottom.appendChild(makePin(n)));

    const body = el('div', 'pkg-body');
    body.innerHTML =
      `<span class="pin1-dot"></span><span class="pin1-label">PIN 1</span>` +
      `<span class="body-name">${esc(chip.name)}</span>` +
      `<span class="body-pkg">${esc(chip.pkg)}</span>` +
      (chip.pkgSize ? `<span class="body-extra">${esc(chip.pkgSize)}${chip.pitch ? ' · 间距 ' + esc(chip.pitch) : ''}</span>` : '');
    // 底部散热焊盘（QFN / 模组 EPAD）：不占四周引脚位，单独画在中间
    if (chip.epad && chip.epad.n) {
      const ep = byN.get(chip.epad.n);
      const b = el('button', `pin epad ${ep ? catClass(ep) : 'pwr'}`);
      b.type = 'button';
      b.dataset.n = String(chip.epad.n);
      b.title = chip.epad.desc || '';
      b.appendChild(el('span', 'pn', String(chip.epad.n)));
      b.appendChild(el('span', 'pnm', chip.epad.nm || 'EPAD'));
      if (ep) b.addEventListener('click', () => selectPin(chip, ep));
      body.appendChild(b);
    }

    frag.appendChild(top);
    frag.appendChild(left);
    frag.appendChild(body);
    frag.appendChild(right);
    frag.appendChild(bottom);
    host.appendChild(frag);

    // 图例：只列出这颗芯片实际用到的分类
    const legend = $('#pkgLegend');
    if (legend) {
      const cats = new Set(chip.pins.map(p => p.cat));
      const all = [
        ['GPIO', '--c-gpio', 'GPIO'],
        ['SPEC', '--c-spec', '特殊功能（复位 / 启动 / 晶振）'],
        ['PWR', '--c-pwr', '电源 / 地'],
        ['DBG', '--c-dbg', '调试接口'],
        ['NC', '--c-nc', '不可用 / 未连接'],
      ];
      legend.innerHTML = all.filter(([k]) => cats.has(k))
        .map(([, v, t]) => `<span><i style="background:var(${v})"></i>${t}</span>`).join('');
    }

    // 窄屏时封装图需要横向滚动，给出可滑动提示
    const scroller = host.closest('.pkg-scroll');
    const tip = $('.pkg-tip');
    if (scroller && tip) {
      const sync = () => tip.classList.toggle('on', scroller.scrollWidth > scroller.clientWidth + 1);
      sync();
      if (!scroller.dataset.tipBound) {
        scroller.dataset.tipBound = '1';
        let t = 0;
        window.addEventListener('resize', () => {
          clearTimeout(t);
          t = setTimeout(sync, 120);
        });
      }
    }
  }

  /* 点击引脚 → 展示详情 + 表格高亮滚动 */
  function selectPin(chip, p) {
    $$('.pin.active').forEach(x => x.classList.remove('active'));
    const self = $(`.pin[data-n="${p.n}"]`);
    if (self) self.classList.add('active');

    const box = $('#pinDetail');
    if (box) {
      const afs = afList(p);
      const groups = {};
      afs.forEach(a => { (groups[a.k] = groups[a.k] || []).push(a.v); });

      let afHtml = '<span class="note">无复用功能</span>';
      if (afs.length) {
        afHtml = '<div class="af-chips">' + afs.map(a =>
          `<span class="afc af-${esc(a.k)}">${esc(a.v)}</span>`).join('') + '</div>';
      }

      box.innerHTML =
        `<div class="pin-detail-head">
           <span class="pd-no">#${p.n}</span>
           <span class="pd-nm">${esc(p.nm)}</span>
           <span class="pd-ty">${esc(p.ty || '—')}</span>
           <span class="pd-ty" style="background:var(--accent-soft)">${esc(CAT_LABEL[p.cat] || p.cat)}</span>
         </div>
         <dl>
           <dt>复位后</dt><dd>${esc(p.ds || '—')}</dd>
           <dt>复用功能</dt><dd>${afHtml}</dd>
           <dt>附加功能</dt><dd>${esc(p.ad || '—')}</dd>
           <dt>注意事项</dt><dd>${esc(p.no || '—')}</dd>
         </dl>`;
      box.classList.add('show');
    }

    const row = $(`#tbody tr[data-n="${p.n}"]`);
    if (row) {
      $$('#tbody tr.flash').forEach(r => r.classList.remove('flash'));
      row.classList.add('flash');
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /* ---------- 详情页：引脚总表 ---------- */
  function renderTable(chip) {
    const tbody = $('#tbody');
    if (!tbody) return;

    const rows = chip.pins.map(p => {
      const afs = afList(p);
      const afHtml = afs.length
        ? '<div class="af">' + afs.map(a =>
            `<span class="afc af-${esc(a.k)}" title="${esc(AF_LABEL[a.k] || a.k)}">${esc(a.v)}</span>`
          ).join('') + '</div>'
        : '<span class="note">—</span>';

      const extra = [];
      if (p.ad) extra.push(`<div>${esc(p.ad)}</div>`);
      if (p.no) extra.push(`<span class="warn">⚠ ${esc(p.no)}</span>`);

      return `<tr class="${catClass(p)}" data-n="${p.n}" data-text="${esc(pinSearchText(p))}">`
        + `<td class="pin-no">${p.n}</td>`
        + `<td class="pin-nm">${esc(p.nm)}</td>`
        + `<td class="pin-type">${esc(p.ty || '—')}</td>`
        + `<td>${esc(p.ds || '—')}</td>`
        + `<td>${afHtml}</td>`
        + `<td>${extra.join('') || '<span class="note">—</span>'}</td>`
        + '</tr>';
    });

    tbody.innerHTML = rows.join('');
    updateCount(chip.pins.length, chip.pins.length);
  }

  function updateCount(shown, total) {
    const c = $('#count');
    if (c) c.textContent = shown === total ? `${total} 个引脚` : `${shown} / ${total}`;
  }

  /* ---------- 详情页：搜索 + 筛选 ---------- */
  function initFilters(chip) {
    const wrap = $('#filters');
    const search = $('#search');
    const tbody = $('#tbody');
    if (!tbody) return;

    // 收集数据里实际出现的外设分类
    const present = new Set();
    chip.pins.forEach(p => { if (p.af) Object.keys(p.af).forEach(k => present.add(k)); });

    const order = ['UART', 'SPI', 'I2C', 'CAN', 'USB', 'TIM', 'ADC', 'DAC', 'COMP', 'SAI', 'DBG', 'SYS', 'REMAP'];
    const keys = order.filter(k => present.has(k))
      .concat([...present].filter(k => !order.includes(k)));

    let active = 'ALL';

    const apply = () => {
      const q = (search ? search.value : '').trim().toLowerCase();
      let shown = 0;
      const rows = tbody.rows;
      for (let i = 0; i < rows.length; i++) {
        const tr = rows[i];
        let ok = !q || tr.dataset.text.includes(q);
        if (ok && active !== 'ALL') {
          ok = tr.querySelector(`.af-${active}`) !== null;
        }
        tr.style.display = ok ? '' : 'none';
        if (ok) shown++;
      }
      updateCount(shown, chip.pins.length);

      const empty = $('#tblEmpty');
      if (empty) empty.style.display = shown ? 'none' : '';
    };

    if (wrap) {
      const mk = (key, label) => {
        const b = el('button', 'fbtn' + (key === active ? ' active' : ''), label);
        b.type = 'button';
        b.addEventListener('click', () => {
          active = key;
          $$('.fbtn', wrap).forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          apply();
        });
        return b;
      };
      wrap.appendChild(mk('ALL', '全部'));
      keys.forEach(k => wrap.appendChild(mk(k, AF_LABEL[k] || k)));
    }

    if (search) {
      let t = null;
      search.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(apply, 90);
      });
      search.addEventListener('keydown', e => {
        if (e.key === 'Escape') { search.value = ''; apply(); }
      });
    }

    apply();
  }

  /* ---------- 详情页：外设速查 ---------- */
  function renderPeriph(chip) {
    const host = $('#periph');
    if (!host) return;
    if (!chip.periph || !chip.periph.length) {
      host.innerHTML = '<div class="empty-state">暂无外设速查数据</div>';
      return;
    }
    host.innerHTML = chip.periph.map(box => {
      const rows = box.rows.map(r =>
        `<tr><td>${esc(r[0])}</td><td>${r[1].map(s => esc(s)).join('<br>')}</td></tr>`
      ).join('');
      return `<div class="pbox"><h3>${esc(box.title)}</h3><table>${rows}</table></div>`;
    }).join('');
  }

  /* ---------- 详情页：注意事项 ---------- */
  function renderNotes(chip) {
    const host = $('#notes');
    if (!host) return;
    if (!chip.notes || !chip.notes.length) {
      host.innerHTML = '<li>暂无记录</li>';
      return;
    }
    // 原始数据里带少量强调标签（<b>/<u>/<br>），只放行这几个，其余一律转义
    host.innerHTML = chip.notes.map(t => {
      const safe = String(t)
        .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;')
        .replace(/<(?!\/?(?:b|u|em|i)>|br\s*\/?>)/g, '&lt;');
      return `<li>${safe}</li>`;
    }).join('');
  }

  /* ---------- 详情页：头部 ---------- */
  function renderHero(chip) {
    document.title = `${chip.name} 引脚图 · 芯片引脚参考`;
    const set = (sel, val) => { const n = $(sel); if (n) n.textContent = val; };
    set('#chipName', chip.name);
    set('#crumbName', chip.name);
    set('#chipIntro', chip.intro || '');

    const meta = $('#chipMeta');
    if (meta) {
      const bits = [chip.family, chip.pkg, `${chip.pinCount} 引脚`];
      if (chip.pkgSize) bits.push(chip.pkgSize);
      if (chip.pitch) bits.push(`引脚间距 ${chip.pitch}`);
      meta.innerHTML = bits.filter(Boolean)
        .map(b => `<span>${esc(b)}</span>`).join('<span class="dot-sep">·</span>');
    }

    const tags = $('#chipTags');
    if (tags) {
      tags.innerHTML = (chip.tags || []).map(t => `<span>${esc(t)}</span>`).join('');
    }

    renderDocLinks(chip);

    const spec = $('#specGrid');
    if (spec) {
      spec.innerHTML = (chip.spec || []).map(([k, v]) =>
        `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    }

    const src = $('#chipSource');
    if (src) {
      const parts = [];
      if (chip.source && chip.source.datasheet) parts.push(`数据手册 ${chip.source.datasheet}`);
      if (chip.source && chip.source.refman) parts.push(`参考手册 ${chip.source.refman}`);
      const tail = parts.length ? parts.join(' · ') : '数据来源见手册';
      const link = chip.links || {};
      const productUrl = link.vendorProduct || link.stProduct;
      const vendorName = link.vendor ? `${link.vendor} 官网` : 'ST 官网产品页';
      const st = productUrl
        ? ` · <a href="${esc(productUrl)}" target="_blank" rel="noopener noreferrer">${esc(vendorName)}</a>`
        : '';
      src.innerHTML = esc(tail) + st;
    }

    const h2count = $('#pinTableTitle');
    if (h2count) h2count.textContent = `${chip.pinCount} 引脚功能总表`;
  }

  /* ---------- 详情页：手册跳转链接 ---------- */
  function renderDocLinks(chip) {
    const host = $('#docLinks');
    if (!host) return;
    const L = chip.links || {};

    const ICON_EXT = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>';
    const ICON_CN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a3 3 0 0 1 3 3v11a2.5 2.5 0 0 0-2.5-2.5H4z"/><path d="M20 5h-4a3 3 0 0 0-3 3v11a2.5 2.5 0 0 1 2.5-2.5H20z"/></svg>';
    const ICON_EN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/></svg>';

    // 厂商名与站点：ST 用 stProduct/stDatasheet，其他厂商用 vendor/vendorProduct/vendorDatasheet
    const vendor = L.vendor || 'ST 官方';
    const vendorSite = L.vendor ? (() => {
      try { return new URL(L.vendorProduct || L.vendorDatasheet).hostname.replace(/^www\./, ''); }
      catch (e) { return '原厂官网'; }
    })() : 'st.com';
    const datasheetHref = L.vendorDatasheet || L.stDatasheet || L.stProduct;
    const productHref = L.vendorProduct || L.stProduct;

    const items = [];
    if (L.lcsc) {
      items.push({
        href: L.lcsc,
        icon: ICON_CN,
        label: '嘉立创商城',
        strong: '中文资料 / 数据手册',
        note: '立创商城商品页，含中文资料与现货报价',
      });
    }
    if (datasheetHref) {
      items.push({
        href: datasheetHref,
        icon: ICON_EN,
        label: vendor,
        strong: '英文数据手册 PDF',
        note: chip.source && chip.source.datasheet
          ? `${chip.source.datasheet}（${vendorSite} 原版）`
          : `${vendorSite} 原版数据手册`,
      });
    }
    if (productHref) {
      items.push({
        href: productHref,
        icon: ICON_EN,
        label: L.vendor ? `${vendor} 官网` : 'ST 官网',
        strong: '产品页',
        note: '规格参数、工具与勘误表',
      });
    }

    if (!items.length) { host.innerHTML = ''; return; }

    host.innerHTML =
      '<span class="doc-links-label">手册与资料</span>' +
      items.map(it => `
        <a class="doc-link" href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">
          <span class="doc-link-icon">${it.icon}</span>
          <span class="doc-link-body">
            <span class="doc-link-top">${esc(it.label)}<i>${ICON_EXT}</i></span>
            <span class="doc-link-strong">${esc(it.strong)}</span>
            <span class="doc-link-note">${esc(it.note)}</span>
          </span>
        </a>`).join('');
  }

  /* ---------- 详情页初始化 ---------- */
  function initChipPage() {
    if (!$('#pkg') && !$('#tbody')) return;

    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const chip = id ? MCU.get(id) : null;

    if (!chip) {
      const main = $('#chipMain');
      if (main) {
        main.innerHTML = '<div class="empty-state" style="margin-top:40px">'
          + (id ? `未找到芯片 <b>${esc(id)}</b>，可能尚未收录。` : '请从目录页选择一款芯片。')
          + ' <a href="index.html">返回目录</a></div>';
      }
      return;
    }

    renderHero(chip);
    renderPackage(chip);
    renderTable(chip);
    initFilters(chip);
    renderPeriph(chip);
    renderNotes(chip);

    // 目录下拉/返回
    const sel = $('#chipSwitch');
    if (sel) {
      sel.innerHTML = MCU.all().map(c =>
        `<option value="${esc(c.id)}"${c.id === chip.id ? ' selected' : ''}>${esc(c.name)} · ${esc(c.pkg)}</option>`
      ).join('');
      sel.addEventListener('change', () => {
        location.href = `chip.html?id=${encodeURIComponent(sel.value)}`;
      });
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initTheme();
    renderIndex();
    initChipPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 供调试
  MCU._internal = { catClass, afList, AF_LABEL, CAT_LABEL };
})(window);
