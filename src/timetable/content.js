(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      window.RitsTimetablePeriodTimes.decorateTimetable();
    });
  });

  window.RitsTimetablePeriodTimes.decorateTimetable();
  observer.observe(document.body, { childList: true, subtree: true });
})();
