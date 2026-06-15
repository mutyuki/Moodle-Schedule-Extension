// シラバスURLのキャッシュを保持する期間（ミリ秒）
// 7日間 = 7 * 24時間 * 60分 * 60秒 * 1000ミリ秒
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Moodleの時間割表から授業名を取得する関数
function getSubjects() {
  const subjects = [];

  for (const el of document.querySelectorAll(".subject")) {
    const a = el.querySelector("a.active-course-name");
    if (a) {
      subjects.push(a.textContent.trim());
    }
  }

  return subjects;
}

async function run() {
  const subjects = getSubjects();
  if (subjects.length === 0) return false;

  const subjectCodes = subjects.map(convertSubjectToCode);
  const syllabusUrls = await Promise.all(subjectCodes.map(convertCodeToSyllabusUrl));

  console.log("取得した授業一覧:", subjects);
  console.log("取得した授業コード一覧:", subjectCodes);
  console.log("生成したシラバスURL一覧:", syllabusUrls);
  // ここに処理を追加する
  return true;
}

function convertSubjectToCode(subject) {
  const code = subject.split(":")[0];
  return code;
}

// 授業コードから、chrome.storage.localで使うキーを作る関数
// 例: code が "ABC123" なら "syllabus:ABC123" になる
function createCacheKey(code) {
  return `syllabus:${code}`;
}

// 指定した授業コードのシラバスURLが、ローカル（chrome.storage.local）に
// キャッシュとして保存されているか確認する関数
// - キャッシュが無い、または有効期限が切れている場合は null を返す
// - 有効なキャッシュがある場合はそのURLを返す
async function getCachedSyllabusUrl(code) {
  try {
    const key = createCacheKey(code);
    const result = await chrome.storage.local.get(key);
    const cached = result[key];

    // キャッシュが保存されていない
    if (!cached) {
      return null;
    }

    // 有効期限が切れている場合は、古いキャッシュを削除してnullを返す
    if (cached.expiresAt <= Date.now()) {
      await chrome.storage.local.remove(key);
      return null;
    }

    // 有効なキャッシュが見つかったので、そのURLを返す
    return cached.syllabusUrl;
  } catch (error) {
    // ストレージの読み込みに失敗しても、Moodleの表示を止めずに
    // APIから取得する処理へフォールバックする
    console.error("キャッシュの読み込みに失敗しました:", error);
    return null;
  }
}

// APIから取得したシラバスURLを、ローカル（chrome.storage.local）に保存する関数
// 次回以降は同じ授業コードでAPIへアクセスせずに済むようにする
async function saveCachedSyllabusUrl(code, syllabusUrl) {
  try {
    const key = createCacheKey(code);

    await chrome.storage.local.set({
      [key]: {
        courseCode: code,
        syllabusUrl,
        // 現在時刻からCACHE_TTL_MS（7日間）後を有効期限とする
        expiresAt: Date.now() + CACHE_TTL_MS,
      },
    });
  } catch (error) {
    // 保存に失敗しても、取得済みのURLは利用できるようにするため
    // ここではエラーを表示するだけにする
    console.error("キャッシュの保存に失敗しました:", error);
  }
}

async function convertCodeToSyllabusUrl(code) {
  // 1. まずローカルキャッシュを確認する
  const cachedUrl = await getCachedSyllabusUrl(code);
  if (cachedUrl) {
    // キャッシュから取得できたことが分かるようにログを出す
    console.log(`[キャッシュ] ${code}: ${cachedUrl}`);
    return cachedUrl;
  }

  // 2. キャッシュが無い場合は、APIへアクセスして取得する
  const res = await fetch(
    `https://withered-salad-b4aa.yudai-syllabus.workers.dev/syllabus?code=${code}`,
  );

  const syllabus = await res.json();
  const syllabusUrl = `https://syllabus.ritsumei.ac.jp/syllabus/s/r-syllabus/${syllabus.salesforce_id}`;

  // 3. 正しく取得できた場合（salesforce_idが存在する場合）のみ、
  //    次回以降のためにローカルへ保存する
  if (syllabus.salesforce_id) {
    await saveCachedSyllabusUrl(code, syllabusUrl);
  }

  // APIから新たに取得したことが分かるようにログを出す
  console.log(`[API] ${code}: ${syllabusUrl}`);

  return syllabusUrl;
}

// 要素が動的に追加されるのを監視
const observer = new MutationObserver(() => {
  run().then((success) => {
    if (success) {
      observer.disconnect(); // 取得できたら監視終了
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
