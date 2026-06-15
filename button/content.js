(() => {
  const STYLE_ID = 'rits-syllabus-button-style';
  const BUTTON_CLASS = 'my-syllabus-btn';
  const BUTTON_WRAP_CLASS = 'my-syllabus-btn-wrap';
  const ADDED_ATTR = 'data-syllabus-button-added';

  // =========================
// 1. ボタンのデザイン CSS
// =========================
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
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
    // 元の要素を直接いじらず、コピーしてからボタン部分を除去する
    const clone = subjectElement.cloneNode(true);

    // 追加済みのシラバスボタン部分を取り除く
    clone.querySelectorAll(`.${BUTTON_WRAP_CLASS}, .${BUTTON_CLASS}`).forEach((el) => {
      el.remove();
    });

    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  // =========================
  // 3. 授業コードを抽出
  // =========================
  function extractCourseCodes(subjectElement) {
    const text = getSubjectText(subjectElement);

    // 例:
    // 53169:英語中級107(5Q)
    // 53385:データモデル論(A1)
    // 53386:データモデリング(A1)
    //
    // 「5桁の数字 + : または ：」の5桁部分だけを取得
    const matches = [...text.matchAll(/(?:^|[^\d])(\d{5})(?=\s*[:：])/g)];

    return matches.map((match) => match[1]);
  }

  // =========================
  // 4. 授業名を取得
  // =========================
  function getCourseName(subjectElement) {
    const text = getSubjectText(subjectElement);

    // 授業コード部分を消して、だいたいの授業名だけにする
    return text
      .replace(/(?:^|[^\d])\d{5}\s*[:：]/g, '')
      .trim();
  }

  // =========================
  // 5. シラバスボタンを押したときの処理
  // =========================
  function handleSyllabusClick(subjectElement) {
    const courseCodes = extractCourseCodes(subjectElement);
    const courseName = getCourseName(subjectElement);

    if (courseCodes.length === 0) {
      alert('授業コードを取得できませんでした。');
      console.log('授業コード取得失敗:', getSubjectText(subjectElement));
      return;
    }

    // いったん確認用
    alert(
      `授業コード: ${courseCodes.join(', ')}\n` +
      `授業名: ${courseName}`
    );

    // 次の段階でここにシラバスページを開く処理を書く
    // 例:
    // const url = `https://シラバス検索URL?code=${courseCodes[0]}`;
    // window.open(url, '_blank');
  }

  // =========================
  // 6. ボタンを追加する処理
  // =========================
  function addButtons() {
    const subjects = document.querySelectorAll(`.subject:not([${ADDED_ATTR}])`);

    subjects.forEach((subjectElement) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'シラバス';
      button.classList.add(BUTTON_CLASS);
      button.title = 'この授業のシラバスを開く';
      button.setAttribute('aria-label', 'この授業のシラバスを開く');

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        handleSyllabusClick(subjectElement);
      });

      // wrapperを作って中央寄せする
      const buttonWrap = document.createElement('div');
      buttonWrap.classList.add(BUTTON_WRAP_CLASS);
      buttonWrap.appendChild(button);

      subjectElement.appendChild(buttonWrap);

      // 二重追加防止
      subjectElement.setAttribute(ADDED_ATTR, 'true');
    });
  }

  // =========================
  // 7. 初回実行
  // =========================
  addButtons();

  // =========================
  // 8. Moodleの動的読み込みに対応
  // =========================
  const observer = new MutationObserver(() => {
    addButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();