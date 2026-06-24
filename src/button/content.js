(() => {
  const STYLE_ID = "rits-syllabus-button-style";
  const BUTTON_CLASS = "my-syllabus-btn";
  const BUTTON_WRAP_CLASS = "my-syllabus-btn-wrap";
  const ADDED_ATTR = "data-syllabus-button-added";
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

  // =========================
  // 1. ボタンのデザイン CSS
  // =========================
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
    .${BUTTON_WRAP_CLASS} {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 10px;
    }

    .${BUTTON_CLASS} {
      background-color: #f8fafc;
      color: #475569;
      font-size: 11px;
      line-height: 1;
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      letter-spacing: 0.02em;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      transition:
        background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.2s ease,
        transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      white-space: nowrap;
    }

    .${BUTTON_CLASS}:hover {
      background-color: hsl(356, 75%, 40%);
      color: #ffffff;
      border-color: hsl(356, 75%, 35%);
      box-shadow: 0 4px 10px rgba(184, 29, 36, 0.15);
      transform: translateY(-1px);
    }

    .${BUTTON_CLASS}:active {
      transform: translateY(0) scale(0.95);
      box-shadow: 0 1px 2px rgba(184, 29, 36, 0.05);
    }

    .${BUTTON_CLASS}:focus-visible {
      outline: 2px solid color-mix(in srgb, hsl(356, 75%, 40%) 50%, transparent);
      outline-offset: 2px;
    }
  `;

    document.head.appendChild(style);
  }

  // =========================
  // 2. 授業情報の文字列を取得
  // =========================
  function getSubjectText(subjectElement) {
    const clone = subjectElement.cloneNode(true);

    const removableEls = clone.querySelectorAll(`.${BUTTON_WRAP_CLASS}, .${BUTTON_CLASS}`);
    for (const el of removableEls) {
      el.remove();
    }

    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  // =========================
  // 3. 授業コードを抽出
  // =========================
  function extractCourseCodes(subjectElement) {
    const text = getSubjectText(subjectElement);
    const matches = [...text.matchAll(/(?:^|[^\d])(\d{5})(?=\s*[:：])/g)];
    return matches.map((match) => match[1]);
  }

  // =========================
  // 4. キャッシュ関連ロジック
  // =========================
  function createCacheKey(code) {
    return `syllabus:${code}`;
  }

  async function getCachedSyllabusUrl(code) {
    try {
      const key = createCacheKey(code);
      const result = await chrome.storage.local.get(key);
      const cached = result[key];

      if (!cached) {
        return null;
      }

      if (cached.expiresAt <= Date.now()) {
        await chrome.storage.local.remove(key);
        return null;
      }

      return cached.syllabusUrl;
    } catch (error) {
      console.error("キャッシュの読み込みに失敗しました:", error);
      return null;
    }
  }

  async function saveCachedSyllabusUrl(code, syllabusUrl) {
    try {
      const key = createCacheKey(code);

      await chrome.storage.local.set({
        [key]: {
          courseCode: code,
          syllabusUrl,
          expiresAt: Date.now() + CACHE_TTL_MS,
        },
      });
    } catch (error) {
      console.error("キャッシュの保存に失敗しました:", error);
    }
  }

  async function convertCodeToSyllabusUrl(code) {
    const cachedUrl = await getCachedSyllabusUrl(code);
    if (cachedUrl) {
      console.log(`[キャッシュ] ${code}: ${cachedUrl}`);
      return cachedUrl;
    }

    const res = await fetch(
      `https://withered-salad-b4aa.yudai-syllabus.workers.dev/syllabus?code=${code}`,
    );

    const syllabusUrl = await res.text();

    if (syllabusUrl?.startsWith("https://")) {
      await saveCachedSyllabusUrl(code, syllabusUrl);
      console.log(`[API] ${code}: ${syllabusUrl}`);
      return syllabusUrl;
    }

    return null;
  }

  // =========================
  // 5. シラバスボタンを押したときの処理
  // =========================
  async function handleSyllabusClick(subjectElement, button) {
    const courseCodes = extractCourseCodes(subjectElement);

    if (courseCodes.length === 0) {
      alert("授業コードを取得できませんでした。");
      console.log("授業コード取得失敗:", getSubjectText(subjectElement));
      return;
    }

    const code = courseCodes[0];
    const originalText = button.textContent;
    button.textContent = "取得中...";
    button.disabled = true;

    try {
      const syllabusUrl = await convertCodeToSyllabusUrl(code);
      if (syllabusUrl) {
        window.open(syllabusUrl, "_blank");
      } else {
        alert("シラバスURLが見つかりませんでした。");
      }
    } catch (error) {
      console.error("シラバスURL取得エラー:", error);
      alert("シラバス取得中にエラーが発生しました。");
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  // =========================
  // 6. ボタンを追加する処理
  // =========================
  function addButtons() {
    const subjects = document.querySelectorAll(`.subject:not([${ADDED_ATTR}])`);

    for (const subjectElement of subjects) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "シラバス";
      button.classList.add(BUTTON_CLASS);
      button.title = "この授業のシラバスを開く";
      button.setAttribute("aria-label", "この授業のシラバスを開く");

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        handleSyllabusClick(subjectElement, button);
      });

      const buttonWrap = document.createElement("div");
      buttonWrap.classList.add(BUTTON_WRAP_CLASS);
      buttonWrap.appendChild(button);

      subjectElement.appendChild(buttonWrap);
      subjectElement.setAttribute(ADDED_ATTR, "true");
    }
  }

  // =========================
  // 7. 初回実行と監視
  // =========================
  addButtons();

  const observer = new MutationObserver(() => {
    addButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
