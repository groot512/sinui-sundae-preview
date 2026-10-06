// 정적 데모 전용: 서버 API 대신 브라우저에서 계산
(function () {
  const D = {"products":[{"id":1,"slug":"gogi-chal-sundae","name":"고기찰순대","thumbnail":"assets/products__v2__gogi-chal-sundae__thumb.jpg","weight_label":"2kg","price":19800,"status":"active","stock":98},{"id":2,"slug":"traditional-sundae","name":"전통순대","thumbnail":"assets/products__v2__traditional-sundae__thumb.jpg","weight_label":"2kg","price":19800,"status":"active","stock":99},{"id":3,"slug":"makchang-sundae","name":"막창순대","thumbnail":"assets/products__v2__makchang-sundae__thumb.jpg","weight_label":"2kg","price":25800,"status":"active","stock":99},{"id":4,"slug":"mandu-sundae","name":"만두순대","thumbnail":"assets/products__v2__mandu-sundae__thumb.jpg","weight_label":"2kg","price":21800,"status":"active","stock":97},{"id":5,"slug":"sundae-bokkeum-sauce","name":"순대볶음소스","thumbnail":"assets/products__placeholder.svg","weight_label":"2kg","price":15000,"status":"hidden","stock":50},{"id":6,"slug":"nude-sundae","name":"누드순대","thumbnail":"assets/products__v2__nude-sundae__thumb.jpg","weight_label":"","price":0,"status":"coming","stock":0}],"shippingFee":4500,"freeThreshold":50000,"remoteRanges":"63000-63644,40200-40240","remotePolicy":"block","remoteSurcharge":5000};
  const msg = '데모 미리보기에서는 주문·결제·로그인·저장이 동작하지 않습니다.';
  function inRemote(zip) {
    const z = parseInt(String(zip || '').replace(/\D/g, ''), 10);
    if (!z) return false;
    return D.remoteRanges.split(',').some((r) => { const [a, b] = r.split('-').map(Number); return z >= a && z <= (b || a); });
  }
  function quote(items, zipcode) {
    const errors = []; const lines = [];
    for (const it of items || []) {
      const p = D.products.find((x) => x.id === Number(it.productId || it.id));
      const qty = Math.min(99, Math.max(0, Number(it.qty) || 0));
      if (!p || !qty) continue;
      if (p.status !== 'active' || p.price <= 0) { errors.push(p.name + ': 현재 구매할 수 없는 상품입니다.'); continue; }
      lines.push({ productId: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, weight: p.weight_label, unitPrice: p.price, retailPrice: p.price, qty, lineAmount: p.price * qty });
    }
    const itemsAmount = lines.reduce((a, l) => a + l.lineAmount, 0);
    let shippingFee = itemsAmount === 0 ? 0 : (D.freeThreshold > 0 && itemsAmount >= D.freeThreshold ? 0 : D.shippingFee);
    if (zipcode && inRemote(zipcode)) {
      if (D.remotePolicy === 'block') errors.push('제주·도서산간 지역은 냉동 배송 품질 문제로 주문이 제한됩니다.');
      else shippingFee += D.remoteSurcharge;
    }
    return { ok: !errors.length && lines.length > 0, lines, itemsAmount, shippingFee, total: itemsAmount + shippingFee, tier: 'retail', errors, freeThreshold: D.freeThreshold };
  }
  window.api = async function (url, body) {
    if (url === '/api/cart/quote') return quote(body.items, body.zipcode);
    if (url === '/api/orders') { const qt = quote(body.items, body.zipcode); return { ok: false, errors: qt.ok ? [msg] : qt.errors }; }
    return { ok: false, errors: [msg] };
  };
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('[data-checkout]')) return; // 주문서는 api() 경유로 안내
    if ((f.getAttribute('method') || '').toLowerCase() === 'post') { e.preventDefault(); e.stopImmediatePropagation(); (window.toast || alert)(msg); }
  }, true);
})();
