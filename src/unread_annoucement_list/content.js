(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  function initLayout() {
    const timetableBlock = document.querySelector(
      '[data-block="rutime_table"], .block_rutime_table',
    );
    const timelineBlock = document.querySelector(
      '[data-block="timeline"], .block_timeline, .block-timeline',
    );

    if (timetableBlock && timelineBlock) {
      const contentRegion = document.querySelector('[data-blockregion="content"]');
      if (!contentRegion) return;

      let mainGrid = document.getElementById("rits-main-grid");
      if (!mainGrid) {
        mainGrid = document.createElement("div");
        mainGrid.id = "rits-main-grid";
        timetableBlock.parentNode.insertBefore(mainGrid, timetableBlock);
      }

      let leftCol = document.getElementById("rits-left-col");
      if (!leftCol) {
        leftCol = document.createElement("div");
        leftCol.id = "rits-left-col";
        mainGrid.appendChild(leftCol);
      }

      let rightCol = document.getElementById("rits-right-col");
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

        // 更新ボタンイベント
        const refreshBtn = announcePanel.querySelector("#rits-refresh-btn");
        if (refreshBtn) {
          refreshBtn.addEventListener("click", () => {
            sessionStorage.removeItem("rits_announce_cache");
            loadUnreadAnnouncements();
          });
        }

        loadUnreadAnnouncements();
      } else if (announcePanel.parentNode !== leftCol) {
        leftCol.appendChild(announcePanel);
      }

      if (timetableBlock.parentNode !== rightCol) {
        rightCol.appendChild(timetableBlock);
      }

      wrapTimetableIcons(timetableBlock);
      cleanClassroomLabels(timetableBlock);
    }
  }

  // ============================================================
  // 未読アナウンスパネルのUI生成
  // ============================================================
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

  // ============================================================
  // 時間割表からコース一覧取得
  // ============================================================
  function getCourseList() {
    const courses = [];
    const seen = {};
    const links = document.querySelectorAll(
      '[data-block="rutime_table"] a[href*="course/view.php"]',
    );
    for (const a of links) {
      const m = a.href.match(/[?&]id=(\d+)/);
      if (!m || seen[m[1]]) continue;
      seen[m[1]] = true;
      courses.push({ id: Number.parseInt(m[1]), name: a.textContent.trim(), href: a.href });
    }
    return courses;
  }

  // ============================================================
  // コースページからアナウンスフォーラムIDを取得
  // ============================================================
  function getAnnouncementForumId(courseId) {
    return fetch(`/course/view.php?id=${courseId}`)
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const links = doc.querySelectorAll('a[href*="forum/view.php"]');
        for (let i = 0; i < links.length; i++) {
          const t = links[i].textContent.trim();
          if (
            t.indexOf("\u30A2\u30CA\u30A6\u30F3") >= 0 ||
            t.indexOf("\u30CB\u30E5\u30FC\u30B9") >= 0 ||
            t.indexOf("\u304A\u77E5\u3089\u305B") >= 0
          ) {
            const m = links[i].href.match(/[?&]id=(\d+)/);
            if (m) return m[1];
          }
        }
        return null;
      })
      .catch(() => null);
  }

  // ============================================================
  // フォーラムから未読投稿一覧を取得
  // ============================================================
  function getUnreadPosts(forumId) {
    return fetch(`/mod/forum/view.php?id=${forumId}`)
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const posts = [];
        for (const tr of doc.querySelectorAll("tr.hasunread")) {
          let title = "";
          let href = "";
          let date = "";
          for (const a of tr.querySelectorAll("a")) {
            const h = a.href || "";
            const t = a.textContent.trim();
            if (
              h.indexOf("discuss.php") >= 0 &&
              h.indexOf("parent=") < 0 &&
              h.indexOf("#unread") < 0 &&
              t
            ) {
              title = t;
              href = h;
            }
            if (h.indexOf("parent=") >= 0 && t) date = t;
          }
          if (title && href) posts.push({ title: title, href: href, date: date });
        }
        return posts;
      })
      .catch(() => []);
  }

  // ============================================================
  // アナウンス一覧レンダリング
  // ============================================================
  function renderAnnouncements(container, results) {
    if (!results || results.length === 0) {
      container.innerHTML = '<div class="rits-empty">未読アナウンスはありません</div>';
      return;
    }
    let html = "";
    for (const item of results) {
      const shortName = item.course.name.replace(/^\d+:/, "").split("\u00A7")[0].trim();
      html += '<div class="rits-course-section">';
      html += '<div class="rits-course-header">';
      html += `<a href="${esc(item.course.href)}" title="${esc(item.course.name)}">${esc(shortName)}</a>`;
      html += `<span class="rits-unread-badge">${item.posts.length}件</span>`;
      html += "</div>";
      html += '<div class="rits-post-list">';
      for (const p of item.posts) {
        html += '<div class="rits-post-item">';
        html += `<div class="rits-post-title"><a href="${esc(p.href)}" target="_blank">${esc(p.title)}</a></div>`;
        html += `<span class="rits-post-date">${esc(p.date)}</span>`;
        html += "</div>";
      }
      html += "</div>";
      html += "</div>";
    }
    html += `<div style="text-align:right;font-size:10px;color:#94a3b8;padding:10px 4px 0;">最終更新: ${new Date().toLocaleTimeString("ja-JP")}</div>`;
    container.innerHTML = html;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ============================================================
  // 未読アナウンス読み込みメイン（キャッシュ付き）
  // ============================================================
  function loadUnreadAnnouncements() {
    const panelBody = document.querySelector("#rits-announce-panel .rits-panel-body");
    if (!panelBody) return;
    panelBody.innerHTML =
      '<div class="rits-loading"><span class="rits-loading-spinner"></span>読み込み中...</div>';

    const CACHE_KEY = "rits_announce_cache";
    const CACHE_TTL = 5 * 60 * 1000;
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        renderAnnouncements(panelBody, cached.data);
        return;
      }
    } catch (e) {}

    const courses = getCourseList();
    const allResults = [];
    let idx = 0;

    function processNext() {
      if (idx >= courses.length) {
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: allResults }),
          );
        } catch (e) {}
        renderAnnouncements(panelBody, allResults);
        return;
      }
      const course = courses[idx++];
      getAnnouncementForumId(course.id)
        .then((forumId) => {
          if (!forumId) {
            processNext();
            return Promise.resolve([]);
          }
          return getUnreadPosts(forumId);
        })
        .then((posts) => {
          if (posts && posts.length > 0) allResults.push({ course: course, posts: posts });
          processNext();
        })
        .catch(() => {
          processNext();
        });
    }
    processNext();
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

  // Moodleの非同期描画に対応するためのMutationObserver
  const observer = new MutationObserver(() => {
    initLayout();
  });

  // 初回実行と監視開始
  initLayout();
  observer.observe(document.body, { childList: true, subtree: true });
})();
