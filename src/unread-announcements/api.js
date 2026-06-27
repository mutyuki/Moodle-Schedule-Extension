(() => {
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
  async function getAnnouncementForumId(courseId) {
    try {
      const res = await fetch(`/course/view.php?id=${courseId}`);
      if (!res.ok) return null;
      const html = await res.text();
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
    } catch (error) {
      console.error(`Failed to get announcement forum ID for course ${courseId}:`, error);
    }
    return null;
  }

  // ============================================================
  // フォーラムから未読投稿一覧を取得
  // ============================================================
  async function getUnreadPosts(forumId) {
    try {
      const res = await fetch(`/mod/forum/view.php?id=${forumId}`);
      if (!res.ok) return [];
      const html = await res.text();
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
    } catch (error) {
      console.error(`Failed to get unread posts for forum ${forumId}:`, error);
      return [];
    }
  }

  function renderAnnouncements(container, results) {
    if (!results || results.length === 0) {
      container.innerHTML = '<div class="rits-empty">未読アナウンスはありません</div>';
      return;
    }

    const sections = results
      .map((item) => {
        const shortName = item.course.name.replace(/^\d+:/, "").split("\u00A7")[0].trim();
        const postItems = item.posts
          .map(
            (p) => `
          <div class="rits-post-item">
            <div class="rits-post-title">
              <a href="${esc(p.href)}" target="_blank">${esc(p.title)}</a>
            </div>
            <span class="rits-post-date">${esc(p.date)}</span>
          </div>
        `,
          )
          .join("");

        return `
        <div class="rits-course-section">
          <div class="rits-course-header">
            <a href="${esc(item.course.href)}" title="${esc(item.course.name)}">${esc(shortName)}</a>
            <span class="rits-unread-badge">${item.posts.length}件</span>
          </div>
          <div class="rits-post-list">
            ${postItems}
          </div>
        </div>
      `;
      })
      .join("");

    const lastUpdated = `<div style="text-align:right;font-size:10px;color:#94a3b8;padding:10px 4px 0;">最終更新: ${new Date().toLocaleTimeString("ja-JP")}</div>`;

    container.innerHTML = sections + lastUpdated;
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
  async function loadUnreadAnnouncements() {
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

    for (const course of courses) {
      try {
        const forumId = await getAnnouncementForumId(course.id);
        if (!forumId) continue;
        const posts = await getUnreadPosts(forumId);
        if (posts && posts.length > 0) {
          allResults.push({ course: course, posts: posts });
        }
      } catch (error) {
        console.error(`Failed to load announcements for course ${course.id}:`, error);
      }
    }

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data: allResults }),
      );
    } catch (e) {}

    renderAnnouncements(panelBody, allResults);
  }

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsUnreadAnnouncementList = window.RitsUnreadAnnouncementList || {};
  window.RitsUnreadAnnouncementList.loadUnreadAnnouncements = loadUnreadAnnouncements;
})();
