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
      margin-top: 12px;
    }

    .${BUTTON_CLASS} {
      background-color: #E6F4EA;
      color: #1E8E3E;
      font-size: 12px;
      line-height: 1;
      padding: 8px 18px;
      border: 1px solid #B7E1C1;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.1s ease;
      white-space: nowrap;
    }

    .${BUTTON_CLASS}:hover {
      background-color: #D2EEDB;
      color: #137333;
      border-color: #81C995;
      box-shadow: 0 3px 8px rgba(30, 142, 62, 0.22);
      transform: translateY(-1px);
    }

    .${BUTTON_CLASS}:active {
      transform: translateY(0) scale(0.97);
      box-shadow: 0 1px 4px rgba(30, 142, 62, 0.2);
    }

    .${BUTTON_CLASS}:focus-visible {
      outline: 3px solid rgba(30, 142, 62, 0.25);
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
