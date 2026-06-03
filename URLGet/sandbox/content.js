// Moodleの時間割表から授業名を取得する関数
function getSubjects() {
  const subjects = [];

  document.querySelectorAll('.subject').forEach(el => {
    const a = el.querySelector('a.active-course-name');
    if (a) {
      subjects.push(a.textContent.trim());
    }
  });

  return subjects;
}

function run() {
  const subjects = getSubjects();
  if (subjects.length === 0) return false;

  console.log('取得した授業一覧:', subjects);
  // ここに処理を追加する
  return true;
}

// 要素が動的に追加されるのを監視
const observer = new MutationObserver(() => {
  const success = run();
  if (success) {
    observer.disconnect(); // 取得できたら監視終了
  }
});

observer.observe(document.body, { childList: true, subtree: true });