(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      window.RitsMoodleDeadlineColors.decorateTimeline();
    });
  });

  window.RitsMoodleDeadlineColors.decorateTimeline();
  setInterval(() => {
    window.RitsMoodleDeadlineColors.decorateTimeline();
  }, 60_000);
  observer.observe(document.body, { childList: true, subtree: true });
})();
