(() => {
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
    const ownDateTime = window.RitsMoodleDeadlineColors.parseDateTimeElement(event);
    if (ownDateTime) {
      return ownDateTime;
    }

    const ownDate = window.RitsMoodleDeadlineColors.parseDate(event.textContent);
    let date = ownDate;

    if (!date) {
      let node = event;

      while (node?.parentElement) {
        let sibling = node.previousElementSibling;

        while (sibling) {
          const d = window.RitsMoodleDeadlineColors.parseDate(sibling.textContent);
          if (d) {
            date = d;
            break;
          }
          sibling = sibling.previousElementSibling;
        }
        if (date) {
          break;
        }

        node = node.parentElement;
        if (node.matches(TIMELINE_SELECTORS.join(","))) {
          break;
        }
      }
    }

    if (date) {
      const timeEl =
        event.querySelector(".timeline-name small.text-end") ||
        event.querySelector("small.text-end");
      if (timeEl) {
        const timeMatch = timeEl.textContent.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          date.setHours(Number(hours), Number(minutes), 0, 0);
        }
      }
    }

    return date;
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
      ? window.RitsMoodleDeadlineColors.getDeadlineState(deadline)
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

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsMoodleDeadlineColors = window.RitsMoodleDeadlineColors || {};
  window.RitsMoodleDeadlineColors.decorateTimeline = decorateTimeline;
})();
