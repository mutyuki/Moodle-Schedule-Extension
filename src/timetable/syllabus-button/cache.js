(() => {
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

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

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsSyllabusButton = window.RitsSyllabusButton || {};
  window.RitsSyllabusButton.getCachedSyllabusUrl = getCachedSyllabusUrl;
  window.RitsSyllabusButton.saveCachedSyllabusUrl = saveCachedSyllabusUrl;
})();
