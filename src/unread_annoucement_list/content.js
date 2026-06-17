// ============================================================
// Moodle+R ダッシュボード拡張 (content.js)
// 立命館大学 lms.ritsumei.ac.jp 専用
// 機能: 上部をタイムライン|未読アナウンスの2段組に変更
//       My時間割表・コース概要はそのまま1列表示
// ============================================================
(() => {
  if (!window.location.pathname.startsWith("/my")) return;

  const MAX_WAIT_MS = 20000;
  const CHECK_INTERVAL = 500;
  let elapsed = 0;

  function waitForBlocks() {
    const timetableBlock = document.querySelector('[data-block="rutime_table"]');
    const timelineBlock = document.querySelector('[data-block="timeline"]');
    if (timetableBlock && timelineBlock) {
      setTimeout(initDashboard, 300);
    } else if (elapsed < MAX_WAIT_MS) {
      elapsed += CHECK_INTERVAL;
      setTimeout(waitForBlocks, CHECK_INTERVAL);
    }
  }
  waitForBlocks();

  // ============================================================
  // レイアウト初期化
  // ============================================================
  function initDashboard() {
    const contentRegion = document.querySelector('[data-blockregion="content"]');
    if (!contentRegion || document.getElementById("rits-top-grid")) return;

    const timelineBlock = contentRegion.querySelector('[data-block="timeline"]');
    const timetableBlock = contentRegion.querySelector('[data-block="rutime_table"]');
    if (!timelineBlock || !timetableBlock) return;

    // 上部2段組グリッド（タイムライン | 未読アナウンス）
    const topGrid = document.createElement("div");
    topGrid.id = "rits-top-grid";

    const leftCol = document.createElement("div");
    leftCol.id = "rits-col-left";
    leftCol.appendChild(timelineBlock);

    const rightCol = document.createElement("div");
    rightCol.id = "rits-col-right";
    rightCol.appendChild(createAnnouncePanel());

    topGrid.appendChild(leftCol);
    topGrid.appendChild(rightCol);

    // timetableBlock（My時間割表）の直前に挿入
    // → グリッド → 時間割表 → コース概要 の順になる
    contentRegion.insertBefore(topGrid, timetableBlock);

    // 更新ボタン
    document.getElementById("rits-refresh-btn").addEventListener("click", () => {
      sessionStorage.removeItem("rits_announce_cache");
      loadUnreadAnnouncements();
    });

    loadUnreadAnnouncements();
  }

  // ============================================================
  // 未読アナウンスパネルのUI生成
  // ============================================================
  function createAnnouncePanel() {
    const panel = document.createElement("div");
    panel.id = "rits-announce-panel";
    panel.innerHTML =
      '<div class="rits-panel-header">' +
      "<h3><span>\uD83D\uDCE2</span> \u672A\u8AAD\u30A2\u30CA\u30A6\u30F3\u30B9</h3>" +
      '<button class="rits-refresh-btn" id="rits-refresh-btn">\u21BB \u66F4\u65B0</button>' +
      "</div>" +
      '<div class="rits-panel-body">' +
      '<div class="rits-loading"><span class="rits-loading-spinner"></span>\u8AAD\u307F\u8FBC\u307F\u4E2D...</div>' +
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
      container.innerHTML =
        '<div class="rits-empty">\u672A\u8AAD\u30A2\u30CA\u30A6\u30F3\u30B9\u306F\u3042\u308A\u307E\u305B\u3093</div>';
      return;
    }
    let html = "";
    for (const item of results) {
      const shortName = item.course.name.replace(/^\d+:/, "").split("\u00A7")[0].trim();
      html += '<div class="rits-course-section">';
      html += '<div class="rits-course-header">';
      html += `<a href="${esc(item.course.href)}" title="${esc(item.course.name)}">${esc(shortName)}</a>`;
      html += `<span class="rits-unread-badge">${item.posts.length}\u4EF6</span>`;
      html += "</div>";
      for (const p of item.posts) {
        html += '<div class="rits-post-item">';
        html += `<div class="rits-post-title"><a href="${esc(p.href)}" target="_blank">${esc(p.title)}</a></div>`;
        html += `<span class="rits-post-date">${esc(p.date)}</span>`;
        html += "</div>";
      }
      html += "</div>";
    }
    html += `<div style="text-align:right;font-size:0.7rem;color:#bbb;padding:8px 4px 0;">\u66F4\u65B0: ${new Date().toLocaleTimeString("ja-JP")}</div>`;
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
      '<div class="rits-loading"><span class="rits-loading-spinner"></span>\u8AAD\u307F\u8FBC\u307F\u4E2D...</div>';

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
})();
