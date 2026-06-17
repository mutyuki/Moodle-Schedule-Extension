// ==UserScript==
// @name         Moodle+R タイムライン期限表示
// @namespace    local.moodle.deadline-colors
// @version      1.2.0
// @description  Moodle+Rのタイムラインを期限までの日数で色分けします。
// @match        https://lms.ritsumei.ac.jp/my/*
// @grant        none
// ==/UserScript==

(() => {
  const STYLE_ID = "moodle-deadline-colors-style";
  const DATE_PATTERN = /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/;
  const TIME_PATTERN = /(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/;
  const TIMELINE_SELECTORS = [
    ".block_timeline",
    '[data-block="timeline"]',
    '[data-region="timeline"]',
  ];
  const EVENT_SELECTORS = [
    '[data-region="event-list-item"]',
    ".event-list-item",
    ".list-group-item",
  ];

  function addStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .moodle-deadline-event {
        border-left: 6px solid var(--deadline-color) !important;
        border-radius: 6px !important;
        background: color-mix(in srgb, var(--deadline-color) 10%, white) !important;
        padding-left: 10px !important;
      }

      .moodle-deadline-badge {
        display: inline-block;
        flex-shrink: 0;
        margin-left: 8px;
        border-radius: 999px;
        background: var(--deadline-color);
        color: white;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        padding: 5px 8px;
        vertical-align: middle;
      }

      .moodle-deadline-event .text-truncate,
      .moodle-deadline-event [data-region="event-name"],
      .moodle-deadline-event .eventname,
      .moodle-deadline-event h3,
      .moodle-deadline-event h4,
      .moodle-deadline-event h5,
      .moodle-deadline-event h6,
      .moodle-deadline-event a {
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        word-break: break-word !important;
      }

      .moodle-deadline-overdue { --deadline-color: #b3261e; }
      .moodle-deadline-today { --deadline-color: #d93025; }
      .moodle-deadline-soon { --deadline-color: #d93025; }
      .moodle-deadline-week { --deadline-color: #d6a700; }
      .moodle-deadline-later { --deadline-color: #137333; }
      .moodle-deadline-unknown { --deadline-color: #6c757d; }
    `;
    document.head.append(style);
  }

  function parseDate(text) {
    const match = text.match(DATE_PATTERN);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  function parseTime(text) {
    const match = text.match(TIME_PATTERN);

    if (!match) {
      return null;
    }

    const [, hour, minute] = match;
    return { hour: Number(hour), minute: Number(minute) };
  }

  function combineDateAndTime(date, time) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time?.hour ?? 23,
      time?.minute ?? 59,
    );
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
    const days = Math.round((deadline - startOfToday()) / 86_400_000);

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

  function findTimeline() {
    return document.querySelector(TIMELINE_SELECTORS.join(","));
  }

  function findEvents(container) {
    const found = new Set();

    for (const selector of EVENT_SELECTORS) {
      for (const event of container.querySelectorAll(selector)) {
        if (event.querySelector('a[href*="/mod/"], a[href*="/calendar/view.php"]')) {
          found.add(event);
        }
      }
    }

    for (const link of container.querySelectorAll('a[href*="/mod/"]')) {
      const event = link.closest(
        '[data-region="event-list-item"], .event-list-item, .list-group-item',
      );
      if (event) {
        found.add(event);
      }
    }

    return [...found];
  }

  function findDeadline(event) {
    const eventTime = parseTime(event.textContent);
    const ownDateTime = parseDateTimeElement(event);
    if (ownDateTime && (ownDateTime.getHours() !== 0 || ownDateTime.getMinutes() !== 0)) {
      return ownDateTime;
    }

    const ownDate = parseDate(event.textContent);
    if (ownDate) {
      return combineDateAndTime(ownDate, eventTime);
    }

    let node = event;

    while (node?.parentElement) {
      let sibling = node.previousElementSibling;

      while (sibling) {
        const date = parseDate(sibling.textContent);
        if (date) {
          return combineDateAndTime(date, eventTime);
        }
        sibling = sibling.previousElementSibling;
      }

      node = node.parentElement;
      if (node.matches(TIMELINE_SELECTORS.join(","))) {
        break;
      }
    }

    return null;
  }

  function decorateEvent(event) {
    const deadline = findDeadline(event);
    const existingBadge = event.querySelector(".moodle-deadline-badge");
    const state = deadline
      ? getDeadlineState(deadline)
      : { className: "moodle-deadline-unknown", label: "期限を取得できません" };

    event.classList.remove(
      "moodle-deadline-overdue",
      "moodle-deadline-today",
      "moodle-deadline-soon",
      "moodle-deadline-week",
      "moodle-deadline-later",
      "moodle-deadline-unknown",
    );
    event.classList.add("moodle-deadline-event", state.className);

    if (existingBadge) {
      existingBadge.textContent = state.label;
      return;
    }

    const badge = document.createElement("span");
    badge.className = "moodle-deadline-badge";
    badge.textContent = state.label;

    const title = event.querySelector("h3, h4, h5, h6, a, strong") ?? event;
    title.append(badge);
  }

  function decorateTimeline() {
    const timeline = findTimeline();

    if (!timeline) {
      return;
    }

    for (const event of findEvents(timeline)) {
      decorateEvent(event);
    }
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorateTimeline();
    });
  });

  addStyles();
  decorateTimeline();
  setInterval(decorateTimeline, 60_000);
  observer.observe(document.body, { childList: true, subtree: true });
})();
