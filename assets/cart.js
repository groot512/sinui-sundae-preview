document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('[data-cart-items]');
  const sum = document.querySelector('[data-cart-summary]');

  async function load() {
    const items = Cart.get();
    if (!items.length) {
      box.innerHTML = '<div class="empty"><p>장바구니가 비어 있습니다.</p><a class="btn btn-primary" href="/products">상품 보러가기</a></div>';
      sum.hidden = true;
      return;
    }
    const r = await api('/api/cart/quote', { items: items.map((i) => ({ productId: i.id, qty: i.qty })) });
    const lines = r.lines || [];
    // 판매 중지된 상품은 장바구니에서 정리
    const valid = new Set(lines.map((l) => l.productId));
    if (items.some((i) => !valid.has(i.id))) Cart.set(items.filter((i) => valid.has(i.id)));
    box.innerHTML = lines.map((l) => `
      <div class="cart-line" data-id="${l.productId}">
        <a href="product-${escapeHtml(l.slug)}.html" class="cl-img"><img src="${escapeHtml(l.thumbnail)}" alt=""></a>
        <div class="cl-info">
          <a href="product-${escapeHtml(l.slug)}.html" class="cl-name">${escapeHtml(l.name)} <small>${escapeHtml(l.weight)}</small></a>
          <div class="cl-price">${won(l.unitPrice)}${l.unitPrice < l.retailPrice ? ' <span class="tag-wholesale">사업자가</span>' : ''}</div>
        </div>
        <div class="qty small">
          <button type="button" data-minus aria-label="수량 줄이기">−</button>
          <input type="number" value="${l.qty}" min="1" max="99" aria-label="수량" data-qty>
          <button type="button" data-plus aria-label="수량 늘리기">+</button>
        </div>
        <div class="cl-amount">${won(l.lineAmount)}</div>
        <button type="button" class="cl-remove" data-remove aria-label="삭제">×</button>
      </div>`).join('') +
      (r.errors?.length ? `<div class="flash flash-error">${r.errors.map(escapeHtml).join('<br>')}</div>` : '');
    sum.hidden = !lines.length;
    sum.querySelector('[data-sum-items]').textContent = won(r.itemsAmount);
    sum.querySelector('[data-sum-ship]').textContent = r.shippingFee ? won(r.shippingFee) : '무료';
    sum.querySelector('[data-sum-total]').textContent = won(r.total);
    const hint = sum.querySelector('[data-free-hint]');
    hint.textContent = r.freeThreshold && r.itemsAmount < r.freeThreshold ? `${won(r.freeThreshold - r.itemsAmount)} 더 담으면 무료배송` : '';
    const go = sum.querySelector('[data-go-checkout]');
    go.classList.toggle('disabled', !r.ok);
    go.onclick = (e) => { if (!r.ok) { e.preventDefault(); toast(r.errors?.[0] || '주문할 수 없는 상품이 있습니다.'); } };
  }

  box.addEventListener('click', (e) => {
    const line = e.target.closest('.cart-line');
    if (!line) return;
    const id = Number(line.dataset.id);
    const cur = Number(line.querySelector('[data-qty]').value) || 1;
    if (e.target.closest('[data-remove]')) Cart.remove(id);
    else if (e.target.closest('[data-minus]')) Cart.update(id, Math.max(1, cur - 1));
    else if (e.target.closest('[data-plus]')) Cart.update(id, cur + 1);
    else return;
    load();
  });
  box.addEventListener('change', (e) => {
    const line = e.target.closest('.cart-line');
    if (!line || !e.target.matches('[data-qty]')) return;
    Cart.update(Number(line.dataset.id), Math.max(1, parseInt(e.target.value, 10) || 1));
    load();
  });
  load();
});
