// 공통: 장바구니 저장소, CSRF fetch, 메뉴, 확인창
(function () {
  const KEY = 'sh_cart_v1';
  const Cart = {
    get() {
      try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
    },
    set(items) {
      localStorage.setItem(KEY, JSON.stringify(items.filter((i) => i.qty > 0).slice(0, 50)));
      Cart.render();
    },
    add(id, qty) {
      const items = Cart.get();
      const f = items.find((i) => i.id === id);
      if (f) f.qty = Math.min(99, f.qty + qty); else items.push({ id, qty });
      Cart.set(items);
    },
    update(id, qty) { Cart.set(Cart.get().map((i) => (i.id === id ? { id, qty: Math.max(0, Math.min(99, qty)) } : i))); },
    remove(id) { Cart.set(Cart.get().filter((i) => i.id !== id)); },
    clear() { localStorage.removeItem(KEY); Cart.render(); },
    count() { return Cart.get().reduce((a, i) => a + i.qty, 0); },
    render() {
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        const c = Cart.count();
        el.textContent = c > 99 ? '99+' : String(c);
        el.hidden = c === 0;
      });
    },
  };
  window.Cart = Cart;

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';
  window.api = async function (url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify(body || {}),
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await res.json(); } catch {}
    return Object.assign({ status: res.status }, data);
  };
  window.won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;
  window.escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.toast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2200);
  };

  document.addEventListener('DOMContentLoaded', () => {
    Cart.render();
    const tg = document.querySelector('[data-menu-toggle]');
    tg?.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      tg.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('form[data-confirm]').forEach((f) => {
      f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); });
    });
    // 회원가입 유형 토글
    const sf = document.querySelector('[data-signup]');
    if (sf) {
      const box = sf.querySelector('[data-biz-fields]');
      sf.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', () => {
        box.hidden = sf.querySelector('input[name="type"]:checked').value !== 'business';
      }));
    }
  });
})();
