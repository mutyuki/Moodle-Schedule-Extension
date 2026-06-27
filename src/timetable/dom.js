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

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsTimetablePeriodTimes = window.RitsTimetablePeriodTimes || {};
  window.RitsTimetablePeriodTimes.decoratePeriodCells = decoratePeriodCells;
})();
