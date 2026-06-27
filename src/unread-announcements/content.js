(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  // Moodleの非同期描画に対応するためのMutationObserver (リサイズや連続DOM変化時の負荷を防ぐため防振処理を追加)
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      window.RitsUnreadAnnouncementList.initLayout();
    });
  });

  window.RitsUnreadAnnouncementList.initLayout();
  observer.observe(document.body, { childList: true, subtree: true });
})();
