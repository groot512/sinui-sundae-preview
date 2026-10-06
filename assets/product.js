document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-buy-form]');
  document.querySelectorAll('[data-thumb]').forEach((b) => b.addEventListener('click', () => {
    document.querySelector('[data-main-img]').src = b.dataset.thumb;
    document.querySelectorAll('[data-thumb]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  if (!form) return;
  const id = Number(form.dataset.productId);
  const unit = Number(form.dataset.unitPrice);
  const input = form.querySelector('input[name="qty"]');
  const max = Number(input.max) || 99;
  const total = form.querySelector('[data-total]');
  const qty = () => Math.max(1, Math.min(max, parseInt(input.value, 10) || 1));
  const sync = () => { input.value = qty(); total.textContent = won(unit * qty()); };
  form.querySelector('[data-qty-minus]').addEventListener('click', () => { input.value = qty() - 1; sync(); });
  form.querySelector('[data-qty-plus]').addEventListener('click', () => { input.value = qty() + 1; sync(); });
  input.addEventListener('change', sync);
  form.querySelector('[data-add-cart]').addEventListener('click', () => {
    Cart.add(id, qty());
    toast('장바구니에 담았습니다.');
  });
  form.querySelector('[data-buy-now]').addEventListener('click', () => {
    sessionStorage.setItem('sh_buynow', JSON.stringify([{ id, qty: qty() }]));
    location.href = 'checkout.html?from=buynow';
  });
});
