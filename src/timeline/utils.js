(() => {
  const DATE_PATTERN = /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/;

  const MS_PER_MINUTE = 60_000; // 60 * 1000
  const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000
  const MINUTES_PER_HOUR = 60;
  const MINUTES_PER_DAY = 1440; // 24 * 60

  function parseDate(text) {
    const match = text.match(DATE_PATTERN);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  function parseDateTimeElement(container) {
    const timeElement = container.querySelector("time[datetime]");

    if (!timeElement) {
      return null;
    }

    const date = new Date(timeElement.dateTime);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function getDeadlineState(deadline) {
    const remainingMs = deadline.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / MS_PER_MINUTE);
    const days = Math.floor((deadline - startOfToday()) / MS_PER_DAY);

    if (remainingMs < 0) {
      const overdueMinutes = Math.floor(Math.abs(remainingMs) / MS_PER_MINUTE);

      if (overdueMinutes < MINUTES_PER_HOUR) {
        return {
          className: "moodle-deadline-overdue",
          label: `${Math.max(overdueMinutes, 1)}分超過`,
        };
      }

      if (overdueMinutes < MINUTES_PER_DAY) {
        return {
          className: "moodle-deadline-overdue",
          label: `${Math.floor(overdueMinutes / MINUTES_PER_HOUR)}時間超過`,
        };
      }

      return {
        className: "moodle-deadline-overdue",
        label: `${Math.floor(overdueMinutes / MINUTES_PER_DAY)}日超過`,
      };
    }

    if (remainingMinutes <= MINUTES_PER_HOUR) {
      return {
        className: "moodle-deadline-today",
        label: `残り${Math.max(remainingMinutes, 1)}分`,
      };
    }

    if (remainingMinutes <= MINUTES_PER_DAY) {
      return {
        className: "moodle-deadline-soon",
        label: `残り${Math.ceil(remainingMinutes / MINUTES_PER_HOUR)}時間`,
      };
    }

    if (days <= 7) {
      return { className: "moodle-deadline-week", label: `期限まで${days}日` };
    }

    return { className: "moodle-deadline-later", label: `期限まで${days}日` };
  }

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsMoodleDeadlineColors = window.RitsMoodleDeadlineColors || {};
  window.RitsMoodleDeadlineColors.parseDate = parseDate;
  window.RitsMoodleDeadlineColors.parseDateTimeElement = parseDateTimeElement;
  window.RitsMoodleDeadlineColors.getDeadlineState = getDeadlineState;
})();
