(() => {
  function initLayout() {
    let mainGrid = document.getElementById("rits-main-grid");
    let leftCol = document.getElementById("rits-left-col");
    let rightCol = document.getElementById("rits-right-col");
    const announcePanel = document.getElementById("rits-announce-panel");
    const timetableBlock = document.querySelector(
      '[data-block="rutime_table"], .block_rutime_table',
    );
    const timelineBlock = document.querySelector(
      '[data-block="timeline"], .block_timeline, .block-timeline',
    );

    // すでにカスタムレイアウトの構築が完全に終わっている場合は即座にスキップ（負荷削減）
    if (
      mainGrid &&
      leftCol &&
      rightCol &&
      announcePanel &&
      timetableBlock &&
      timelineBlock &&
      timelineBlock.parentNode === leftCol &&
      announcePanel.parentNode === leftCol &&
      timetableBlock.parentNode === rightCol &&
      timetableBlock.querySelector(".rits-timetable-header-wrap")
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

      let announcePanel = document.getElementById("rits-announce-panel");
      if (!announcePanel) {
        announcePanel = createAnnouncePanel();
        leftCol.appendChild(announcePanel);

        const refreshBtn = announcePanel.querySelector("#rits-refresh-btn");
        if (refreshBtn) {
          refreshBtn.addEventListener("click", () => {
            sessionStorage.removeItem("rits_announce_cache");
            window.RitsUnreadAnnouncementList.loadUnreadAnnouncements();
          });
        }

        window.RitsUnreadAnnouncementList.loadUnreadAnnouncements();
      } else if (announcePanel.parentNode !== leftCol) {
        leftCol.appendChild(announcePanel);
      }

      if (timetableBlock.parentNode !== rightCol) {
        rightCol.appendChild(timetableBlock);
      }

      wrapTimetableIcons(timetableBlock);
      cleanClassroomLabels(timetableBlock);
      adjustTimetableHeader(timetableBlock);
    }
  }

  function adjustTimetableHeader(timetableBlock) {
    const titleEl = timetableBlock.querySelector(".card-title, h3, h5, h6");
    if (titleEl?.textContent.includes("My時間割表")) {
      titleEl.textContent = "時間割表";
    }

    const legend = timetableBlock.querySelector(".timetable-legend");
    const cardBody = timetableBlock.querySelector(".card-body");
    if (legend && titleEl && cardBody) {
      let headerWrap = timetableBlock.querySelector(".rits-timetable-header-wrap");
      if (!headerWrap) {
        headerWrap = document.createElement("div");
        headerWrap.className = "rits-timetable-header-wrap";
        titleEl.parentNode.insertBefore(headerWrap, titleEl);
      }
      if (titleEl.parentNode !== headerWrap) {
        headerWrap.appendChild(titleEl);
      }
      if (legend.parentNode !== headerWrap) {
        headerWrap.appendChild(legend);
      }
    }
  }

  function createAnnouncePanel() {
    const panel = document.createElement("div");
    panel.id = "rits-announce-panel";
    panel.innerHTML =
      '<div class="rits-panel-header">' +
      "<h3>未読アナウンス</h3>" +
      '<button class="rits-refresh-btn" id="rits-refresh-btn">更新</button>' +
      "</div>" +
      '<div class="rits-panel-body">' +
      '<div class="rits-loading"><span class="rits-loading-spinner"></span>読み込み中...</div>' +
      "</div>";
    return panel;
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

  window.RitsUnreadAnnouncementList = window.RitsUnreadAnnouncementList || {};
  window.RitsUnreadAnnouncementList.initLayout = initLayout;
})();
