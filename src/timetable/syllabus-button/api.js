(() => {
  async function convertCodeToSyllabusUrl(code) {
    const cachedUrl = await window.RitsSyllabusButton.getCachedSyllabusUrl(code);
    if (cachedUrl) {
      console.log(`[キャッシュ] ${code}: ${cachedUrl}`);
      return cachedUrl;
    }

    try {
      const res = await fetch(
        `https://withered-salad-b4aa.yudai-syllabus.workers.dev/syllabus?code=${code}`,
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const syllabusUrl = await res.text();

      if (syllabusUrl?.startsWith("https://")) {
        await window.RitsSyllabusButton.saveCachedSyllabusUrl(code, syllabusUrl);
        console.log(`[API] ${code}: ${syllabusUrl}`);
        return syllabusUrl;
      }
    } catch (error) {
      console.error("シラバスURLの取得に失敗しました:", error);
    }

    return null;
  }

  // グローバルオブジェクトに登録して他ファイルから参照可能にする
  window.RitsSyllabusButton = window.RitsSyllabusButton || {};
  window.RitsSyllabusButton.convertCodeToSyllabusUrl = convertCodeToSyllabusUrl;
})();
