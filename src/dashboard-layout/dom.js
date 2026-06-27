(() => {
  const TIMELINE_SELECTORS = ['[data-block="timeline"]', ".block_timeline", ".block-timeline"];
  const TIMETABLE_SELECTORS = ['[data-block="rutime_table"]', ".block_rutime_table"];

  function initLayout() {
    let mainGrid = document.getElementById("rits-main-grid");
    let leftCol = document.getElementById("rits-left-col");
    let rightCol = document.getElementById("rits-right-col");
    let announcePanel = document.getElementById("rits-announce-panel");

    const timetableBlock = document.querySelector(TIMETABLE_SELECTORS.join(","));
    const timelineBlock = document.querySelector(TIMELINE_SELECTORS.join(","));

    // すでにカスタムレイアウトの構築が完全に終わっている場合は即座にスキップ
    if (
      mainGrid &&
      leftCol &&
      rightCol &&
      announcePanel &&
      timetableBlock &&
      timelineBlock &&
      timelineBlock.parentNode === leftCol &&
      announcePanel.parentNode === leftCol &&
      timetableBlock.parentNode === rightCol
    ) {
      return;
    }

    if (timetableBlock && timelineBlock) {
      const contentRegion = document.querySelector('[data-blockregion="content"]');
      if (!contentRegion) return;

      if (!mainGrid) {
        mainGrid = document.createElement("div");
        mainGrid.id = "rits-main-grid";
        timetableBlock.parentNode.insertBefore(mainGrid, timetableBlock);
      }

      if (!leftCol) {
        leftCol = document.createElement("div");
        leftCol.id = "rits-left-col";
        mainGrid.appendChild(leftCol);
      }

      if (!rightCol) {
        rightCol = document.createElement("div");
        rightCol.id = "rits-right-col";
        mainGrid.appendChild(rightCol);
      }

      if (timelineBlock.parentNode !== leftCol) {
        leftCol.appendChild(timelineBlock);
      }

      if (!announcePanel) {
        if (window.RitsUnreadAnnouncementList?.createAnnouncePanel) {
          announcePanel = window.RitsUnreadAnnouncementList.createAnnouncePanel();
          leftCol.appendChild(announcePanel);

          const refreshBtn = announcePanel.querySelector("#rits-refresh-btn");
          if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
              sessionStorage.removeItem("rits_announce_cache");
              window.RitsUnreadAnnouncementList.loadUnreadAnnouncements();
            });
          }

          window.RitsUnreadAnnouncementList.loadUnreadAnnouncements();
        }
      } else if (announcePanel.parentNode !== leftCol) {
        leftCol.appendChild(announcePanel);
      }

      if (timetableBlock.parentNode !== rightCol) {
        rightCol.appendChild(timetableBlock);
      }
    }
  }

  window.RitsDashboardLayout = window.RitsDashboardLayout || {};
  window.RitsDashboardLayout.initLayout = initLayout;
})();
