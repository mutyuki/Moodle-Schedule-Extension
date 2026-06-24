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
      /* タイムライン全体のコンテナの余白削減 */
      .block_timeline [data-region="event-list-content"] {
        padding: 0 !important;
      }
      .block_timeline .list-group-item {
        border: none !important;
        background: transparent !important;
      }
      
      /* 元の日付ヘッダーを非表示にする (各行に日付を表示するため) */
      [data-region="event-list-content-date"] {
        display: none !important;
      }

      /* 日付と時間を縦に並べるコンテナ */
      .rits-datetime-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        justify-content: center !important;
        min-width: 68px !important;
        margin-right: 4px !important;
        flex-shrink: 0 !important;
      }
      .rits-timeline-date {
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        color: #475569 !important;
        line-height: 1.25 !important;
        letter-spacing: 0.02em !important;
      }

      /* 各イベントカード (一列のコンパクトな構成) */
      .moodle-deadline-event {
        border-left: 4px solid var(--deadline-color) !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-left-width: 4px !important;
        padding: 8px 12px !important;
        margin-bottom: 5px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
      }

      .moodle-deadline-event .d-flex.flex-wrap {
        flex-wrap: nowrap !important;
        align-items: center !important;
        width: 100% !important;
      }

      .timeline-name {
        display: flex !important;
        flex: 1 !important;
        align-items: center !important;
        min-width: 0 !important;
        margin-bottom: 0 !important;
      }

      /* イベント時間 */
      .timeline-name small.text-end {
        color: #64748b !important;
        font-weight: 500 !important;
        font-size: 0.72rem !important;
        line-height: 1.25 !important;
        margin-top: 1px !important;
        min-width: 0 !important;
        margin-left: 0 !important;
        text-align: right !important;
      }

      /* アイコンコンテナ */
      .activityiconcontainer.courseicon {
        margin: 0 10px !important;
        width: 24px !important;
        height: 24px !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background-color: #f1f5f9 !important;
        border-radius: 6px !important;
        flex-shrink: 0 !important;
      }
      .activityiconcontainer.courseicon img.icon {
        width: 14px !important;
        height: 14px !important;
        margin: 0 !important;
      }

      .event-name-container {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        min-width: 0 !important;
        flex: 1 !important;
      }

      .event-name {
        display: flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        font-size: 0.83rem !important;
        font-weight: 700 !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.35 !important;
      }

      .event-name a {
        color: #1e293b !important;
        text-decoration: none !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }
      .event-name a:hover {
        color: hsl(356, 75%, 40%) !important;
        text-decoration: underline !important;
      }

      .moodle-deadline-badge {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        border-radius: 6px;
        background: color-mix(in srgb, var(--deadline-color) 8%, #ffffff);
        color: var(--deadline-color);
        border: 1px solid color-mix(in srgb, var(--deadline-color) 20%, transparent);
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        padding: 2px 6px;
        vertical-align: middle;
        letter-spacing: 0.02em;
      }

      /* 科目情報と提出期限の重複文字削除後のCSS調整 */
      .event-name-container small.mb-0 {
        color: #64748b !important;
        font-size: 0.72rem !important;
        font-weight: 500 !important;
        margin-top: 2px !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      /* 右側のアクションボタンのコンパクト化 */
      .timeline-action-button {
        margin-left: 12px !important;
        align-self: center !important;
        margin-bottom: 0 !important;
        flex-shrink: 0 !important;
      }
      .timeline-action-button h6.event-action {
        margin: 0 !important;
        padding: 0 !important;
      }
      .timeline-action-button a.btn {
        font-size: 11px !important;
        padding: 4px 10px !important;
        border-radius: 6px !important;
        border: 1px solid #cbd5e1 !important;
        color: #475569 !important;
        background-color: #f8fafc !important;
        transition: all 0.2s ease !important;
        font-weight: 600 !important;
      }
      .timeline-action-button a.btn:hover {
        background-color: hsl(356, 75%, 40%) !important;
        color: #ffffff !important;
        border-color: hsl(356, 75%, 35%) !important;
        box-shadow: 0 2px 6px rgba(184, 29, 36, 0.15) !important;
      }

      /* 無駄なボーダー線の削除 */
      .moodle-deadline-event .border-bottom {
        display: none !important;
      }

      .moodle-deadline-overdue { --deadline-color: #dc2626; }
      .moodle-deadline-today { --deadline-color: #f43f5e; }
      .moodle-deadline-soon { --deadline-color: #ea580c; }
      .moodle-deadline-week { --deadline-color: #d97706; }
      .moodle-deadline-later { --deadline-color: #059669; }
      .moodle-deadline-unknown { --deadline-color: #64748b; }
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
    const ownDateTime = parseDateTimeElement(event);
    if (ownDateTime) {
      return ownDateTime;
    }

    const ownDate = parseDate(event.textContent);
    if (ownDate) {
      return ownDate;
    }

    let node = event;

    while (node?.parentElement) {
      let sibling = node.previousElementSibling;

      while (sibling) {
        const date = parseDate(sibling.textContent);
        if (date) {
          return date;
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

  function cleanEventText(event) {
    const small = event.querySelector(".event-name-container small, .timeline-name small.mb-0");
    if (small && !small.dataset.cleaned) {
      const text = small.textContent;
      const separator = text.includes("·") ? "·" : text.includes("・") ? "・" : null;
      if (separator) {
        const parts = text.split(separator);
        if (parts.length > 1) {
          small.textContent = parts[parts.length - 1].trim();
        }
      }
      small.dataset.cleaned = "true";
    }
  }

  function findDateText(event) {
    let node = event;
    while (node?.parentElement) {
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.matches('[data-region="event-list-content-date"]')) {
          return sibling.textContent.trim();
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

  function formatCompactDate(dateText) {
    if (!dateText) return "";
    const match = dateText.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日\((.+?)\)/);
    if (match) {
      const [, , month, day, weekday] = match;
      const shortWeekday = weekday.charAt(0); // "月曜日" -> "月"
      return `${Number(month)}/${Number(day)} (${shortWeekday})`;
    }
    const matchNoWeekday = dateText.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (matchNoWeekday) {
      const [, , month, day] = matchNoWeekday;
      return `${Number(month)}/${Number(day)}`;
    }
    return dateText;
  }

  function insertDateLabel(event) {
    if (event.querySelector(".rits-timeline-date")) {
      return;
    }
    const rawDate = findDateText(event);
    const compactDate = formatCompactDate(rawDate);
    if (!compactDate) return;

    const timeEl = event.querySelector(".timeline-name small.text-end");
    if (timeEl) {
      const dateSpan = document.createElement("span");
      dateSpan.className = "rits-timeline-date";
      dateSpan.textContent = compactDate;

      const dateTimeContainer = document.createElement("div");
      dateTimeContainer.className = "rits-datetime-container";

      timeEl.parentNode.insertBefore(dateTimeContainer, timeEl);
      dateTimeContainer.appendChild(dateSpan);
      dateTimeContainer.appendChild(timeEl);
    }
  }

  function cleanActionButton(event) {
    const actionLink = event.querySelector(".timeline-action-button a");
    if (actionLink && !actionLink.dataset.textCleaned) {
      const text = actionLink.textContent.trim();
      if (text.includes("提出をアップロード") || text.includes("提出を入力")) {
        actionLink.textContent = "提出";
      }
      actionLink.dataset.textCleaned = "true";
    }
  }

  function decorateEvent(event) {
    insertDateLabel(event);
    cleanEventText(event);
    cleanActionButton(event);
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
