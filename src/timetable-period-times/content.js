(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  const STYLE_ID = "rits-timetable-period-times-style";
  const PERIOD_TIMES = {
    1: ["9:00", "10:35"],
    2: ["10:45", "12:20"],
    3: ["13:10", "14:45"],
    4: ["14:55", "16:30"],
    5: ["16:40", "18:15"],
    6: ["18:25", "20:00"],
    7: ["20:10", "21:45"],
  };

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .block_rutime_table table.timetable td.time,
        .block_rutime_table table.timetable th:first-child {
          width: 48px !important;
          min-width: 48px !important;
          max-width: 48px !important;
          padding-left: 2px !important;
          padding-right: 2px !important;
        }

        .block_rutime_table table.timetable td.time .rits-period-time-label {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 1px !important;
          line-height: 1 !important;
          white-space: nowrap !important;
        }

        .block_rutime_table table.timetable td.time .rits-period-number {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #475569 !important;
          margin-bottom: 2px !important;
        }

        .block_rutime_table table.timetable td.time .rits-period-clock {
          font-size: 10px !important;
          font-weight: 700 !important;
          color: #64748b !important;
          letter-spacing: 0 !important;
        }

        .block_rutime_table table.timetable td.time .rits-period-separator {
          width: 2px !important;
          height: 10px !important;
          background: #64748b !important;
          border-radius: 999px !important;
          margin: 1px 0 !important;
        }
      `;
    document.head.appendChild(style);
  }

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

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decoratePeriodCells();
    });
  });

  addStyles();
  decoratePeriodCells();
  observer.observe(document.body, { childList: true, subtree: true });
})();
