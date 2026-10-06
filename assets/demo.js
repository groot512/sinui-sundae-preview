// 정적 데모 전용 런타임 (export-static.js 가 {"products":[{"id":1,"slug":"gogi-chal-sundae","name":"고기찰순대","thumbnail":"assets/products__v2__gogi-chal-sundae__thumb.jpg","weight_label":"2kg","price":19800,"list_price":0,"wholesale_price":15000,"status":"active","stock":98},{"id":2,"slug":"traditional-sundae","name":"전통순대","thumbnail":"assets/products__v2__traditional-sundae__thumb.jpg","weight_label":"2kg","price":19800,"list_price":0,"wholesale_price":15000,"status":"active","stock":99},{"id":3,"slug":"makchang-sundae","name":"막창순대","thumbnail":"assets/products__v2__makchang-sundae__thumb.jpg","weight_label":"2kg","price":25800,"list_price":0,"wholesale_price":19500,"status":"active","stock":99},{"id":4,"slug":"mandu-sundae","name":"만두순대","thumbnail":"assets/products__v2__mandu-sundae__thumb.jpg","weight_label":"2kg","price":21800,"list_price":0,"wholesale_price":16500,"status":"active","stock":97},{"id":5,"slug":"sundae-bokkeum-sauce","name":"순대볶음소스","thumbnail":"assets/products__placeholder.svg","weight_label":"2kg","price":15000,"list_price":0,"wholesale_price":11000,"status":"hidden","stock":50},{"id":6,"slug":"nude-sundae","name":"누드순대","thumbnail":"assets/products__v2__nude-sundae__thumb.jpg","weight_label":"","price":0,"list_price":0,"wholesale_price":0,"status":"coming","stock":0}],"settings":{"site_name":"신의한순대","site_slogan":"신의 한 수, 맛의 깊이를 더하다","site_description":"1997년부터 이어온 다윗식품의 순대. HACCP 인증 시설에서 정직하게 만듭니다.","logo_url":"/static/img/logo.png","logo_light_url":"/static/img/logo-light.png","biz_company":"다윗식품","biz_ceo":"신흥훈","biz_no":"542-05-03340","biz_info_url":"","biz_ecommerce_no":"","biz_address":"경상북도 청도군 월곡1길 29","biz_phone":"054-372-2325","biz_email":"huny4097@naver.com","biz_privacy_officer":"신흥훈","biz_hosting":"","cs_hours":"평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00, 주말·공휴일 휴무)","shipping_fee":"4500","free_shipping_threshold":"50000","remote_policy":"block","remote_surcharge":"5000","remote_zip_ranges":"63000-63644,40200-40240","shipping_notice":"냉동 상품은 아이스박스+아이스팩으로 포장해 발송합니다. 평일(월~목) 오후 1시 이전 결제 건은 당일 출고, 이후 결제 건은 다음 영업일 출고됩니다. 금요일·주말 주문은 신선도 유지를 위해 다음 주 월요일에 출고됩니다. 제주·도서산간 지역은 냉동 배송 품질 보장이 어려워 주문이 제한됩니다.","return_notice":"식품 특성상 단순 변심에 의한 교환·반품은 불가합니다. 상품 하자·오배송·배송 중 해동 등 문제가 있는 경우 수령일로부터 7일 이내 사진과 함께 고객센터로 연락 주시면 교환 또는 환불해 드립니다.","wholesale_notice":"사업자 회원은 관리자 승인 후 도매가가 적용됩니다."}} 를 채워 assets/demo.js 로 출력)
// - 장바구니/주문서 금액을 브라우저에서 계산
// - 관리자 화면의 가격·재고·상태, 사업자 정보 수정을 이 브라우저(localStorage)에 저장해 쇼핑몰 화면에 반영
// - 그 외 주문·결제·로그인 등 POST 는 차단
(function () {
  const D = __DEMO_DATA__;
  const KEY = 'sh_demo_overrides_v1';
  const BLOCK_MSG = '데모 미리보기에서는 주문·결제·로그인이 동작하지 않습니다.';
  const SAVED_MSG = '저장했습니다. (데모: 이 브라우저에만 저장됩니다)';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { products: {}, settings: {} }; } catch { return { products: {}, settings: {} }; } };
  const store = (o) => localStorage.setItem(KEY, JSON.stringify(o));
  const int = (v, d = 0) => { const n = parseInt(String(v ?? '').replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : d; };
  const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m) => {
    if (window.toast) return window.toast(m);
    let t = document.getElementById('demo-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'demo-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#10283F;color:#fff;padding:12px 20px;border-radius:999px;z-index:9999;font:600 14px Pretendard,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.2)';
      document.body.appendChild(t);
    }
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, 2600);
  };

  function product(id) {
    const base = D.products.find((p) => p.id === Number(id));
    if (!base) return null;
    return { ...base, ...(load().products[base.id] || {}) };
  }
  function settings() { return { ...D.settings, ...load().settings }; }

  // ---------- 금액 계산 ----------
  function inRemote(zip) {
    const z = parseInt(String(zip || '').replace(/\D/g, ''), 10);
    if (!z) return false;
    return String(settings().remote_zip_ranges || '').split(',').some((r) => { const [a, b] = r.split('-').map(Number); return z >= a && z <= (b || a); });
  }
  function quote(items, zipcode) {
    const errors = []; const lines = [];
    for (const it of items || []) {
      const p = product(it.productId || it.id);
      const qty = Math.min(99, Math.max(0, Number(it.qty) || 0));
      if (!p || !qty) continue;
      if (p.status !== 'active' || p.price <= 0) { errors.push(`${p.name}: 현재 구매할 수 없는 상품입니다.`); continue; }
      if (p.stock < qty) { errors.push(`${p.name}: 재고가 부족합니다. (남은 수량 ${p.stock}개)`); continue; }
      lines.push({ productId: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, weight: p.weight_label, unitPrice: p.price, retailPrice: p.price, qty, lineAmount: p.price * qty });
    }
    const s = settings();
    const fee = int(s.shipping_fee); const threshold = int(s.free_shipping_threshold);
    const itemsAmount = lines.reduce((a, l) => a + l.lineAmount, 0);
    let shippingFee = itemsAmount === 0 ? 0 : (threshold > 0 && itemsAmount >= threshold ? 0 : fee);
    if (zipcode && inRemote(zipcode)) {
      if (s.remote_policy === 'block') errors.push('제주·도서산간 지역은 냉동 배송 품질 문제로 주문이 제한됩니다.');
      else shippingFee += int(s.remote_surcharge);
    }
    return { ok: !errors.length && lines.length > 0, lines, itemsAmount, shippingFee, total: itemsAmount + shippingFee, tier: 'retail', errors, freeThreshold: threshold };
  }
  window.api = async function (url, body) {
    if (url === '/api/cart/quote') return quote(body.items, body.zipcode);
    if (url === '/api/orders') { const qt = quote(body.items, body.zipcode); return { ok: false, errors: qt.ok ? [BLOCK_MSG] : qt.errors }; }
    return { ok: false, errors: [BLOCK_MSG] };
  };

  // ---------- 화면 반영 ----------
  function priceHtml(p) {
    if (p.status === 'coming' || p.price <= 0) return '<span class="price muted">가격 준비중</span>';
    return (p.list_price > p.price ? `<span class="price-list">${won(p.list_price)}</span> ` : '') + `<span class="price">${won(p.price)}</span>`;
  }
  function applyShop() {
    document.querySelectorAll('[data-price-pid]').forEach((el) => { const p = product(el.dataset.pricePid); if (p) el.innerHTML = priceHtml(p); });
    const f = document.querySelector('[data-buy-form]');
    if (f) {
      const p = product(f.dataset.productId);
      if (p) {
        f.dataset.unitPrice = String(p.price);
        const t = f.querySelector('[data-total]'); if (t) t.textContent = won(p.price);
        const qi = f.querySelector('input[name="qty"]'); if (qi) qi.max = String(Math.min(99, p.stock));
      }
    }
    const s = settings();
    document.querySelectorAll('[data-s]').forEach((el) => { const v = s[el.dataset.s]; el.textContent = v || el.dataset.empty || ''; });
    document.querySelectorAll('[data-biz-link]').forEach((a) => {
      a.href = /^https?:\/\//i.test(s.biz_info_url || '') ? s.biz_info_url : `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${String(s.biz_no || '').replace(/\D/g, '')}`;
    });
  }
  function applyAdmin() {
    const bulk = document.querySelector('[data-demo-form="products-bulk"]');
    if (bulk) {
      bulk.querySelectorAll('input[name="ids"]').forEach((h) => {
        const p = product(h.value); if (!p) return;
        const set = (n, v) => { const el = bulk.querySelector(`[name="${n}_${p.id}"]`); if (el) el.value = v; };
        set('price', p.price); set('list_price', p.list_price || ''); set('wholesale_price', p.wholesale_price || ''); set('stock', p.stock); set('status', p.status);
      });
    }
    const pf = document.querySelector('[data-demo-form="product"]');
    if (pf && pf.dataset.id) {
      const p = product(pf.dataset.id);
      if (p) for (const k of ['price', 'list_price', 'wholesale_price', 'stock', 'status']) { const el = pf.querySelector(`[name="${k}"]`); if (el) el.value = k === 'list_price' || k === 'wholesale_price' ? (p[k] || '') : p[k]; }
    }
    const sf = document.querySelector('[data-demo-form="settings"]');
    if (sf) { const s = settings(); for (const k of Object.keys(D.settings)) { const el = sf.querySelector(`[name="${k}"]`); if (el) el.value = s[k] ?? ''; } }
  }
  function addResetButton() {
    const o = load();
    if (!Object.keys(o.products).length && !Object.keys(o.settings).length) return;
    const bar = document.getElementById('demo-bar'); if (!bar || bar.querySelector('button')) return;
    const b = document.createElement('button');
    b.textContent = '데모 수정값 초기화';
    b.style.cssText = 'margin-left:10px;background:#fff;color:#842D2F;border:0;border-radius:999px;padding:2px 10px;font:600 12px Pretendard,sans-serif;cursor:pointer';
    b.onclick = () => { localStorage.removeItem(KEY); location.reload(); };
    bar.appendChild(b);
  }

  // ---------- 폼 처리 ----------
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('[data-checkout]')) return; // 주문서는 api() 경유 안내
    const kind = f.dataset.demoForm;
    const method = (f.getAttribute('method') || '').toLowerCase();
    if (!kind && method !== 'post') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const fd = new FormData(f);
    const o = load();
    if (kind === 'products-bulk') {
      const errs = [];
      for (const id of fd.getAll('ids')) {
        const cur = product(id); if (!cur) continue;
        const next = {
          price: Math.max(0, int(fd.get(`price_${id}`), cur.price)), list_price: Math.max(0, int(fd.get(`list_price_${id}`), 0)),
          wholesale_price: Math.max(0, int(fd.get(`wholesale_price_${id}`), 0)), stock: Math.max(0, int(fd.get(`stock_${id}`), cur.stock)),
          status: fd.get(`status_${id}`) || cur.status,
        };
        if (next.status === 'active' && next.price <= 0) { errs.push(`${cur.name}: 판매중 상품은 판매가가 필요합니다.`); continue; }
        o.products[id] = { ...(o.products[id] || {}), ...next };
      }
      store(o); applyAdmin(); addResetButton();
      return toast(errs.length ? errs.join(' / ') : SAVED_MSG);
    }
    if (kind === 'product' && f.dataset.id) {
      const id = f.dataset.id; const cur = product(id);
      const next = {
        price: Math.max(0, int(fd.get('price'), cur.price)), list_price: Math.max(0, int(fd.get('list_price'), 0)),
        wholesale_price: Math.max(0, int(fd.get('wholesale_price'), 0)), stock: Math.max(0, int(fd.get('stock'), cur.stock)), status: fd.get('status') || cur.status,
      };
      if (next.status === 'active' && next.price <= 0) return toast('판매중 상품은 판매가가 필요합니다.');
      o.products[id] = { ...(o.products[id] || {}), ...next };
      store(o); addResetButton();
      return toast(SAVED_MSG + ' 이미지·상품정보고시 수정은 실제 서버에서만 됩니다.');
    }
    if (kind === 'settings') {
      for (const k of Object.keys(D.settings)) {
        if (!fd.has(k)) continue;
        const v = String(fd.get(k) || '').trim();
        if (k === 'biz_info_url' && v && !/^https?:\/\//i.test(v)) { toast('[사업자정보확인] 링크는 http:// 또는 https:// 로 시작해야 합니다.'); continue; }
        o.settings[k] = v;
      }
      store(o); applyShop(); addResetButton();
      return toast(SAVED_MSG + ' 쇼핑몰 하단 사업자 정보에 반영됩니다.');
    }
    toast(BLOCK_MSG);
  }, true);

  document.addEventListener('DOMContentLoaded', () => { applyShop(); applyAdmin(); addResetButton(); });
})();
