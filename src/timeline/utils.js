(() => {
  const DATE_PATTERN = /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/;

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
    const remainingMinutes = Math.ceil(remainingMs / 60_000);
    const days = Math.floor((deadline - startOfToday()) / 86_400_000);

    if (remainingMs < 0) {
      const overdueMinutes = Math.floor(Math.abs(remainingMs) / 60_000);

      if (overdueMinutes < 60) {
        return {
          className: "moodle-deadline-overdue",
          label: `${Math.max(overdueMinutes, 1)}分超過`,
        };
      }

      if (overdueMinutes < 1_440) {
        return {
          className: "moodle-deadline-overdue",
          label: `${Math.floor(overdueMinutes / 60)}時間超過`,
        };
      }

      return {
        className: "moodle-deadline-overdue",
        label: `${Math.floor(overdueMinutes / 1_440)}日超過`,
      };
    }

    if (remainingMinutes <= 60) {
      return {
        className: "moodle-deadline-today",
        label: `残り${Math.max(remainingMinutes, 1)}分`,
      };
    }

    if (remainingMinutes <= 1_440) {
      return {
        className: "moodle-deadline-soon",
        label: `残り${Math.ceil(remainingMinutes / 60)}時間`,
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
