(() => {
  const PERIOD_TIMES = {
    1: ["9:00", "10:35"],
    2: ["10:45", "12:20"],
    3: ["13:10", "14:45"],
    4: ["14:55", "16:30"],
    5: ["16:40", "18:15"],
    6: ["18:25", "20:00"],
    7: ["20:10", "21:45"],
  };

  function decoratePeriodCells() {
    const cells = document.querySelectorAll(
      '[data-block="rutime_table"] table.timetable td.time, .block_rutime_table table.timetable td.time',
    );

    for (const cell of cells) {
      if (cell.dataset.periodTimeDecorated === "true") continue;

      const periodMatch = cell.textContent.trim().match(/\d+/);
      if (!periodMatch) continue;

      const period = Number(periodMatch[0]);
      const times = PERIOD_TIMES[period];
      if (!times) continue;

      cell.textContent = "";

      const wrapper = document.createElement("div");
      wrapper.className = "rits-period-time-label";

      const number = document.createElement("span");
      number.className = "rits-period-number";
      number.textContent = String(period);

      const start = document.createElement("span");
      start.className = "rits-period-clock";
      start.textContent = times[0];

      const separator = document.createElement("span");
      separator.className = "rits-period-separator";
      separator.setAttribute("aria-hidden", "true");

      const end = document.createElement("span");
      end.className = "rits-period-clock";
      end.textContent = times[1];

      wrapper.append(number, start, separator, end);
      cell.appendChild(wrapper);
      cell.dataset.periodTimeDecorated = "true";
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

  function decorateTimetable() {
    const timetableBlock = document.querySelector(
      '[data-block="rutime_table"], .block_rutime_table',
    );
    if (!timetableBlock) return;

    decoratePeriodCells();
    wrapTimetableIcons(timetableBlock);
    cleanClassroomLabels(timetableBlock);
    adjustTimetableHeader(timetableBlock);
  }

  window.RitsTimetablePeriodTimes = window.RitsTimetablePeriodTimes || {};
  window.RitsTimetablePeriodTimes.decoratePeriodCells = decoratePeriodCells;
  window.RitsTimetablePeriodTimes.decorateTimetable = decorateTimetable;
})();
