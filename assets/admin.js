document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); });
  });
  const all = document.querySelector('[data-check-all]');
  all?.addEventListener('change', () => {
    document.querySelectorAll('input[name="ids"]').forEach((c) => { c.checked = all.checked; });
  });
});
