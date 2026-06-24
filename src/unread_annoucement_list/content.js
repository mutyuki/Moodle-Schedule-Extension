(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  function initLayout() {
    const timetableBlock = document.querySelector(
      '[data-block="rutime_table"], .block_rutime_table',
    );
    const timelineBlock = document.querySelector(
      '[data-block="timeline"], .block_timeline, .block-timeline',
    );

    if (timetableBlock && timelineBlock) {
      const contentRegion = document.querySelector('[data-blockregion="content"]');
      if (!contentRegion) return;

      let mainGrid = document.getElementById("rits-main-grid");
      if (!mainGrid) {
        mainGrid = document.createElement("div");
        mainGrid.id = "rits-main-grid";
        timetableBlock.parentNode.insertBefore(mainGrid, timetableBlock);
      }

      if (timelineBlock.parentNode !== mainGrid) {
        mainGrid.appendChild(timelineBlock);
      }
      if (timetableBlock.parentNode !== mainGrid) {
        mainGrid.appendChild(timetableBlock);
      }

      wrapTimetableIcons(timetableBlock);
      cleanClassroomLabels(timetableBlock);
    }
  }

  function wrapTimetableIcons(timetableBlock) {
    const subjects = timetableBlock.querySelectorAll(".subject");
    for (const subject of subjects) {
      if (subject.querySelector(".rits-icons-container")) continue;

      const spans = Array.from(subject.querySelectorAll("span.on, span.off"));
      if (spans.length === 0) continue;

      const container = document.createElement("div");
      container.className = "rits-icons-container";

      const firstSpan = spans[0];
      firstSpan.parentNode.insertBefore(container, firstSpan);

      for (const span of spans) {
        container.appendChild(span);
      }

      const brs = subject.querySelectorAll("br");
      for (const br of brs) {
        br.remove();
      }
    }
  }

  function cleanClassroomLabels(timetableBlock) {
    const rooms = timetableBlock.querySelectorAll(".subject .room:not([data-room-cleaned])");
    for (const room of rooms) {
      const text = room.textContent.trim();
      const cleaned = text.replace(/^[月火水木金土日]\d+[:：]\s*/, "");
      room.textContent = cleaned;
      room.setAttribute("data-room-cleaned", "true");
    }
  }

  // Moodleの非同期描画に対応するためのMutationObserver
  const observer = new MutationObserver(() => {
    initLayout();
  });

  // 初回実行と監視開始
  initLayout();
  observer.observe(document.body, { childList: true, subtree: true });
})();
