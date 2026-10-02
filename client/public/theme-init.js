// Apply the saved preference before the first paint on every prerendered page.
(() => {
  let theme = 'light';
  try {
    if (localStorage.getItem('bloomollo-theme') === 'dark') theme = 'dark';
  } catch { /* Storage can be disabled; the toggle still works for this visit. */ }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#090a09');
})();