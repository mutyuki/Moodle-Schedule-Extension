(() => {
  // =========================
  // 初回実行と監視
  // =========================
  window.RitsSyllabusButton.addButtons();

  const observer = new MutationObserver(() => {
    window.RitsSyllabusButton.addButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
