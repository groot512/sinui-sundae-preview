// 주문서: 금액 계산(서버) → 주문 생성(서버) → PG 결제 요청
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('[data-checkout]');
  if (!form) return;
  const pgConfig = JSON.parse(document.getElementById('pg-config').textContent);
  const userInfo = JSON.parse(document.getElementById('checkout-user').textContent);
  const params = new URLSearchParams(location.search);
  const fromBuyNow = params.get('from') === 'buynow';
  let items = [];
  try { items = fromBuyNow ? JSON.parse(sessionStorage.getItem('sh_buynow') || '[]') : Cart.get(); } catch { items = []; }
  sessionStorage.setItem('sh_checkout_from', fromBuyNow ? 'buynow' : 'cart');
  items = items.map((i) => ({ productId: i.id, qty: i.qty }));

  const $ = (sel) => form.querySelector(sel);
  const payBtn = $('[data-pay-btn]');
  const errBox = $('[data-errors]');
  let current = null; // 마지막 견적
  let widgets = null;
  let widgetReady = false;

  function showErrors(list) {
    errBox.hidden = !list?.length;
    errBox.innerHTML = (list || []).map(escapeHtml).join('<br>');
  }

  async function initToss(amount) {
    if (pgConfig.provider !== 'toss' || widgets) return;
    if (typeof TossPayments !== 'function') { showErrors(['결제 모듈을 불러오지 못했습니다. 새로고침 해주세요.']); return; }
    const tp = TossPayments(pgConfig.clientKey);
    widgets = tp.widgets({ customerKey: userInfo?.customerKey || TossPayments.ANONYMOUS });
    await widgets.setAmount({ currency: 'KRW', value: amount });
    await Promise.all([
      widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: pgConfig.paymentVariant }),
      widgets.renderAgreement({ selector: '#agreement', variantKey: pgConfig.agreementVariant }),
    ]);
    widgetReady = true;
  }

  async function refresh() {
    if (!items.length) {
      $('[data-co-items]').innerHTML = '<p>주문할 상품이 없습니다. <a href="/products">상품 보러가기</a></p>';
      payBtn.disabled = true;
      return;
    }
    const r = await api('/api/cart/quote', { items, zipcode: form.zipcode.value });
    current = r;
    $('[data-co-items]').innerHTML = (r.lines || []).map((l) => `
      <div class="co-line"><img src="${escapeHtml(l.thumbnail)}" alt=""><div><strong>${escapeHtml(l.name)}</strong> <small>${escapeHtml(l.weight)}</small><br><span class="muted">${won(l.unitPrice)} × ${l.qty}</span></div><div class="r">${won(l.lineAmount)}</div></div>`).join('');
    form.querySelector('.summary [data-sum-items]').textContent = won(r.itemsAmount);
    form.querySelector('.summary [data-sum-ship]').textContent = r.shippingFee ? won(r.shippingFee) : '무료';
    form.querySelector('.summary [data-sum-total]').textContent = won(r.total);
    showErrors(r.errors);
    payBtn.disabled = !r.ok;
    if (r.ok) {
      if (!widgets) await initToss(r.total).catch((e) => showErrors([`결제 모듈 오류: ${e.message}`]));
      else await widgets.setAmount({ currency: 'KRW', value: r.total });
    }
  }

  // 주소 검색 (카카오 우편번호 서비스)
  const layer = $('[data-postcode-layer]');
  $('[data-find-address]').addEventListener('click', () => {
    if (!window.daum?.Postcode) { toast('주소 검색을 불러오지 못했습니다.'); return; }
    layer.hidden = false;
    new daum.Postcode({
      oncomplete(data) {
        form.zipcode.value = data.zonecode;
        form.addr1.value = data.roadAddress || data.jibunAddress;
        layer.hidden = true;
        form.addr2.focus();
        refresh();
      },
      width: '100%', height: '100%',
    }).embed($('[data-postcode-embed]'));
  });
  $('[data-postcode-close]').addEventListener('click', () => { layer.hidden = true; });

  $('[data-same-orderer]').addEventListener('change', (e) => {
    if (!e.target.checked) return;
    form.recvName.value = form.ordererName.value;
    form.recvPhone.value = form.ordererPhone.value;
  });
  const preset = $('[data-memo-preset]');
  const memoCustom = $('[data-memo-custom]');
  preset.addEventListener('change', () => {
    memoCustom.hidden = preset.value !== '__custom';
    memoCustom.value = preset.value === '__custom' ? '' : preset.value;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pgConfig.provider === 'toss' && !widgetReady) { showErrors(['결제 수단을 불러오는 중입니다. 잠시 후 다시 시도하세요.']); return; }
    payBtn.disabled = true;
    payBtn.textContent = '처리 중…';
    try {
      const fd = new FormData(form);
      const body = Object.fromEntries(fd.entries());
      body.items = items;
      body.memo = memoCustom.value;
      const r = await api('/api/orders', body);
      if (!r.ok) { showErrors(r.errors || ['주문을 생성하지 못했습니다.']); return; }
      if (r.redirect) { location.href = r.redirect; return; }
      // 서버가 계산한 금액으로 결제 (클라이언트 금액 신뢰하지 않음)
      await widgets.setAmount({ currency: 'KRW', value: r.amount });
      await widgets.requestPayment({
        orderId: r.orderId,
        orderName: r.orderName,
        successUrl: r.successUrl,
        failUrl: r.failUrl,
        customerName: r.customer.name,
        customerEmail: r.customer.email,
        customerMobilePhone: String(r.customer.phone || '').replace(/\D/g, ''),
      });
    } catch (err) {
      if (err?.code !== 'USER_CANCEL') showErrors([err?.message || '결제 요청 중 오류가 발생했습니다.']);
    } finally {
      payBtn.disabled = !(current && current.ok);
      payBtn.textContent = '결제하기';
    }
  });

  refresh();
});
