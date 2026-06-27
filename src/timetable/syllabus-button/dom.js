(() => {
  const BUTTON_CLASS = "my-syllabus-btn";
  const BUTTON_WRAP_CLASS = "my-syllabus-btn-wrap";
  const ADDED_ATTR = "data-syllabus-button-added";

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
      const syllabusUrl = await window.RitsSyllabusButton.convertCodeToSyllabusUrl(code);
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

      const buttonWrap = document.createElement("div");
      buttonWrap.classList.add(BUTTON_WRAP_CLASS);
      buttonWrap.appendChild(button);

      subjectElement.appendChild(buttonWrap);
      subjectElement.setAttribute(ADDED_ATTR, "true");
    }
  }

  // イベントデリゲーション：ドキュメント全体でシラバスボタンのクリックを一括監視
  document.addEventListener("click", (event) => {
    const button = event.target.closest(`.${BUTTON_CLASS}`);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const subjectElement = button.closest(".subject");
    if (subjectElement) {
      handleSyllabusClick(subjectElement, button);
    }
  });

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsSyllabusButton = window.RitsSyllabusButton || {};
  window.RitsSyllabusButton.addButtons = addButtons;
})();
